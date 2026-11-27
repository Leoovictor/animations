// Effects ported from the Panteões episodes (bolt, glowDot, particles) with the context passed in, plus sparks for a charge.
// Deterministic: every random value is rnd(i, k) with k derived from time steps, never Math.random.
import { rnd, clamp } from '../core/math.js';
export function glowDot(g, x, y, r, col, a = 1) { if (r <= 0 || a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
export function boltPts(x0, y0, x1, y1, seed, rough = .22, depth = 6) {
  let P = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) { const N = []; for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
      const r = (rnd(seed * 31 + d * 7 + i, 3) - .5) * L * rough; N.push(P[i], [(ax + bx) / 2 + (-(by - ay) / L) * r, (ay + by) / 2 + ((bx - ax) / L) * r]); } N.push(P[P.length - 1]); P = N; }
  return P;
}
// a lightning bolt: re-rolled every 1/16 s, glow passes + white core + side branches; o.prog draws only the first part (it travels)
export function bolt(g, x0, y0, x1, y1, t, col = '150,200,255', w = 10, o = {}) {
  const seed = Math.floor(t * 16) + (o.seed || 0), P = boltPts(x0, y0, x1, y1, seed, o.rough || .22), n = Math.max(2, Math.floor(P.length * (o.prog ?? 1)));
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
  const path = pts => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  const Pn = P.slice(0, n);
  for (const [lw, a] of [[w * 5, .12], [w * 2.4, .3], [w, .9]]) { path(Pn); g.strokeStyle = `rgba(${col},${a * (o.alpha ?? 1)})`; g.lineWidth = lw; g.stroke(); }
  path(Pn); g.strokeStyle = `rgba(255,255,255,${.95 * (o.alpha ?? 1)})`; g.lineWidth = w * .4; g.stroke();
  if (o.branches !== false) for (let b = 0; b < 3; b++) { const i = Math.floor(rnd(seed, b + 9) * (n - 2)) + 1; if (i >= Pn.length) continue; const [bx, by] = Pn[i], ang = Math.atan2(y1 - y0, x1 - x0) + (rnd(seed, b) - .5) * 1.6, L = Math.hypot(x1 - x0, y1 - y0) * .22;
    path(boltPts(bx, by, bx + Math.cos(ang) * L, by + Math.sin(ang) * L, seed + b * 13, .3, 4)); g.strokeStyle = `rgba(${col},${.5 * (o.alpha ?? 1)})`; g.lineWidth = w * .45; g.stroke(); }
  g.restore();
}
// small electric arcs crackling around a point (the charge in the fist): k 0..1 grows the count and the reach
export function sparks(g, x, y, r, t, k, col = '170,220,255') {
  if (k <= 0) return; const step = Math.floor(t * 18);
  glowDot(g, x, y, r * (1.2 + .6 * k), col, .55 * k); glowDot(g, x, y, r * .45, '255,255,255', .7 * k);
  for (let i = 0; i < Math.round(2 + 5 * k); i++) { const a = rnd(step, i) * Math.PI * 2, L = r * (.6 + .9 * rnd(step, i + 20)) * k;
    bolt(g, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, t + i * .37, col, 3 + 2 * k, { branches: false, rough: .4, seed: i * 7 }); }
}
// drifting particles in screen space: o = { cols:[...], r, speed, vx, up, add, leaf, a, area:[x0,y0,x1,y1] }
export function particles(g, t, n, o) {
  const [ax0, ay0, ax1, ay1] = o.area || [0, 0, g.canvas.width, g.canvas.height], W = ax1 - ax0, H = ay1 - ay0;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); if (o.add) g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const sp = o.speed || 1, ph = (t * sp * (.15 + .1 * rnd(i, 1)) + rnd(i, 2)) % 1;
    const x = ax0 + ((rnd(i, 3) * W + Math.sin(t * .8 + i) * 40 + (o.vx || 0) * ph * 400) % W + W) % W, y = ay0 + (o.up ? 1 - ph : ph) * H, r = (o.r || 6) * (.5 + rnd(i, 4)), col = o.cols[i % o.cols.length];
    if (o.leaf) { g.save(); g.translate(x, y); g.rotate(t * 2 + i); g.globalAlpha = (o.a ?? 1) * Math.sin(ph * Math.PI); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, r * 1.8, r * .7, 0, 0, 7); g.fill(); g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.stroke(); g.restore(); }
    else glowDot(g, x, y, r * 3, col, (o.a ?? .8) * Math.sin(ph * Math.PI)); }
  g.restore();
}
export const flashAlpha = (t, t0, d = .3) => t < t0 || t > t0 + d ? 0 : (1 - (t - t0) / d) ** 2;
