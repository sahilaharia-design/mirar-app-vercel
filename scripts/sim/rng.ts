export type Rng = () => number;
/** mulberry32: deterministic, seedable. Same seed → same synthetic user, always. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const pickWeighted = <T>(r: Rng, items: { v: T; w: number }[]): T => {
  const tot = items.reduce((a, x) => a + Math.max(0, x.w), 0);
  if (tot <= 0) return items[0].v;
  let x = r() * tot;
  for (const it of items) { x -= Math.max(0, it.w); if (x <= 0) return it.v; }
  return items[items.length - 1].v;
};
