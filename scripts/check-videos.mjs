#!/usr/bin/env node
/**
 * Checks YouTube videos against what the feed needs: embeddable, family safe, vertical
 * (a Short) and short enough. Uses YouTube's public watch page + oEmbed; no API key.
 *
 *   node scripts/check-videos.mjs                # every video card and entertainment Short in the seed
 *   node scripts/check-videos.mjs ID [ID ...]    # specific video ids, prints metadata as JSON
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Learning videos must fit the 60s card budget; breaks are allowed to run longer. */
const MAX_LEARNING_SEC = 60;
const MAX_BREAK_SEC = 180;

export async function inspect(videoId) {
  const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en' };
  const [page, oembed] = await Promise.all([
    fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers }).then((r) => r.text()),
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/${videoId}&format=json`).then((r) =>
      r.ok ? r.json() : null,
    ),
  ]);
  const player = extractPlayerResponse(page);
  const details = player?.videoDetails;
  const micro = player?.microformat?.playerMicroformatRenderer;
  return {
    videoId,
    exists: Boolean(details && oembed),
    title: oembed?.title ?? details?.title ?? null,
    channel: oembed?.author_name ?? details?.author ?? null,
    lengthSeconds: details ? Number(details.lengthSeconds) : null,
    playableInEmbed: player?.playabilityStatus?.playableInEmbed ?? false,
    status: player?.playabilityStatus?.status ?? null,
    familySafe: micro?.isFamilySafe ?? null,
    vertical: oembed ? oembed.height > oembed.width : null,
    language: micro?.defaultLanguage ?? null,
    /** Caption tracks only exist when there's speech, so this is a cheap "someone is talking" check. */
    englishCaptions: (player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []).some((t) =>
      t.languageCode?.startsWith('en'),
    ),
    description: details?.shortDescription?.slice(0, 400) ?? null,
  };
}

function extractPlayerResponse(html) {
  const marker = 'var ytInitialPlayerResponse = ';
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const end = html.indexOf(';</script>', start);
  try {
    return JSON.parse(html.slice(start + marker.length, end));
  } catch {
    return null;
  }
}

function problems(info, maxSec, options = {}) {
  const issues = [];
  if (!info.exists) issues.push('not found');
  if (info.status && info.status !== 'OK') issues.push(`status ${info.status}`);
  if (!info.playableInEmbed) issues.push('embedding disabled');
  if (info.familySafe === false) issues.push('not family safe');
  if (info.vertical === false) issues.push('not vertical');
  if (info.lengthSeconds !== null && info.lengthSeconds > maxSec) issues.push(`${info.lengthSeconds}s > ${maxSec}s`);
  if (options.requireSpeech && !info.englishCaptions) issues.push('no English speech captions');
  return issues;
}

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length > 0) {
    for (const id of ids) {
      const info = await inspect(id);
      console.log(JSON.stringify({ ...info, problems: problems(info, MAX_LEARNING_SEC, { requireSpeech: true }) }, null, 2));
    }
    return;
  }

  const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
  const targets = [
    ...readJson('src/content/seed/videos.json').map((v) => ({ id: v.id, videoId: v.youtubeId, max: MAX_LEARNING_SEC, speech: true, card: v })),
    ...readJson('src/entertainment/seed/shorts.json').map((s) => ({ id: s.id, videoId: s.videoId, max: MAX_BREAK_SEC })),
  ];
  let failures = 0;
  for (const target of targets) {
    const info = await inspect(target.videoId);
    const issues = problems(info, target.max, { requireSpeech: target.speech });
    if (target.card && info.lengthSeconds !== null && Math.abs(info.lengthSeconds - target.card.durationSec) > 2) {
      issues.push(`durationSec ${target.card.durationSec} but video is ${info.lengthSeconds}s`);
    }
    if (issues.length > 0) failures++;
    console.log(`${issues.length ? '✗' : '✓'} ${target.id} (${target.videoId}) ${info.channel ?? ''}${issues.length ? ` — ${issues.join(', ')}` : ''}`);
  }
  console.log(`\n${targets.length - failures}/${targets.length} OK`);
  process.exitCode = failures > 0 ? 1 : 0;
}

await main();
