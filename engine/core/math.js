// Pure maths shared by every film. No state, no clock: everything is a function of its arguments (Opuscar renders frames out of order).
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const D2R = Math.PI / 180, TAU = Math.PI * 2;
export const EASE = {
  lin: u => u,
  i: u => u * u, o: u => 1 - (1 - u) * (1 - u), io: u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u),
  i3: u => u * u * u, o3: u => 1 - (1 - u) ** 3,
  back: u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
  el: u => u === 0 || u === 1 ? u : Math.pow(2, -10 * u) * Math.sin((u * 10 - .75) * (TAU / 3)) + 1,
};
// the Panteões names, kept so old code can switch to imports unchanged
export const eio = EASE.io, eo = EASE.o3, ei = EASE.i3, back = EASE.back;
// keyframes [[t, v, ease?], ...]: eased between keys (ease of the arriving key), held outside. From cisma/lib.js K().
export function K(t, keys, ease = 'io') {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [a, va] = keys[i - 1], [b, vb, e] = keys[i]; return lerp(va, vb, EASE[e || ease]((t - a) / (b - a))); }
  return keys[keys.length - 1][1];
}
// hash noise in [0,1): same (i,k) → same value, in any frame order. Identical to the Panteões rnd().
export const rnd = (i, k = 0) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
// seeded LCG stream, for baking (only call it while building a cached asset, never per frame with shared state)
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export const wob = (t, t0, amp, f = 5, d = 7) => t < t0 ? 0 : amp * Math.exp(-(t - t0) * d) * Math.sin(TAU * f * (t - t0));
export const hop = (t, t0, t1, h) => t > t0 && t < t1 ? -h * Math.sin(Math.PI * (t - t0) / (t1 - t0)) : 0;
export const norm = s => s.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
