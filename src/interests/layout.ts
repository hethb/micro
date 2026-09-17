import { createRng } from '@/feed/rng';

import type { GraphNode, InterestGraph } from './graph';

export interface Point {
  x: number;
  y: number;
}

interface LayoutOptions {
  width: number;
  height: number;
  /** Keeps nodes (and their labels) this far from the edges. */
  padding?: number;
  iterations?: number;
  seed?: number;
  /** On-screen footprint of each node (circle plus label), used to keep them from overlapping. */
  footprint?: (node: GraphNode) => Footprint;
}

/** Space a node occupies around its centre: full width, and extent above and below (labels hang below). */
export interface Footprint {
  width: number;
  above: number;
  below: number;
}

const DEFAULT_FOOTPRINT: Footprint = { width: 88, above: 12, below: 32 };

/** Extra pull on each edge kind, relative to a plain spring. */
const EDGE_PULL = { topic: 1.4, shared: 1, related: 0.5 } as const;
const GRAVITY = 0.05;
const COLLISION_PASSES = 200;

/**
 * Deterministic force-directed layout (Fruchterman–Reingold). Topic hubs start on a
 * ring and their concepts start near them, so clusters settle around their topic. The
 * result is stretched to fill the canvas, then nudged apart so labels don't overlap.
 */
export function layoutGraph(graph: InterestGraph, options: LayoutOptions): Map<string, Point> {
  const { width, height, padding = 48, iterations = 300, seed = 7 } = options;
  const footprint = options.footprint ?? (() => DEFAULT_FOOTPRINT);
  const rng = createRng(seed);
  const cx = width / 2;
  const cy = height / 2;
  const nodes = graph.nodes;
  const positions = new Map<string, Point>();
  if (nodes.length === 0) return positions;

  const hubs = nodes.filter((n) => n.kind === 'topic');
  const ring = Math.min(width, height) * 0.3;
  const hubPosition = new Map<string, Point>();
  hubs.forEach((hub, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, hubs.length) - Math.PI / 2;
    const point = hubs.length === 1 ? { x: cx, y: cy } : { x: cx + ring * Math.cos(angle), y: cy + ring * Math.sin(angle) };
    hubPosition.set(hub.topic, point);
    positions.set(hub.id, { ...point });
  });
  for (const node of nodes) {
    if (node.kind === 'topic') continue;
    const anchor = hubPosition.get(node.topic) ?? { x: cx, y: cy };
    positions.set(node.id, { x: anchor.x + (rng() - 0.5) * 80, y: anchor.y + (rng() - 0.5) * 80 });
  }

  const area = (width - 2 * padding) * (height - 2 * padding);
  const k = Math.sqrt(area / nodes.length) * 0.75;
  let temperature = Math.min(width, height) / 8;
  const cooling = temperature / (iterations + 1);

  for (let step = 0; step < iterations; step++) {
    const shift = new Map<string, Point>(nodes.map((n) => [n.id, { x: 0, y: 0 }]));

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!;
        const b = positions.get(nodes[j].id)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          // Coincident nodes: nudge apart in a seeded direction.
          dx = rng() - 0.5;
          dy = rng() - 0.5;
          dist = Math.hypot(dx, dy);
        }
        const force = (k * k) / dist;
        const sa = shift.get(nodes[i].id)!;
        const sb = shift.get(nodes[j].id)!;
        sa.x += (dx / dist) * force;
        sa.y += (dy / dist) * force;
        sb.x -= (dx / dist) * force;
        sb.y -= (dy / dist) * force;
      }
    }

    for (const edge of graph.edges) {
      const a = positions.get(edge.source);
      const b = positions.get(edge.target);
      if (!a || !b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.max(0.01, Math.hypot(dx, dy));
      const force = ((dist * dist) / k) * EDGE_PULL[edge.kind] * Math.min(2, Math.sqrt(edge.weight));
      const sa = shift.get(edge.source)!;
      const sb = shift.get(edge.target)!;
      sa.x -= (dx / dist) * force;
      sa.y -= (dy / dist) * force;
      sb.x += (dx / dist) * force;
      sb.y += (dy / dist) * force;
    }

    for (const node of nodes) {
      const p = positions.get(node.id)!;
      const s = shift.get(node.id)!;
      // Gentle gravity keeps disconnected clusters from drifting to the walls.
      s.x += (cx - p.x) * GRAVITY;
      s.y += (cy - p.y) * GRAVITY;
      const length = Math.max(0.01, Math.hypot(s.x, s.y));
      const move = Math.min(length, temperature);
      p.x += (s.x / length) * move;
      p.y += (s.y / length) * move;
    }
    temperature = Math.max(0.5, temperature - cooling);
  }

  const bounds = { minX: padding, maxX: width - padding, minY: padding, maxY: height - padding };
  fitToBounds([...positions.values()], bounds);
  separate(
    nodes.map((node) => ({ point: positions.get(node.id)!, size: footprint(node) })),
    bounds,
  );
  return positions;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Scales and centres the points to fill the bounds (each axis independently, so tall screens get used). */
function fitToBounds(points: Point[], bounds: Bounds) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const offsetX = Math.min(...xs);
  const offsetY = Math.min(...ys);
  for (const p of points) {
    p.x = spanX < 1 ? (bounds.minX + bounds.maxX) / 2 : bounds.minX + ((p.x - offsetX) / spanX) * (bounds.maxX - bounds.minX);
    p.y = spanY < 1 ? (bounds.minY + bounds.maxY) / 2 : bounds.minY + ((p.y - offsetY) / spanY) * (bounds.maxY - bounds.minY);
  }
}

/** Pushes apart any two nodes whose footprints overlap, along the axis that needs the smaller move. */
function separate(items: { point: Point; size: Footprint }[], bounds: Bounds) {
  for (let pass = 0; pass < COLLISION_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        // Order the pair top-to-bottom so the vertical extents line up.
        const [top, bottom] = items[i].point.y <= items[j].point.y ? [items[i], items[j]] : [items[j], items[i]];
        const dx = bottom.point.x - top.point.x;
        const overlapX = (top.size.width + bottom.size.width) / 2 - Math.abs(dx);
        const overlapY = top.size.below + bottom.size.above - (bottom.point.y - top.point.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        if (overlapY <= overlapX) {
          top.point.y -= overlapY / 2;
          bottom.point.y += overlapY / 2;
        } else {
          const push = (overlapX / 2) * (dx >= 0 ? 1 : -1);
          top.point.x -= push;
          bottom.point.x += push;
        }
      }
    }
    for (const { point } of items) {
      point.x = clamp(point.x, bounds.minX, bounds.maxX);
      point.y = clamp(point.y, bounds.minY, bounds.maxY);
    }
    if (!moved) return;
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
