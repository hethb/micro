import type { Card, Concept, TopicId } from '@/content/types';
import type { EngagementSignal } from '@/feed/types';

import { buildInterestGraph, topicNodeId, type GraphNode, type InterestInput } from '../graph';
import { layoutGraph } from '../layout';

const concept = (id: string, topic: TopicId, related: string[] = []): Concept => ({
  id,
  label: id,
  topic,
  related,
});

const CONCEPTS = new Map(
  [
    concept('black-holes', 'space', ['relativity']),
    concept('relativity', 'science', ['black-holes']),
    concept('exoplanets', 'space'),
    concept('habits', 'productivity', ['sleep']),
    concept('sleep', 'health', ['habits']),
    concept('compound-interest', 'money'),
  ].map((c) => [c.id, c]),
);

const fact = (id: string, topic: TopicId, concepts: string[]): Card => ({
  id,
  topic,
  concepts,
  format: 'fact',
  depth: 'light',
  headline: 'h',
  body: 'b',
  emoji: '✨',
  sourceLabel: 's',
  sourceUrl: 'https://example.com',
});

const CARDS = [
  fact('c1', 'space', ['black-holes', 'exoplanets']),
  fact('c2', 'space', ['exoplanets', 'black-holes']),
  fact('c3', 'productivity', ['habits', 'compound-interest']),
  fact('c4', 'health', ['sleep', 'habits']),
];

const save = (cardId: string, topic: TopicId): EngagementSignal => ({ type: 'save', format: 'fact', topic, cardId });

const input = (overrides: Partial<InterestInput> = {}): InterestInput => ({
  topics: [],
  events: [],
  followed: [],
  muted: [],
  cards: CARDS,
  concepts: CONCEPTS,
  ...overrides,
});

const stateOf = (graph: ReturnType<typeof buildInterestGraph>, id: string) => {
  const node = graph.nodes.find((n) => n.id === id);
  return node?.kind === 'concept' ? node.state : node?.kind;
};

describe('buildInterestGraph', () => {
  it('is empty with no topics and no activity', () => {
    expect(buildInterestGraph(input()).nodes).toEqual([]);
  });

  it('seeds a cold-start map from onboarding topics', () => {
    const graph = buildInterestGraph(input({ topics: ['space'] }));
    expect(stateOf(graph, topicNodeId('space'))).toBe('topic');
    expect(stateOf(graph, 'black-holes')).toBe('suggested');
    expect(stateOf(graph, 'exoplanets')).toBe('suggested');
    expect(stateOf(graph, 'habits')).toBeUndefined();
  });

  it('maps engaged concepts, links concepts from the same card, and suggests related ideas', () => {
    const graph = buildInterestGraph(input({ events: [save('c1', 'space')] }));
    expect(stateOf(graph, 'black-holes')).toBe('engaged');
    expect(stateOf(graph, 'exoplanets')).toBe('engaged');
    expect(stateOf(graph, 'relativity')).toBe('suggested');
    // Relativity lives under Science, so that hub appears too.
    expect(stateOf(graph, topicNodeId('science'))).toBe('topic');

    const shared = graph.edges.find((e) => e.kind === 'shared');
    expect([shared?.source, shared?.target].sort()).toEqual(['black-holes', 'exoplanets']);
    expect(graph.edges).toContainEqual(expect.objectContaining({ kind: 'related' }));
    expect(graph.edges).toContainEqual({ source: topicNodeId('space'), target: 'black-holes', kind: 'topic', weight: 1 });
  });

  it('ignores skipped cards when mapping engagement', () => {
    const skip: EngagementSignal = { ...save('c1', 'space'), type: 'skip' };
    expect(buildInterestGraph(input({ events: [skip] })).nodes).toEqual([]);
  });

  it('shows followed and muted concepts, and muted ones produce no suggestions', () => {
    const graph = buildInterestGraph(input({ followed: ['habits'], muted: ['black-holes'] }));
    expect(stateOf(graph, 'habits')).toBe('followed');
    expect(stateOf(graph, 'black-holes')).toBe('muted');
    expect(stateOf(graph, 'sleep')).toBe('suggested');
    expect(stateOf(graph, 'relativity')).toBeUndefined();
  });

  it('ignores concept ids that no longer exist', () => {
    const graph = buildInterestGraph(input({ followed: ['gone'] }));
    expect(graph.nodes).toEqual([]);
  });
});

describe('layoutGraph', () => {
  const graph = buildInterestGraph(input({ topics: ['space', 'health'], events: [save('c1', 'space'), save('c4', 'health')] }));

  it('places every node inside the padded canvas', () => {
    const positions = layoutGraph(graph, { width: 400, height: 600, padding: 40 });
    expect(positions.size).toBe(graph.nodes.length);
    for (const { x, y } of positions.values()) {
      expect(x).toBeGreaterThanOrEqual(40);
      expect(x).toBeLessThanOrEqual(360);
      expect(y).toBeGreaterThanOrEqual(40);
      expect(y).toBeLessThanOrEqual(560);
    }
  });

  it('is deterministic and keeps node footprints from overlapping', () => {
    const footprint = (node: GraphNode) =>
      node.kind === 'topic' ? { width: 100, above: 28, below: 60 } : { width: 88, above: 10, below: 42 };
    const a = layoutGraph(graph, { width: 400, height: 700, footprint });
    expect(layoutGraph(graph, { width: 400, height: 700, footprint })).toEqual(a);
    const placed = graph.nodes.map((node) => ({ ...a.get(node.id)!, size: footprint(node) }));
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const [top, bottom] = placed[i].y <= placed[j].y ? [placed[i], placed[j]] : [placed[j], placed[i]];
        const overlapX = (top.size.width + bottom.size.width) / 2 - Math.abs(bottom.x - top.x);
        const overlapY = top.size.below + bottom.size.above - (bottom.y - top.y);
        expect(overlapX > 1 && overlapY > 1).toBe(false);
      }
    }
  });
});
