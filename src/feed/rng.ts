/** Small deterministic PRNG (mulberry32). Returns floats in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks an index with probability proportional to its weight. Returns -1 if all weights are 0. */
export function weightedIndex(weights: readonly number[], rng: () => number): number {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return -1;
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll < 0) return i;
  }
  // Floating-point edge: fall back to the last positive weight.
  for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i;
  return -1;
}
