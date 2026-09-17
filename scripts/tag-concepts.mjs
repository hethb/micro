#!/usr/bin/env node
/**
 * Tags learning cards with fine-grained concepts using Gemini (free tier) and writes
 * src/content/seed/concepts.json, which powers the interest mind map and feed ranking.
 *
 *   GEMINI_API_KEY=... npm run tag-concepts            # tag only cards without concepts
 *   GEMINI_API_KEY=... npm run tag-concepts -- --all   # re-tag every card
 *
 * Get a free key at https://aistudio.google.com/apikey. Override the model with GEMINI_MODEL.
 * Existing concepts are sent with every request so the vocabulary stays stable and reused.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = join(ROOT, 'src/content/seed');
const OUT = join(SEED_DIR, 'concepts.json');
const TOPICS = ['psychology', 'money', 'history', 'science', 'space', 'health', 'productivity', 'tech'];
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const BATCH_SIZE = 20;
/** Free-tier requests are rate limited per minute; stay well under. */
const DELAY_MS = 6000;
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey');
  process.exit(1);
}
const retagAll = process.argv.includes('--all');

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const cards = ['videos', 'facts', 'books', 'quotes'].flatMap((name) => readJson(join(SEED_DIR, `${name}.json`)));
let existing = { concepts: [], cards: {} };
try {
  existing = readJson(OUT);
} catch {
  // First run: start from an empty vocabulary.
}

const concepts = new Map(retagAll ? [] : existing.concepts.map((c) => [c.id, c]));
const tags = retagAll ? {} : { ...existing.cards };
const pending = cards.filter((card) => !tags[card.id]?.length);
console.log(`${pending.length} of ${cards.length} cards to tag with ${MODEL}.`);

for (let i = 0; i < pending.length; i += BATCH_SIZE) {
  const batch = pending.slice(i, i + BATCH_SIZE);
  const result = await tagBatch(batch);
  mergeResult(result, batch);
  console.log(`Tagged ${Math.min(i + BATCH_SIZE, pending.length)}/${pending.length}`);
  if (i + BATCH_SIZE < pending.length) await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

// Drop concepts no card uses and related links to concepts that don't exist.
const used = new Set(Object.values(tags).flat());
for (const id of concepts.keys()) if (!used.has(id)) concepts.delete(id);
for (const concept of concepts.values()) {
  concept.related = [...new Set(concept.related)].filter((id) => id !== concept.id && concepts.has(id)).slice(0, 4);
}

const output = {
  concepts: [...concepts.values()].sort((a, b) => a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id)),
  cards: Object.fromEntries(cards.filter((c) => tags[c.id]).map((c) => [c.id, tags[c.id]])),
};
writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${output.concepts.length} concepts for ${Object.keys(output.cards).length} cards to ${OUT}`);

function describe(card) {
  switch (card.format) {
    case 'fact':
      return `${card.headline} ${card.body}`;
    case 'quote':
      return `"${card.text}" — ${card.author}. ${card.context}`;
    case 'book':
      return `${card.title} by ${card.author}: ${card.hook} ${card.slides.map((s) => s.heading).join('; ')}`;
    case 'video':
      return `${card.title}: ${card.caption}`;
    default:
      return JSON.stringify(card);
  }
}

async function tagBatch(batch) {
  const vocabulary = [...concepts.values()].map((c) => `${c.id} (${c.label}, ${c.topic})`).join('\n') || '(none yet)';
  const prompt = `You tag short learning cards with fine-grained concepts for an interest mind map.

Existing concepts (reuse these whenever they fit; shared concepts create links on the map):
${vocabulary}

Rules:
- Give every card 2 or 3 concept ids that reflect what the card is actually about.
- Only create a new concept when no existing one fits. New ids are kebab-case; labels are Sentence case, max 24 chars; topic is one of: ${TOPICS.join(', ')}.
- Concepts should be specific but reusable, e.g. "compound-interest", "black-holes", "cognitive-biases", "sleep". Reuse across topics when honest (e.g. "habits" for psychology and productivity).
- For each new concept give 1-4 related concept ids (existing or new) that someone interested in it would also enjoy.

Cards:
${batch.map((card) => `${card.id} [${card.topic}] ${describe(card)}`).join('\n')}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            newConcepts: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  label: { type: 'STRING' },
                  topic: { type: 'STRING', enum: TOPICS },
                  related: { type: 'ARRAY', items: { type: 'STRING' } },
                },
                required: ['id', 'label', 'topic', 'related'],
              },
            },
            cards: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: { id: { type: 'STRING' }, concepts: { type: 'ARRAY', items: { type: 'STRING' } } },
                required: ['id', 'concepts'],
              },
            },
          },
          required: ['newConcepts', 'cards'],
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status}): ${await response.text()}`);
  }
  const body = await response.json();
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) throw new Error(`Gemini returned no content: ${JSON.stringify(body).slice(0, 500)}`);
  return JSON.parse(text);
}

function mergeResult(result, batch) {
  for (const concept of result.newConcepts ?? []) {
    if (!ID_PATTERN.test(concept.id) || !TOPICS.includes(concept.topic) || concepts.has(concept.id)) continue;
    concepts.set(concept.id, {
      id: concept.id,
      label: String(concept.label).slice(0, 24),
      topic: concept.topic,
      related: concept.related ?? [],
    });
  }
  const batchIds = new Set(batch.map((card) => card.id));
  for (const entry of result.cards ?? []) {
    if (!batchIds.has(entry.id)) continue;
    const valid = [...new Set(entry.concepts)].filter((id) => concepts.has(id)).slice(0, 3);
    if (valid.length >= 2) tags[entry.id] = valid;
    else console.warn(`Skipping ${entry.id}: needs 2-3 known concepts, got ${JSON.stringify(entry.concepts)}`);
  }
}
