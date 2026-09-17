import type { Format, TopicId } from './types';

export interface TopicMeta {
  id: TopicId;
  label: string;
  emoji: string;
  /** Two-stop gradient used as the card background. */
  gradient: readonly [string, string];
}

export const TOPICS: Record<TopicId, TopicMeta> = {
  psychology: { id: 'psychology', label: 'Psychology', emoji: '🧠', gradient: ['#7F5AF0', '#2CB1BC'] },
  money: { id: 'money', label: 'Money & Investing', emoji: '💸', gradient: ['#0F9D58', '#0B3D2E'] },
  history: { id: 'history', label: 'History', emoji: '🏛️', gradient: ['#B7791F', '#4A2C0F'] },
  science: { id: 'science', label: 'Science', emoji: '🔬', gradient: ['#1E88E5', '#0D1B4C'] },
  space: { id: 'space', label: 'Space', emoji: '🪐', gradient: ['#3A1C71', '#0B0B2B'] },
  health: { id: 'health', label: 'Health & Fitness', emoji: '💪', gradient: ['#E53E3E', '#5A1414'] },
  productivity: { id: 'productivity', label: 'Productivity', emoji: '⚡️', gradient: ['#F6AD55', '#9C4221'] },
  tech: { id: 'tech', label: 'Tech & AI', emoji: '🤖', gradient: ['#00B4D8', '#03045E'] },
};

export const FORMAT_LABELS: Record<Format, string> = {
  video: 'Videos',
  fact: 'Facts',
  book: 'Book summaries',
  quote: 'Quotes',
};
