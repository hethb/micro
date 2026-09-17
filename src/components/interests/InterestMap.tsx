import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { TOPICS } from '@/content/topics';
import type { TopicId } from '@/content/types';
import type { GraphEdge, GraphNode, InterestGraph } from '@/interests/graph';
import { layoutGraph, type Footprint, type Point } from '@/interests/layout';
import { colors, radius, space, type } from '@/theme/tokens';

interface InterestMapProps {
  graph: InterestGraph;
  selectedId: string | null;
  onSelect(node: GraphNode): void;
}

const HUB_SIZE = 56;
const LABEL_WIDTH = 104;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
/** Roughly how many nodes fit on one screen before the canvas grows. */
const NODES_PER_SCREEN = 16;
/** The canvas never grows past what fits on screen at this zoom, so labels stay readable. */
const MIN_FIT_ZOOM = 0.65;

export function InterestMap({ graph, selectedId, onSelect }: InterestMapProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const growth = Math.min(1 / MIN_FIT_ZOOM, Math.max(1, Math.sqrt(graph.nodes.length / NODES_PER_SCREEN)));
  const canvas = { width: size.width * growth, height: size.height * growth };
  const fitZoom = 1 / growth;

  const positions = useMemo(
    () =>
      canvas.width > 0
        ? layoutGraph(graph, {
            width: canvas.width,
            height: canvas.height,
            padding: HUB_SIZE,
            footprint,
          })
        : new Map<string, Point>(),
    [graph, canvas.width, canvas.height],
  );

  const zoom = useSharedValue(fitZoom);
  const savedZoom = useSharedValue(fitZoom);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      savedX.set(offsetX.get());
      savedY.set(offsetY.get());
    })
    .onUpdate((e) => {
      offsetX.set(savedX.get() + e.translationX);
      offsetY.set(savedY.get() + e.translationY);
    });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedZoom.set(zoom.get());
    })
    .onUpdate((e) => {
      zoom.set(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, savedZoom.get() * e.scale)));
    });
  const gesture = Gesture.Simultaneous(pan, pinch);

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.get() }, { translateY: offsetY.get() }, { scale: zoom.get() }],
  }));

  const recenter = () => {
    offsetX.set(withTiming(0));
    offsetY.set(withTiming(0));
    zoom.set(withTiming(fitZoom));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>
          <Animated.View
            style={[
              styles.canvas,
              {
                width: canvas.width,
                height: canvas.height,
                left: (size.width - canvas.width) / 2,
                top: (size.height - canvas.height) / 2,
              },
              canvasStyle,
            ]}>
            {graph.edges.map((edge) => (
              <Edge key={`${edge.source}|${edge.target}`} edge={edge} positions={positions} />
            ))}
            {graph.nodes.map((node) => {
              const point = positions.get(node.id);
              return point ? (
                <Node
                  key={node.id}
                  node={node}
                  point={point}
                  selected={node.id === selectedId}
                  onPress={() => onSelect(node)}
                />
              ) : null;
            })}
          </Animated.View>
        </View>
      </GestureDetector>
      <Pressable onPress={recenter} style={styles.recenter} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.recenterText}>Recenter</Text>
      </Pressable>
    </View>
  );
}

function Edge({ edge, positions }: { edge: GraphEdge; positions: ReadonlyMap<string, Point> }) {
  const a = positions.get(edge.source);
  const b = positions.get(edge.target);
  if (!a || !b) return null;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const thickness = edge.kind === 'shared' ? Math.min(4, 1.5 + edge.weight * 0.5) : 1;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.edge,
        EDGE_STYLES[edge.kind],
        {
          width: length,
          height: thickness,
          left: (a.x + b.x) / 2 - length / 2,
          top: (a.y + b.y) / 2 - thickness / 2,
          transform: [{ rotate: `${Math.atan2(b.y - a.y, b.x - a.x)}rad` }],
        },
      ]}
    />
  );
}

function Node({ node, point, selected, onPress }: { node: GraphNode; point: Point; selected: boolean; onPress(): void }) {
  const topic = TOPICS[node.topic];
  const color = nodeColor(node.topic);

  if (node.kind === 'topic') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={topic.label}
        style={[styles.nodeWrap, { left: point.x - LABEL_WIDTH / 2, top: point.y - HUB_SIZE / 2 }]}>
        <View
          style={[
            styles.circle,
            { width: HUB_SIZE, height: HUB_SIZE, backgroundColor: color },
            selected && styles.selected,
          ]}>
          <Text style={styles.hubEmoji}>{topic.emoji}</Text>
        </View>
        <Text style={styles.hubLabel} numberOfLines={2}>
          {topic.label}
        </Text>
      </Pressable>
    );
  }

  const diameter = conceptDiameter(node);
  const look = {
    engaged: { backgroundColor: color },
    followed: { backgroundColor: color, borderWidth: 3, borderColor: colors.accent },
    suggested: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: color, backgroundColor: colors.bg },
    muted: { backgroundColor: colors.surfaceRaised, opacity: 0.5 },
  } as const;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${node.concept.label}, ${STATE_LABELS[node.state]}`}
      hitSlop={8}
      style={[styles.nodeWrap, { left: point.x - LABEL_WIDTH / 2, top: point.y - diameter / 2 }]}>
      <View
        style={[styles.circle, { width: diameter, height: diameter }, look[node.state], selected && styles.selected]}
      />
      <Text
        style={[styles.conceptLabel, node.state === 'suggested' && styles.dimLabel, node.state === 'muted' && styles.mutedLabel]}
        numberOfLines={2}>
        {node.concept.label}
      </Text>
    </Pressable>
  );
}

export const STATE_LABELS = {
  engaged: 'one of your interests',
  followed: 'showing more',
  muted: 'showing less',
  suggested: 'suggested',
} as const;

/** Label text is up to two lines below the circle. */
const LABEL_HEIGHT = 4 + 2 * 16;

function footprint(node: GraphNode): Footprint {
  const diameter = node.kind === 'topic' ? HUB_SIZE : conceptDiameter(node);
  return { width: LABEL_WIDTH - 16, above: diameter / 2, below: diameter / 2 + LABEL_HEIGHT };
}

/** Topic gradients are tuned for full-screen card backgrounds; lift them so they read on the dark map. */
function nodeColor(topic: TopicId): string {
  const hex = TOPICS[topic].gradient[0];
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16);
    return Math.round(value + (255 - value) * 0.3)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

function conceptDiameter(node: Extract<GraphNode, { kind: 'concept' }>): number {
  const base = 14 + Math.min(node.score, 2.5) * 10;
  return node.state === 'followed' ? Math.max(base, 26) : base;
}

const EDGE_STYLES = StyleSheet.create({
  topic: { backgroundColor: colors.border },
  shared: { backgroundColor: colors.accent, opacity: 0.55 },
  related: { backgroundColor: colors.textDim, opacity: 0.35 },
});

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  canvas: { position: 'absolute' },
  edge: { position: 'absolute', borderRadius: 2 },
  nodeWrap: { position: 'absolute', width: LABEL_WIDTH, alignItems: 'center', gap: 4 },
  circle: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  selected: { borderWidth: 3, borderColor: colors.text },
  hubEmoji: { fontSize: 26 },
  hubLabel: { ...type.small, fontWeight: '800', color: colors.text, textAlign: 'center' },
  conceptLabel: { fontSize: 11, lineHeight: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
  dimLabel: { color: colors.textMuted },
  mutedLabel: { color: colors.textDim, textDecorationLine: 'line-through' },
  recenter: {
    position: 'absolute',
    right: space.lg,
    top: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: space.xs + 2,
    paddingHorizontal: space.md,
  },
  recenterText: { ...type.small, color: colors.textMuted },
});
