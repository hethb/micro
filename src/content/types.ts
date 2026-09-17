export const TOPIC_IDS = [
  'psychology',
  'money',
  'history',
  'science',
  'space',
  'health',
  'productivity',
  'tech',
] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

export const FORMATS = ['video', 'fact', 'book', 'quote'] as const;
export type Format = (typeof FORMATS)[number];

export type Depth = 'light' | 'deep';

interface BaseCard {
  /** Globally unique, stable id, e.g. "fact-space-001". */
  id: string;
  topic: TopicId;
  depth: Depth;
  /** Fine-grained concept ids, AI-tagged into seed/concepts.json (see scripts/tag-concepts.mjs). */
  concepts?: readonly string[];
}

/** A specific idea inside a topic, e.g. "Compound interest". Nodes of the interest mind map. */
export interface Concept {
  /** Kebab-case, stable. */
  id: string;
  label: string;
  /** The topic this concept sits under on the map. */
  topic: TopicId;
  /** Concepts someone interested in this one would plausibly also enjoy. */
  related: readonly string[];
}

export interface FactCard extends BaseCard {
  format: 'fact';
  /** One punchy sentence, max ~90 chars. */
  headline: string;
  /** 1–2 sentences of context, max ~220 chars. */
  body: string;
  emoji: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface QuoteCard extends BaseCard {
  format: 'quote';
  /** Short quote, max ~160 chars. */
  text: string;
  author: string;
  /** One line on who/when/why it matters, max ~120 chars. */
  context: string;
}

export interface BookSlide {
  heading: string;
  /** Max ~200 chars. */
  body: string;
}

export interface BookCard extends BaseCard {
  format: 'book';
  title: string;
  author: string;
  /** Hook shown on the cover slide, max ~100 chars. */
  hook: string;
  /** 3–5 key-idea slides. */
  slides: BookSlide[];
  /** One-line action the reader can apply today. */
  takeaway: string;
}

export interface VideoCard extends BaseCard {
  format: 'video';
  title: string;
  /** Caption overlay, max ~140 chars. */
  caption: string;
  /** A YouTube Short of a real educator teaching, played through YouTube's official embed. */
  youtubeId: string;
  /** The creator's YouTube channel name, credited on the card. */
  channel: string;
  /** ≤ 60; verified by scripts/check-videos.mjs. */
  durationSec: number;
}

export type Card = FactCard | QuoteCard | BookCard | VideoCard;
