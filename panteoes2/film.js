// O Encontro dos Panteões — Ep. 02 (same engine as Ep. 01). 2D cartoon on one canvas: generated character art (parts/), painted backgrounds (src/bg_*),
// everything else (lightning, portals, rift, wind, light, particles, HUD, captions) drawn in code, frame by frame from t.
const W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');

let TL, DUR, IM = {}, AV, TX = [];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u, seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u), eo = u => 1 - (1 - u) ** 3, ei = u => u * u * u;
const back = u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const rnd = (i, k = 0) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
const norm = s => s.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
function wt(lid, word, n = 0, end = false) { const q = norm(word); let k = 0; for (const w of TL.words[lid]) if (norm(w[0]) === q || norm(w[0]).startsWith(q)) { if (k++ === n) return end ? w[2] : w[1]; } throw new Error(`wt ${lid} ${word}`); }
const L0 = id => TL.lines[id].t0, L1 = id => TL.lines[id].t1, S0 = id => TL.scenes[id].t0, S1 = id => TL.scenes[id].t1;

// ---------------------------------------------------------------- impacts: shake + flash, one list for picture and sound
let IMP = [];   // {t, a (shake px), f (flash 0-1), c (flash colour)}
function shake(t) { let x = 0, y = 0; for (const e of IMP) { const d = t - e.t; if (d < 0 || d > .6) continue; const k = e.a * Math.exp(-d * 7); x += Math.sin(d * 83 + e.t) * k; y += Math.cos(d * 71 + e.t * 3) * k; } return [x, y]; }
function flash(t) { for (const e of IMP) { const d = t - e.t; if (e.f && d >= 0 && d < .35) { g.fillStyle = `rgba(${e.c},${e.f * (1 - d / .35) ** 2})`; g.fillRect(0, 0, W, H); } } }

// ---------------------------------------------------------------- camera and drawing helpers
let CAM = { z: 1, x: 540, y: 960, r: 0 }, SH = [0, 0];
function cam(z = 1, x = 540, y = 960, r = 0) { CAM = { z, x, y, r }; apply(1); }
function apply(depth = 1) { const z = 1 + (CAM.z - 1) * depth, x = 540 + (CAM.x - 540) * depth, y = 960 + (CAM.y - 960) * depth;
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(540 + SH[0] * depth, 960 + SH[1] * depth); g.rotate(CAM.r * depth); g.scale(z, z); g.translate(-x, -y); }
function screen() { g.setTransform(1, 0, 0, 1, 0, 0); }
function bg(key, depth = .35, o = {}) {   // a painted background, cover-fitted with margin, at a parallax depth
  const im = IM[key]; apply(depth); const s = (o.s || 1.12) * Math.max(W / im.width, H / im.height), w = im.width * s, h = im.height * s;
  g.drawImage(im, 540 - w / 2 + (o.dx || 0), 960 - h / 2 + (o.dy || 0), w, h);
  if (o.dark) { g.fillStyle = `rgba(${o.darkc || '20,18,50'},${o.dark})`; g.fillRect(540 - w / 2, 960 - h / 2, w, h); }
  apply(1);
}
// sprite: anchored at its feet (bottom centre) unless o.ay; o.flip, o.rot, o.sx/sy squash, o.a alpha, o.sway wind, o.tint silhouette
const TINT = {};
function tinted(key, col) { const id = key + col; if (TINT[id]) return TINT[id]; const im = IM[key], c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return TINT[id] = c; }
function spr(key, x, y, h, o = {}) {
  const im = o.tint ? tinted(key, o.tint) : IM[key], s = h / im.height, w = im.width * s;
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1); g.globalAlpha *= o.a == null ? 1 : o.a;
  const ax = o.ax == null ? .5 : o.ax, ay = o.ay == null ? 1 : o.ay;
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.gb || 40; }
  if (o.sway) { const n = 28; for (let i = 0; i < n; i++) { const sy = im.height * i / n, sh = im.height / n + 1, k = 1 - i / n;
      const dx = Math.sin(o.sway[0] * 9 + i * .45) * o.sway[1] * k * k; g.drawImage(im, 0, sy, im.width, sh, -ax * w + dx, -ay * h + sy * s, w, sh * s); } }
  else g.drawImage(im, -ax * w, -ay * h, w, h);
  g.restore();
  return { x: x - ax * w * (o.flip ? -1 : 1), y: y - ay * h, w: w * (o.flip ? -1 : 1), h };
}
const at = (r, fx, fy) => [r.x + r.w * fx, r.y + r.h * fy];
const breathe = (t, k = 0) => 1 + Math.sin(t * 2.4 + k) * .008;

// lightning: midpoint displacement, re-rolled every 60 ms, glow pass + core pass
function boltPts(x0, y0, x1, y1, seed, rough = .22, depth = 6) {
  let P = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) { const N = []; for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], L = Math.hypot(bx - ax, by - ay);
      const r = (rnd(seed * 31 + d * 7 + i, 3) - .5) * L * rough; N.push(P[i], [(ax + bx) / 2 + (-(by - ay) / L) * r, (ay + by) / 2 + ((bx - ax) / L) * r]); } N.push(P[P.length - 1]); P = N; }
  return P;
}
function bolt(x0, y0, x1, y1, t, col = '150,200,255', w = 10, o = {}) {
  const seed = Math.floor(t * 16) + (o.seed || 0), P = boltPts(x0, y0, x1, y1, seed, o.rough || .22), prog = o.prog == null ? 1 : o.prog, n = Math.max(2, Math.floor(P.length * prog));
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
  const path = (pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  const Pn = P.slice(0, n);
  for (const [lw, a] of [[w * 5, .12], [w * 2.4, .3], [w, .9]]) { path(Pn); g.strokeStyle = `rgba(${col},${a})`; g.lineWidth = lw; g.stroke(); }
  path(Pn); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = w * .4; g.stroke();
  if (o.branches !== false) for (let b = 0; b < 3; b++) { const i = Math.floor(rnd(seed, b + 9) * (n - 2)) + 1; if (i >= Pn.length) continue; const [bx, by] = Pn[i], ang = Math.atan2(y1 - y0, x1 - x0) + (rnd(seed, b) - .5) * 1.6, L = Math.hypot(x1 - x0, y1 - y0) * .22;
    const B = boltPts(bx, by, bx + Math.cos(ang) * L, by + Math.sin(ang) * L, seed + b * 13, .3, 4); path(B); g.strokeStyle = `rgba(${col},.5)`; g.lineWidth = w * .45; g.stroke(); }
  g.restore();
}
function glowDot(x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function portal(x, y, r, t, c1 = '170,80,255', c2 = '255,200,90', o = {}) {
  if (r < 2) return; g.save(); g.translate(x, y); g.scale(1, o.sy || 1.25);
  glowDot(0, 0, r * 1.9, c1, .55);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, o.core || 'rgba(255,240,255,1)'); gr.addColorStop(.35, `rgba(${c1},1)`); gr.addColorStop(1, 'rgba(40,10,80,1)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let k = 0; k < 7; k++) { g.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, a = t * 3.2 + k * Math.PI * 2 / 7 + u * 4.2, rr = r * (1 - u * .92); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.strokeStyle = k % 2 ? `rgba(${c2},.75)` : `rgba(${c1},.8)`; g.lineWidth = r * .06; g.stroke(); }
  g.globalCompositeOperation = 'source-over'; g.lineWidth = Math.max(4, r * .045); g.strokeStyle = '#1a0f2e'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) { const ph = (t * .6 + rnd(i, 1)) % 1, a = rnd(i, 2) * 6.28 + t * .5, d = r * (2.1 - 1.2 * ph); glowDot(Math.cos(a) * d, Math.sin(a) * d, 10 + 8 * rnd(i, 3), i % 2 ? c1 : c2, Math.sin(ph * Math.PI)); }
  g.restore();
}
function cloud(x, y, s, fill = '#ffffff', line = '#2a2240') {
  const C = [[0, 0, 1], [-.9, .25, .7], [.95, .2, .75], [-.4, -.45, .75], [.45, -.5, .8], [-1.6, .45, .45], [1.7, .45, .5]];
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = line; for (const [a, b, r] of C) { g.beginPath(); g.arc(a * 60, b * 60, r * 60 + 5, 0, 7); g.fill(); }
  g.fillStyle = fill; for (const [a, b, r] of C) { g.beginPath(); g.arc(a * 60, b * 60, r * 60, 0, 7); g.fill(); } g.restore();
}
function clouds(t, n, y0, y1, speed, fill, line, sz = 1, seed = 0, depth = .6) {   // a band of drifting cartoon clouds
  apply(depth); for (let i = 0; i < n; i++) { const r = rnd(i + seed, 1), x = ((r * 1600 + t * speed * (0.6 + rnd(i, 4))) % 1700) - 300, y = lerp(y0, y1, rnd(i + seed, 2)); cloud(x, y, sz * (.7 + rnd(i, 3) * .8), fill, line); } apply(1);
}
function stormSky(t, k) {   // dark storm clouds rolling in from the top (k 0..1)
  if (k <= 0) return; screen(); const gr = g.createLinearGradient(0, 0, 0, 1100); gr.addColorStop(0, `rgba(25,20,55,${.85 * k})`); gr.addColorStop(1, 'rgba(25,20,55,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 1100);
  clouds(t, 9, -80 - 300 * (1 - k), 420 - 300 * (1 - k), 30, '#3b3866', '#1a1630', 1.5, 5, .3);
}
function particles(t, n, o) {   // generic drifting particles in screen space
  screen(); g.save(); if (o.add) g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const sp = o.speed || 1, ph = (t * sp * (.15 + .1 * rnd(i, 1)) + rnd(i, 2)) % 1;
    let x = rnd(i, 3) * W + Math.sin(t * .8 + i) * 40 + (o.vx || 0) * ph * 400, y = (o.up ? 1 - ph : ph) * (H + 200) - 100;
    const r = (o.r || 6) * (.5 + rnd(i, 4)); const col = o.cols[i % o.cols.length];
    if (o.leaf) { g.save(); g.translate(x, y); g.rotate(t * 2 + i); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, r * 1.8, r * .7, 0, 0, 7); g.fill(); g.strokeStyle = '#2a2240'; g.lineWidth = 2; g.stroke(); g.restore(); }
    else glowDot(x, y, r * 3, col, (o.a || .8) * Math.sin(ph * Math.PI)); }
  g.restore(); apply(1);
}
function rays(cx, cy, n, t, col, a, len = 2000, spin = .05, wid = .09) {
  g.save(); g.translate(cx, cy); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const ang = i / n * Math.PI * 2 + t * spin; g.fillStyle = `rgba(${col},${a * (.6 + .4 * rnd(i, 7))})`; g.beginPath(); g.moveTo(0, 0);
    g.lineTo(Math.cos(ang - wid) * len, Math.sin(ang - wid) * len); g.lineTo(Math.cos(ang + wid) * len, Math.sin(ang + wid) * len); g.fill(); }
  g.restore();
}
function sunburst(cx, cy, t, c1, c2, a = 1) { g.save(); g.globalAlpha = a; g.fillStyle = c1; g.fillRect(-500, -500, W + 1000, H + 1000); g.translate(cx, cy); g.fillStyle = c2;
  for (let i = 0; i < 18; i++) { const ang = i / 18 * Math.PI * 2 + t * .25; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ang) * 2500, Math.sin(ang) * 2500); g.lineTo(Math.cos(ang + .17) * 2500, Math.sin(ang + .17) * 2500); g.fill(); }
  g.restore(); }
function rift(cx, cy, len, k, t, o = {}) {   // the glowing crack in the sky
  if (k <= 0) return; const P = boltPts(cx - len / 2, cy + len * .08, cx + len / 2, cy - len * .08, 77, .28, 5), n = Math.max(2, Math.floor(P.length * clamp(k * 1.4)));
  const open = clamp(k - .3) * (o.open || 26) + Math.sin(t * 9) * 2 * k;
  g.save(); glowDot(cx, cy, len * .7, '255,60,200', .35 * k);
  g.beginPath(); for (let i = 0; i < n; i++) g.lineTo(P[i][0], P[i][1] - open * Math.sin(i / (P.length - 1) * Math.PI)); for (let i = n - 1; i >= 0; i--) g.lineTo(P[i][0], P[i][1] + open * Math.sin(i / (P.length - 1) * Math.PI)); g.closePath();
  g.fillStyle = '#0b0614'; g.fill(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  for (const [lw, c] of [[30, 'rgba(255,40,180,.25)'], [12, 'rgba(255,90,220,.7)'], [4, 'rgba(255,240,255,.95)']]) { g.lineWidth = lw; g.strokeStyle = c; g.stroke(); }
  for (let b = 0; b < 6; b++) { const i = Math.floor(rnd(b, 11) * (n - 1)); if (!P[i]) continue; const B = boltPts(P[i][0], P[i][1], P[i][0] + (rnd(b, 2) - .5) * 260, P[i][1] + (rnd(b, 3) - .5) * 260, b + 5, .35, 4);
    g.beginPath(); g.moveTo(B[0][0], B[0][1]); for (const p of B) g.lineTo(p[0], p[1]); g.lineWidth = 3; g.strokeStyle = `rgba(255,120,230,${.6 * k})`; g.stroke(); }
  g.restore();
}
function eyes(x, y, s, a, t, col = '255,210,60') { if (a <= 0) return; g.save(); for (const dx of [-1, 1]) { glowDot(x + dx * 70 * s, y, 90 * s, '255,60,40', .5 * a);
    g.fillStyle = `rgba(${col},${a})`; g.beginPath(); g.ellipse(x + dx * 70 * s, y, 34 * s, 16 * s * (1 - .9 * (((t * .4) % 3) < .08 ? 1 : 0)), dx * -.18, 0, 7); g.fill();
    g.fillStyle = `rgba(30,0,0,${a})`; g.beginPath(); g.ellipse(x + dx * 70 * s, y, 6 * s, 14 * s, 0, 0, 7); g.fill(); } g.restore(); }
function fog(t, a, col = '60,40,90', y0 = 900) { screen(); for (let i = 0; i < 10; i++) { const x = ((rnd(i, 1) * 1400 + t * (20 + 30 * rnd(i, 2))) % 1600) - 260, y = y0 + rnd(i, 3) * 900;
    glowDot(x, y, 320 + 200 * rnd(i, 4), col, a * .6); } apply(1); }
function wind(t, a, cx = 540, cy = 1000) {   // a vortex of streaks around a point
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < 46; i++) { const r = 120 + rnd(i, 1) * 620, a0 = rnd(i, 2) * 6.28 + t * (3.2 - r / 400), len = .5 + rnd(i, 3) * .7;
    g.beginPath(); g.ellipse(cx, cy, r, r * .55, 0, a0, a0 + len); g.strokeStyle = `rgba(255,${200 + 40 * rnd(i, 4) | 0},${170 + 60 * rnd(i, 5) | 0},${a * (.25 + .4 * rnd(i, 6))})`; g.lineWidth = 3 + 7 * rnd(i, 7); g.stroke(); }
  g.restore();
}
function glitch(a, t) {   // horizontal tearing + colour split of what is already on the canvas
  if (a <= 0) return; screen(); tg.clearRect(0, 0, W, H); tg.drawImage(cv, 0, 0);
  const n = 14; for (let i = 0; i < n; i++) { if (rnd(i, Math.floor(t * 20)) > .55) continue; const y = rnd(i, Math.floor(t * 20) + 1) * H, h = 20 + 120 * rnd(i, 5), dx = (rnd(i, Math.floor(t * 20) + 2) - .5) * 160 * a;
    g.drawImage(tmp, 0, y, W, h, dx, y, W, h); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35 * a; g.drawImage(tmp, 10 * a, 0); g.globalAlpha = .25 * a; g.drawImage(tmp, -10 * a, 0); g.restore();
}
function vignette(a = .55, col = '5,5,15') { screen(); const vg = g.createRadialGradient(540, 960, 500, 540, 960, 1300); vg.addColorStop(0, `rgba(${col},0)`); vg.addColorStop(1, `rgba(${col},${a})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
function dust(t, t0, x, y, n = 26, col = '#a2643f') {   // rock fragments and dust from an impact
  const d = t - t0; if (d < 0 || d > 2.2) return; g.save();
  for (let i = 0; i < n; i++) { const a = -Math.PI * (.1 + .8 * rnd(i, 1)), v = 500 + 900 * rnd(i, 2), px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d + 1400 * d * d, s = 8 + 18 * rnd(i, 3);
    g.save(); g.translate(px, py); g.rotate(d * 8 * rnd(i, 4)); g.fillStyle = col; g.strokeStyle = '#2a1a14'; g.lineWidth = 3; g.beginPath(); g.moveTo(-s, -s * .6); g.lineTo(s * .8, -s); g.lineTo(s, s * .7); g.lineTo(-s * .7, s); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  for (let i = 0; i < 9; i++) glowDot(x + (rnd(i, 5) - .5) * 300 * (1 + d), y - 100 * d * rnd(i, 6), 160 + 200 * d, '150,130,120', .5 * (1 - d / 2.2));
  g.restore();
}
function splitLine(y, col = '#fff') { screen(); g.save(); g.fillStyle = '#120c22'; g.fillRect(0, y - 9, W, 18); g.fillStyle = col; g.fillRect(0, y - 3, W, 6); g.restore(); }
function clip(y0, y1, fn) { screen(); g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip(); fn(); g.restore(); }

// ---------------------------------------------------------------- text helpers
function note(id, text, x0, y0, x1, y1) { TX.push({ id, text, x0, y0, x1, y1 }); }
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function stroked(text, x, y, font, fill, o = {}) { g.font = font; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = o.lw || 12; g.strokeStyle = o.stroke || '#0d0a18'; g.strokeText(text, x, y); g.fillStyle = fill; g.fillText(text, x, y); }
function brand() {
  screen(); const y = 128; g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 4;
  g.fillStyle = 'rgba(24,20,38,.82)'; rr(150, y - 44, 790, 88, 44); g.fill(); g.shadowColor = 'transparent'; g.strokeStyle = '#e6c27a'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#f6e7c4'; g.font = '600 46px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HISTÓRIAS E CRENÇAS', 560, y + 2); note('brand', 'HISTÓRIAS E CRENÇAS', 330, y - 24, 790, y + 24);
  const cx = 128, cy = y, r = 84; g.fillStyle = '#e6c27a'; g.beginPath(); g.arc(cx, cy, r + 8, 0, Math.PI * 2); g.fill();
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip(); if (AV) g.drawImage(AV, 25, 18, 360, 360, cx - r, cy - r, 2 * r, 2 * r); g.restore();
  g.strokeStyle = '#1a1726'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); g.restore();
}

// ---------------------------------------------------------------- captions: 2–5 words, word-by-word pop, key words in yellow, danger in red
const YEL = new Set('zeus xango ogum iansa tupa jaci guaraci anhanga thor anubis brasil trovoes trovao senhor portal portais fragmento alianca lua egito simbolo universo curtidas pista mil mundos voces'.split(' '));
const RED = new Set('errado desapareceu escuridao rugido ameaca criatura ruptura pior apagando problema atravessou seguindo desconhecida acidente'.split(' '));
let NOCAP = [];
function capColor(w, line) { const n = norm(w); if ((n === 'a' || n === 'b') && /s20|s21|s22a/.test(line) && /[AB]/.test(w)) return '#ffd65a';
  if (RED.has(n) && !(n === 'atravessou' && line !== 's22c')) return '#ff4d5e'; if (YEL.has(n)) return '#ffd65a'; return '#ffffff'; }
function caption(t) {
  if (NOCAP.some(([a, b]) => t >= a && t < b)) return;
  const c = TL.cues.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  screen(); const font = '84px Anton', y = 1340, sp = 22; g.font = font;
  const ws = c.words.map(w => [w[0].replace(/[“”]/g, '').toUpperCase(), w[1]]), wid = ws.map(w => g.measureText(w[0]).width);
  let tot = wid.reduce((a, b) => a + b, 0) + sp * (ws.length - 1), k = Math.min(1, 940 / tot); let x = 540 - tot * k / 2;
  const out = clamp((c.t1 - t) / .08);
  g.save(); g.translate(540, y); g.scale(k, k); g.translate(-540, -y);
  x = 540 - tot / 2;
  ws.forEach(([w, t0], i) => { const u = clamp((t - t0 + .04) / .12); if (u > 0) { const s = u < 1 ? 1.35 - .35 * eo(u) : 1; g.save(); g.globalAlpha = out * Math.min(1, u * 2); g.translate(x + wid[i] / 2, y); g.scale(s, s);
      stroked(w, 0, 0, font, capColor(w, c.line), { lw: 16 }); g.restore(); } x += wid[i] + sp; });
  g.restore();
}
// game cards
function pill(id, text, t, t0, t1, y, o = {}) {
  const u = clamp((t - t0) / .25), vv = clamp((t1 - t) / .18); if (u <= 0 || vv <= 0) return;
  screen(); const px = o.px || 64, k = back(u) * (o.k || 1); g.save(); g.translate(o.x || 540, y); g.rotate((o.rot || 0) * Math.PI / 180); g.scale(k, k); g.globalAlpha = vv;
  g.font = `${px}px ${o.font || 'Anton'}`; const tw = g.measureText(text).width, w = tw + px * 1.1, h = px * 1.45;
  g.shadowColor = o.glow || 'rgba(0,0,0,.5)'; g.shadowBlur = o.glow ? 40 : 16; g.fillStyle = o.bg || '#ffd65a'; rr(-w / 2, -h / 2, w, h, o.r == null ? h / 2 : o.r); g.fill(); g.shadowBlur = 0;
  g.lineWidth = 7; g.strokeStyle = o.line || '#0d0a18'; g.stroke(); g.fillStyle = o.fg || '#140c24'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, px * .05);
  g.restore(); if (u >= 1 && vv >= 1) note(id, text, (o.x || 540) - tw / 2, y - px / 2, (o.x || 540) + tw / 2, y + px / 2);
}
function unlock(id, name, t, t0, t1, col, o = {}) {   // "NOVO PERSONAGEM" banner + nameplate
  pill(id + 'b', o.banner || (o.full ? 'NOVO PERSONAGEM DESBLOQUEADO' : 'NOVO PERSONAGEM'), t, t0, t1, o.by || 530, { px: 40, bg: '#120c22', fg: '#ffd65a', line: '#ffd65a', r: 14 });
  const u = clamp((t - t0 - .15) / .3); if (u > 0 && t < t1) { screen(); g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, d = 120 + 260 * eo(u);
      glowDot(540 + Math.cos(a) * d, (o.ny || 1490) + Math.sin(a) * d * .4, 18, '255,215,90', (1 - u) * .9); } g.restore(); }
  pill(id, name, t, t0 + .15, t1, o.ny || 1490, { px: 100, bg: col, fg: '#fff', rot: -3, glow: 'rgba(255,215,90,.8)', r: 26, k: 1 });
}
function bigText(id, lines, t, t0, t1, y, o = {}) {   // the centre impact caption
  const u = clamp((t - t0) / .2), vv = clamp((t1 - t) / .15); if (u <= 0 || vv <= 0) return; screen();
  const px = o.px || 104; g.save(); g.globalAlpha = vv; const s = u < 1 ? 1.6 - .6 * eo(u) : 1 + .02 * Math.sin(t * 6); g.translate(540, y); g.scale(s, s); g.rotate(-.03);
  lines.forEach((L, i) => { const yy = (i - (lines.length - 1) / 2) * px * 1.08; g.font = `${px}px Anton`; const w = g.measureText(L).width; if (w > 960) { g.save(); g.scale(960 / w, 960 / w); stroked(L, 0, yy, `${px}px Anton`, o.cols ? o.cols[i] : '#ffd65a', { lw: 20 }); g.restore(); } else stroked(L, 0, yy, `${px}px Anton`, o.cols ? o.cols[i] : '#ffd65a', { lw: 20 }); });
  g.restore();
}

// ---------------------------------------------------------------- Ep. 02 timings, impacts
let T = {};
function impacts() {
  const I = (t, a, f = 0, c = '255,255,255') => IMP.push({ t, a, f, c });
  I(.25, 34, 1); I(wt('s01', 'Brasil'), 30, .9, '255,240,170');
  I(wt('s02', 'atravessar') + .3, 12, .5, '180,90,255');
  I(wt('s03', 'errado'), 14, .3, '255,60,90'); I(T.splash, 24, .35, '200,235,255');
  I(T.zap, 0, .7, '120,180,255');
  I(wt('s08', 'trovão'), 42, 1, '255,245,200'); I(wt('s08', 'estremecer'), 26, 0);
  I(wt('s09', 'Tupã'), 16, .5, '220,255,170');
  I(wt('s10b', 'mais'), 12, 0);
  I(wt('s11b', 'ruptura'), 18, .3, '255,80,200');
  I(wt('s14', 'Guaraci'), 10, .8, '255,210,120');
  I(wt('s15', 'rugido'), 26, 0);
  I(T.ally, 46, 1);
  I(wt('s18', 'portais') + .1, 22, .7, '190,210,255');
  I(wt('s20', 'A'), 10, .3, '140,200,255'); I(wt('s21', 'B'), 10, .3, '255,210,120');
  I(T.eyes, 30, .35, '255,40,40');
}
// ---------------------------------------------------------------- HUD (the story's own game state, nothing more)
function bar(x, y, w, v, max, col, t, alertT) {
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(x, y, w, 22, 11); g.fill();
  const f = clamp(v / max), danger = v < 15; const c = danger ? (Math.sin(t * 14) > 0 ? '#ff3b4e' : '#ff8a3b') : col;
  if (f > .01) { g.fillStyle = c; rr(x, y, Math.max(22, w * f), 22, 11); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; rr(x + 6, y + 3, Math.max(10, w * f - 12), 6, 3); g.fill(); }
  for (let i = 1; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + w * i / 10, y, 2, 22); }
  g.lineWidth = 3; g.strokeStyle = '#0d0a18'; rr(x, y, w, 22, 11); g.stroke();
  if (alertT != null && t - alertT < 1.6 && t >= alertT && Math.sin((t - alertT) * 18) > -.3) glowDot(x + w * f, y + 11, 60, '255,60,60', .8);
}
function hudState(t) {
  const step = (t0, a, b, d = .8) => lerp(a, b, eio(seg(t, t0, t0 + d)));
  const e1 = wt('s03', 'floresta'), e2 = wt('s18', 'portais') + .1, b1 = wt('s15', 'rugido');
  const en = t < e2 ? step(e1, 30, 0, 1.0) : step(e2, 0, 65, 1.2), bal = step(b1, 20, 10);
  return { en, bal, pan: t >= wt('s09', 'Tupã') + .3 ? '3/?' : '2/?', panT: wt('s09', 'Tupã') + .3, loc: t >= S0('terr') + .3 ? 'FLORESTA — BRASIL' : 'DESCONHECIDA', locT: S0('terr') + .3,
    alerts: [[e1, 'energy'], [b1, 'balance'], [e2, 'energy']] };
}
function hud(t) {
  screen(); const S = hudState(t), y0 = 236;
  g.save(); g.shadowColor = 'rgba(90,230,255,.6)'; g.shadowBlur = 18; g.fillStyle = 'rgba(8,10,30,.78)'; rr(40, y0, 1000, 214, 22); g.fill(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = '#5ee7ff'; g.stroke();
  g.font = '40px Anton'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('ENCONTRO DOS PANTEÕES', 66, y0 + 34); note('hudt', 'ENCONTRO DOS PANTEÕES', 66, y0 + 14, 450, y0 + 54);
  g.fillStyle = '#ffd65a'; rr(900, y0 + 14, 116, 40, 20); g.fill(); g.fillStyle = '#1a1030'; g.font = '30px Anton'; g.textAlign = 'center'; g.fillText('EP. 02', 958, y0 + 35); note('hudep', 'EP. 02', 915, y0 + 18, 1000, y0 + 52);
  g.textAlign = 'left'; g.font = '27px Anton'; const lf = t - S.locT < 1.2 && t >= S.locT && Math.sin(t * 16) > 0;
  g.fillStyle = '#ffd65a'; g.fillText('LOCAL:', 66, y0 + 78); const lw = g.measureText('LOCAL: ').width; g.fillStyle = lf ? '#7dffa0' : '#fff'; g.fillText(S.loc, 66 + lw, y0 + 78);
  note(S.loc === 'DESCONHECIDA' ? 'loc1' : 'loc2', S.loc, 66 + lw, y0 + 64, 66 + lw + g.measureText(S.loc).width, y0 + 92);
  const pf = t - S.panT < 1.4 && t >= S.panT; g.save(); if (pf) { g.translate(870, y0 + 78); g.scale(1 + .25 * Math.sin((t - S.panT) * 9) * (1 - (t - S.panT) / 1.4), 1 + .25 * Math.sin((t - S.panT) * 9) * (1 - (t - S.panT) / 1.4)); g.translate(-870, -(y0 + 78)); }
  g.fillStyle = '#ffd65a'; g.fillText('PANTEÕES:', 760, y0 + 78); g.fillStyle = pf ? '#7dffa0' : '#fff'; g.fillText(S.pan, 760 + g.measureText('PANTEÕES: ').width, y0 + 78); g.restore(); note('panl', 'PANTEÕES:', 760, y0 + 64, 900, y0 + 92);
  const al = k => { let a = null; for (const [tt, kk] of S.alerts) if (kk === k && t >= tt) a = tt; return a; };
  g.font = '25px Anton'; g.fillStyle = '#b9a8ff'; g.fillText('ENERGIA DO PORTAL', 66, y0 + 114); bar(66, y0 + 130, 360, S.en, 100, '#b06bff', t, al('energy'));
  g.fillStyle = S.en < 15 ? '#ff6b7a' : '#fff'; g.font = '30px Anton'; g.fillText(Math.round(S.en) + '%', 438, y0 + 141);
  g.font = '25px Anton'; g.fillStyle = '#9fe9ff'; g.fillText('EQUILÍBRIO ENTRE OS MUNDOS', 560, y0 + 114); bar(560, y0 + 130, 360, S.bal, 100, '#4fd8ff', t, al('balance'));
  g.fillStyle = S.bal < 15 ? '#ff6b7a' : '#fff'; g.font = '30px Anton'; g.fillText(Math.round(S.bal) + '%', 932, y0 + 141);
  g.font = '27px Anton'; g.fillStyle = '#ffd65a'; g.fillText('MISSÃO:', 66, y0 + 186); const mw = g.measureText('MISSÃO: ').width; g.fillStyle = '#fff'; const mt = 'DESCOBRIR QUEM ABRIU OS PORTAIS';
  g.fillText(mt, 66 + mw, y0 + 186); note('mis', mt, 66 + mw, y0 + 170, 66 + mw + g.measureText(mt).width, y0 + 202);
  for (const [tt] of S.alerts) if (t >= tt && t < tt + 1.6) { g.save(); g.globalAlpha = Math.sin((t - tt) * 14) > -.2 ? 1 : .3; g.fillStyle = '#ff2e4a'; rr(760, y0 + 170, 256, 34, 17); g.fill(); g.lineWidth = 3; g.strokeStyle = '#0d0a18'; g.stroke();
    g.fillStyle = '#fff'; g.font = '26px Anton'; g.textAlign = 'center'; g.fillText('⚠ ALERTA', 888, y0 + 188); g.restore(); break; }
  g.restore();
}

// ---------------------------------------------------------------- Ep. 02 drawing helpers
const AMZ = (t, dark = 0, o = {}) => bg('bg_amazon', o.depth || .35, { dark, darkc: o.darkc || '10,20,45', ...o });
function riverShine(t, y0 = 1180, y1 = 1560, a = .5, col = '255,255,255') {   // glints moving on the river
  apply(.35); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const y = lerp(y0, y1, rnd(i, 1)), x = ((rnd(i, 2) * 1300 + t * (30 + 30 * rnd(i, 3))) % 1300) - 110, w = 40 + 90 * rnd(i, 4);
    g.fillStyle = `rgba(${col},${a * (.4 + .6 * Math.abs(Math.sin(t * 2 + i)))})`; g.fillRect(x, y, w, 4); }
  g.restore(); apply(1);
}
function leaves(t, a = 1, dark = 0) {   // near foreground foliage at the frame edges (its own parallax layer)
  apply(1.5); g.save(); g.globalAlpha = a;
  const L = [[-40, 380, .9, -.5], [40, 700, 1.1, -.2], [-60, 1050, 1, -.6], [1120, 420, 1, Math.PI + .5], [1080, 820, 1.2, Math.PI + .2], [1140, 1200, .9, Math.PI + .6], [-30, 1650, 1.2, -.3], [1110, 1700, 1.1, Math.PI + .3]];
  for (const [x, y, s, r] of L) { g.save(); g.translate(x, y); g.rotate(r + Math.sin(t * 1.3 + x) * .06); g.scale(s, s);
    for (let k = 0; k < 3; k++) { g.save(); g.rotate((k - 1) * .45); g.fillStyle = dark ? '#0b2016' : ['#1f6b34', '#2b7d3d', '#185a2b'][k]; g.strokeStyle = '#0a1c10'; g.lineWidth = 6;
      g.beginPath(); g.ellipse(160, 0, 170, 52, 0, 0, 7); g.fill(); g.stroke(); g.strokeStyle = dark ? '#123020' : '#3f9a4f'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(320, 0); g.stroke(); g.restore(); }
    g.restore(); }
  g.restore(); apply(1);
}
function night(k, t) {   // day → night: blue grade, stars, a rising moon
  if (k <= 0) return; screen(); g.save(); g.fillStyle = `rgba(8,14,48,${.72 * k})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) glowDot(rnd(i, 1) * W, rnd(i, 2) * 900, 4 + 4 * rnd(i, 3), '220,230,255', k * (.4 + .6 * Math.abs(Math.sin(t * 2 + i))));
  g.restore(); const my = lerp(980, 560, eio(k)); glowDot(800, my, 260, '170,200,255', .45 * k); g.save(); g.globalAlpha = k; g.fillStyle = '#eef2ff'; g.beginPath(); g.arc(800, my, 80, 0, 7); g.fill(); g.fillStyle = 'rgba(160,170,210,.5)'; g.beginPath(); g.arc(780, my - 20, 16, 0, 7); g.arc(825, my + 22, 11, 0, 7); g.fill(); g.restore(); apply(1);
}
function splash(t, t0, x, y) {
  const d = t - t0; if (d < 0 || d > 1.6) return; g.save();
  for (let k = 0; k < 3; k++) { const r = (d - k * .15) * 520; if (r > 0) { g.beginPath(); g.ellipse(x, y, r, r * .18, 0, 0, 7); g.lineWidth = 10 * Math.max(0, 1 - d / 1.2); g.strokeStyle = 'rgba(230,250,255,.8)'; g.stroke(); } }
  for (let i = 0; i < 34; i++) { const a = -Math.PI * (.15 + .7 * rnd(i, 1)), v = 600 + 900 * rnd(i, 2), px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d + 1700 * d * d; if (py > y + 30) continue;
    g.fillStyle = '#d8f4ff'; g.strokeStyle = '#1a4a6a'; g.lineWidth = 3; g.beginPath(); g.ellipse(px, py, 9 + 9 * rnd(i, 3), 13 + 9 * rnd(i, 4), a, 0, 7); g.fill(); g.stroke(); }
  g.restore();
}
function roots(x, y, k, t, dir = -1) {   // glowing roots spreading from a palm on the ground
  if (k <= 0) return; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  const grow = (px, py, ang, len, depth, seed, prog) => { if (depth > 4 || prog <= 0) return; const L = len * Math.min(1, prog);
    const ex = px + Math.cos(ang) * L, ey = py + Math.sin(ang) * L * .35 + Math.abs(Math.sin(ang)) * L * .2; g.beginPath(); g.moveTo(px, py);
    g.quadraticCurveTo((px + ex) / 2 + (rnd(seed, 1) - .5) * 60, (py + ey) / 2 + (rnd(seed, 2) - .5) * 40, ex, ey);
    for (const [lw, c] of [[20 - depth * 3, 'rgba(120,255,140,.18)'], [7 - depth, 'rgba(170,255,120,.8)'], [2, 'rgba(255,255,210,.9)']]) { g.lineWidth = Math.max(1, lw); g.strokeStyle = c; g.stroke(); }
    if (prog > 1) for (let b = 0; b < 2; b++) grow(ex, ey, ang + (rnd(seed, b + 3) - .5) * 1.3, len * .7, depth + 1, seed * 3 + b + 1, prog - 1); };
  for (let i = 0; i < 6; i++) grow(x, y, (i < 3 ? Math.PI : 0) + (rnd(i, 9) - .5) * .7, 260, 0, i + 1, k * 4);
  g.restore();
}
function fragment(x, y, s, t, a = 1) {   // the dark stone with the unknown symbol
  g.save(); g.translate(x, y + Math.sin(t * 2) * 12); g.scale(s * Math.max(.2, Math.abs(Math.cos(t * 1.1))), s); g.globalAlpha = a;
  glowDot(0, 0, 220, '150,90,255', .35 + .15 * Math.sin(t * 5));
  g.fillStyle = '#231d33'; g.strokeStyle = '#0a0812'; g.lineWidth = 8; g.beginPath(); [[-90, -120], [40, -140], [110, -40], [80, 110], [-30, 140], [-110, 40]].forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(-90, -120); g.lineTo(40, -140); g.lineTo(0, -40); g.closePath(); g.fill();
  glyph(0, 0, 1, t); g.restore();
}
function glyph(x, y, s, t, a = 1) {   // an invented symbol, glowing
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a; g.lineCap = 'round'; const p = .7 + .3 * Math.sin(t * 5);
  for (const [lw, c] of [[16, `rgba(170,110,255,${.35 * p})`], [6, `rgba(210,170,255,${p})`], [2, 'rgba(255,255,255,.95)']]) {
    g.lineWidth = lw; g.strokeStyle = c; g.beginPath(); g.arc(0, 0, 52, 0, 7); g.moveTo(0, -78); g.lineTo(0, 78); g.moveTo(-40, -30); g.lineTo(0, 10); g.lineTo(40, -30);
    g.moveTo(-26, 48); g.lineTo(26, 48); g.stroke(); }
  g.restore();
}
function shadowMass(x, y, s, t, a = 1) {   // the creature as a moving shape of darkness, never shown
  g.save(); g.globalAlpha = a; glowDot(x, y, 520 * s, '120,30,160', .45 + .1 * Math.sin(t * 2));
  for (let i = 0; i < 16; i++) { const ang = i / 16 * 6.28 + t * .2, r = (220 + 80 * Math.sin(t * 1.3 + i * 2)) * s; const gr = g.createRadialGradient(x + Math.cos(ang) * r * .6, y + Math.sin(ang) * r * .4, 0, x + Math.cos(ang) * r * .6, y + Math.sin(ang) * r * .4, r);
    gr.addColorStop(0, 'rgba(6,2,12,.95)'); gr.addColorStop(1, 'rgba(6,2,12,0)'); g.fillStyle = gr; g.fillRect(x - 3 * r, y - 3 * r, 6 * r, 6 * r); }
  g.restore();
}
function macaws(t, n = 3, depth = 1) { apply(depth); for (let i = 0; i < n; i++) { const ph = (t * .16 + rnd(i, 1)) % 1, x = lerp(-200, 1300, ph), y = 500 + 500 * rnd(i, 2) + Math.sin(t * 2 + i) * 30;
    spr(Math.floor(t * 7 + i) % 2 ? 'arara_0' : 'arara_1', x, y, 170 + 60 * rnd(i, 3), { ay: .5 }); } apply(1); }
function worldPane(key, t, o = {}) { bg(key, .2, { s: 1.25, dark: o.dark || 0 }); }
function ripple(a, t) {   // a wavy reflection distortion of what is on the canvas
  if (a <= 0) return; screen(); tg.clearRect(0, 0, W, H); tg.drawImage(cv, 0, 0); g.clearRect(0, 0, W, H);
  for (let y = 0; y < H; y += 8) { const dx = Math.sin(y * .03 + t * 6) * 18 * a; g.drawImage(tmp, 0, y, W, 8, dx, y, W, 8); }
}

// ---------------------------------------------------------------- scenes
const SCENES = {};
SCENES.hook = (t, lt, sc) => {
  const to = wt('s01', 'outro'), td = wt('s01', 'Desta') - .05, tb = wt('s01', 'Brasil');
  const z = lt < .3 ? 1.4 - .35 * eo(lt / .3) : 1.05 + lt * .02; cam(z, 540, 1000);
  AMZ(t, .62); stormSky(t, .8); riverShine(t, 1180, 1560, .25);
  const lit = Math.max(0, 1 - Math.abs(t - .3) / .25) + Math.max(0, 1 - Math.abs(t - tb) / .3);
  const ox = t < td ? 540 : 600, oh = t < td ? 640 : 900;
  spr('onca_2', ox, 1180, oh, { tint: '#05070c', glow: 'rgba(255,215,90,.9)', gb: 30 });
  if (lit > 0) { g.save(); g.globalAlpha = clamp(lit) * .5; spr('onca_2', ox, 1180, oh); g.restore(); }
  if (t < .6) bolt(380, -50, 560, 560, t, '255,240,180', 12);
  if (t > tb - .05 && t < tb + .4) bolt(700, -50, 640, 400, t, '220,255,170', 14);
  spr('zeus_0', 180, 1900, 1000 * breathe(t)); spr('xango_0', 900, 1900, 1040 * breathe(t, 1));
  leaves(t, 1, 1);
  if (t > tb + .35) { screen(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }   // cut before the full reveal
};
SCENES.recap = (t, lt, sc) => {
  const n = Math.floor(lt / ((sc.t1 - sc.t0) / 5)), k = (lt % ((sc.t1 - sc.t0) / 5)) / ((sc.t1 - sc.t0) / 5);
  if (n === 0) { cam(1.05 + .05 * k, 540, 960); screen(); sunburst(540, 900, t, '#1d3d8a', '#2850a8'); apply(1); spr('zeusb_1', 540, 1960, 1250); }
  else if (n === 1) { cam(1.2 + .1 * k, 540, 700); bg('bg_africa', .35, { dark: .66, darkc: '22,18,60' }); stormSky(t, 1); rift(540, 650, 760, 1, t, { open: 50 }); eyes(540, 640, .5, .9, t); }
  else if (n === 2) { cam(1.08, lerp(420, 620, k), 1000); bg('bg_africa', .35, { dark: .62, darkc: '22,18,60' }); stormSky(t, 1); rift(980, 560, 520, 1, t, { open: 60 });
    const bob = j => Math.abs(Math.sin(t * 6 + j)) * 12; spr('iansa_1', 120, 1800 - bob(3), 860, { flip: true, sway: [t, 6] }); spr('ogum_1', 330, 1810 - bob(2), 900, { flip: true }); spr('xango_2', 560, 1820 - bob(1.5), 960, { flip: true }); spr('zeus_3', 800, 1820 - bob(0), 920); }
  else { const u = seg(lt, (sc.t1 - sc.t0) * .6, sc.t1 - sc.t0); cam(1 + .3 * u, 540, 960); screen(); g.fillStyle = '#12061f'; g.fillRect(0, 0, W, H); apply(1); portal(540, 1000, 300 + 600 * ei(u), t * 2);
    ['zeus_3', 'xango_2', 'ogum_1', 'iansa_1'].forEach((k2, i) => { const p = clamp(u * 1.6 - i * .15); spr(k2, lerp([200, 400, 680, 880][i], 540, p), lerp(1800, 1050, p), 700 * (1 - .85 * p), { a: 1 - p, rot: p * 2, flip: i > 0 && i !== 0 && k2 !== 'zeus_3' }); });
    particles(t, 40, { cols: ['190,120,255', '255,210,100'], r: 6, add: true, speed: 2 }); }
  glitch(k < .15 ? .7 : .1, t);
  pill('ant', 'NO EPISÓDIO ANTERIOR', t, sc.t0 + .05, sc.t0 + 3.3, 530, { px: 40, bg: '#120c22', fg: '#ffd65a', line: '#ffd65a', r: 14 });
};
SCENES.queda = (t, lt, sc) => {
  const te = wt('s03', 'errado'), tl = wt('s03', 'lançou'), ts = T.splash, tend = L1('s03') + .1;
  if (t < tl) { const u = seg(t, sc.t0, tl); cam(1.1, 540, 960, (t > te ? 1 : 0) * Math.sin((t - te) * 3) * .25 * seg(t, te, tl)); screen(); g.fillStyle = '#12061f'; g.fillRect(0, 0, W, H); apply(1);
    portal(540, 960, 520, t * (t > te ? 4 : 1.5), t > te ? '255,60,90' : '170,80,255', '255,200,90'); particles(t, 40, { cols: ['255,80,120', '190,120,255'], r: 6, add: true, speed: 2.5 }); glitch(t > te ? .5 : .1, t);
    if (t > te) { screen(); g.lineWidth = 40; g.strokeStyle = `rgba(255,30,60,${.35 + .25 * Math.sin(t * 10)})`; g.strokeRect(0, 0, W, H); } return; }
  if (t < tend) {   // the fall: the camera rides down with them
    const u = seg(t, tl, ts + .5); cam(1.25, 540, lerp(420, 1320, eio(u))); AMZ(t, 0, { depth: .8, s: 1.3 }); riverShine(t, 1250, 1700, .4);
    portal(540, 120, 200, t, '170,80,255', '255,200,90');
    const fall = (x0, t0, yEnd, k) => { const d = Math.max(0, t - t0); return [x0, Math.min(yEnd, 140 + 1500 * d * d * k)]; };
    const [zx, zy] = fall(380, tl, 1460, 1.0); if (t < ts) spr('zeus_2', zx, zy, 520, { ay: .5, rot: (t - tl) * 4 }); else { spr('zeusb_1', zx, 1480 - 40 * eo(seg(t, ts + .3, ts + .8)), 300, { ay: 1, a: seg(t, ts + .2, ts + .5) }); }
    splash(t, ts, 380, 1470);
    const [ox, oy] = fall(660, tl + .15, 1640, .9), [xx, xy] = fall(860, tl + .1, 1660, .95);
    spr('ogum_1', ox, oy, 520, { ay: oy >= 1640 ? 1 : .5, rot: oy >= 1640 ? 0 : (t - tl) * -3 }); spr('xango_2', xx, xy, 540, { ay: xy >= 1660 ? 1 : .5, rot: xy >= 1660 ? 0 : (t - tl) * 3.5, flip: true });
    const iy = lerp(200, 1640, eio(seg(t, tl, tend))); spr('iansa_0', 200, iy, 560, { sway: [t, 16] }); wind(t, .25, 200, iy - 280);
    leaves(t, 1); return; }
  cam(1.0 + .04 * (t - tend), 540, 960); screen(); sunburst(540, 900, t * .3, '#1a4a6a', '#215a80'); apply(1); spr('zeusb_2', 540, 1960, 1250);   // the comic pause: soaked
  for (let i = 0; i < 14; i++) { const ph = ((t - tend) * 1.4 + rnd(i, 1)) % 1; const x = 300 + rnd(i, 2) * 520, y = 820 + rnd(i, 3) * 300 + ph * 380; g.fillStyle = 'rgba(150,215,255,.95)'; g.strokeStyle = '#0d3a5a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y - 18); g.quadraticCurveTo(x + 11, y + 4, x, y + 10); g.quadraticCurveTo(x - 11, y + 4, x, y - 18); g.fill(); g.stroke(); }
  const fq = seg(t, tend + .25, tend + .5); if (fq > 0) { g.save(); g.translate(760, 1150); g.rotate(Math.sin(t * 9) * .3); g.scale(back(fq), back(fq)); g.fillStyle = '#ff9f43'; g.strokeStyle = '#0d0a18'; g.lineWidth = 5;
    g.beginPath(); g.ellipse(0, 0, 46, 24, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(40, 0); g.lineTo(70, -22); g.lineTo(70, 22); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#000'; g.beginPath(); g.arc(-22, -4, 5, 0, 7); g.fill(); g.restore(); }
};
SCENES.terr = (t, lt, sc) => {
  const u = seg(t, sc.t0, sc.t1); cam(1.1 + .2 * u, lerp(380, 700, eio(u)), lerp(1000, 900, u));
  AMZ(t, 0, { depth: .3 }); riverShine(t, 1180, 1560, .45); fog(t, .25, '255,255,255', 700); macaws(t, 3, 1.0); leaves(t, 1);
  pill('terr', 'NOVO TERRITÓRIO DESCOBERTO', t, sc.t0 + .3, sc.t1 + .3, 530, { px: 42, bg: '#0f3a22', fg: '#7dffa0', line: '#7dffa0', r: 14 });
};
SCENES.observa = (t, lt, sc) => {
  const th = wt('s05', 'Havia') - .05, tsg = wt('s05', 'seguindo') - .05, dk = seg(t, sc.t0, sc.t1) * .5;
  if (t < th) { cam(1.05 + lt * .03, 540, 960); AMZ(t, .35 + dk, { s: 1.5, dx: -150 }); spr('ogum_0', 560, 1900, 1350 * breathe(t, 3)); leaves(t, 1, 1); }
  else if (t < tsg) { const u = seg(t, th, tsg); cam(1.6 + .4 * u, 300, 900); AMZ(t, .8, { s: 1.4 }); leaves(t, 1, 1); fog(t, .4, '20,40,30', 600);
    eyes(300, 880, .35, seg(t, th + .2, th + .5), t, '150,255,240'); }
  else { cam(1.08, 540, 960); AMZ(t, .5 + dk, { s: 1.5, dx: 200 }); spr('xangob_0', 520, 1960, 1250); leaves(t, 1, 1); eyes(900, 780, .25, seg(t, tsg + .4, tsg + .8) * (Math.sin(t * 3) > -.6 ? 1 : 0), t, '150,255,240'); }
};
SCENES.anhanga = (t, lt, sc) => {
  const ta = wt('s06', 'Anhangá') - .1, tp = wt('s06', 'protegia'), td = wt('s06', 'animais'), tf = wt('s06', 'floresta', 0) - .05;
  if (t < tf) { const u = seg(t, sc.t0, tf); cam(1.05 + .1 * u, 560, 1000); AMZ(t, .55, { s: 1.3 }); fog(t, .35, '150,220,230', 900);
    const ap = seg(t, ta - .3, ta + .8), dis = seg(t, td, td + .8); glowDot(760, 1250, 520, '170,240,255', .35 * ap * (1 - dis));
    if (dis < 1) { const r = spr('anhanga_0', 760, 1640, 900, { a: ap * (1 - dis), glow: 'rgba(190,250,255,.9)', gb: 40 }); const e = at(r, .07, .18); glowDot(e[0], e[1], 50, '150,255,250', ap * (1 - dis) * (.7 + .3 * Math.sin(t * 6))); }
    if (dis > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 60; i++) { const d = dis * (300 + 500 * rnd(i, 1)); glowDot(760 + (rnd(i, 2) - .5) * 500 + Math.sin(i) * d * .4, 1300 + (rnd(i, 3) - .5) * 700 - d, 14, '200,255,255', 1 - dis); } g.restore(); }
    const zx = lerp(-150, 300, eo(seg(t, tp - .6, td + .2))); spr('zeus_3', zx, 1880 - Math.abs(Math.sin(t * 6)) * 12, 1000); leaves(t, 1, 1); }
  else { cam(1.0 + .15 * seg(t, tf, sc.t1), 540, 960); AMZ(t, .5, { s: 1.6 }); spr('zeusb_2', 540, 1960, 1250); particles(t, 20, { cols: ['200,255,255'], r: 6, add: true, up: true, speed: .8 }); }
  unlock('ua', 'ANHANGÁ', t, ta, sc.t1 + .2, '#3a8a8a', { banner: 'NOVA ENTIDADE DESCOBERTA' });
};
SCENES.provoc = (t, lt, sc) => {
  const tl = wt('s07', 'lançou') - .05, tm = wt('s07', 'Mas'), tdz = wt('s07', 'desapareceu') - .05, zap = T.zap;
  if (t < tl) { cam(1.03 + lt * .04, 540, 960); AMZ(t, .5, { s: 1.6 }); spr('zeusb_0', 540, 1960, 1250); leaves(t, 1, 1); return; }
  if (t < tdz) { cam(1.05, 540, 1000); AMZ(t, .6); leaves(t, .9, 1); const r = spr('zeus_2', 380, 1880, 1100 * breathe(t)); const h = at(r, .3, .05);
    const ch = seg(t, tl, tl + .5); glowDot(h[0], h[1], 60 + 140 * ch, '140,200,255', .9 * ch);
    const V = [620, 360]; if (t > tl + .4) { const p = eo(seg(t, tl + .4, tl + .7)), sh = seg(t, tm - .1, tdz); const sx = lerp(h[0], V[0], sh), sy = lerp(h[1], V[1], sh);
      if (sh < 1) bolt(sx, sy, lerp(h[0], V[0], p), lerp(h[1], V[1], p), t, '140,200,255', 12 * (1 - sh) + 2); }
    const vk = seg(t, tm - .3, tm + .2) * (1 - seg(t, tdz, tdz + .3)); if (vk > 0) { g.save(); g.translate(V[0], V[1]); g.rotate(-t * 4); for (let i = 0; i < 5; i++) { g.rotate(1.256); g.strokeStyle = `rgba(20,10,40,${.8 * vk})`; g.lineWidth = 26; g.beginPath(); g.arc(0, 0, 90 + i * 24, 0, 2.2); g.stroke(); } g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 24; i++) { const ph = (t * 2 + rnd(i, 1)) % 1, a = rnd(i, 2) * 6.28 + ph * 4, d = 260 * (1 - ph); glowDot(V[0] + Math.cos(a) * d, V[1] + Math.sin(a) * d, 16, '140,200,255', vk * ph); } g.restore(); }
    if (t > tm) glitch(.4 * (1 - seg(t, tm, tdz)), t); return; }
  cam(1.0 + .2 * seg(t, tdz, sc.t1), 540, 960); screen(); sunburst(540, 900, 0, '#20243e', '#272c4a'); apply(1); spr('zeusb_2', 540, 1960, 1250);
  const q = seg(t, tdz + .4, tdz + .7); if (q > 0) { screen(); g.save(); g.translate(860, 650 + Math.sin(t * 5) * 14); g.rotate(.15); g.scale(back(q), back(q)); stroked('?', 0, 0, '200px Anton', '#ffd65a', { lw: 22 }); g.restore(); }
};
SCENES.trovao = (t, lt, sc) => {
  const tt = wt('s08', 'trovão'), dk = eio(seg(t, sc.t0, tt)), pk = [490, 640];
  if (t < tt + 1.0) { cam(1.0 + lt * .05, 540, 900); AMZ(t, .45 + .35 * dk); stormSky(t, dk); if (t >= tt - .06 && t < tt + .35) bolt(pk[0] + 80, -60, pk[0], pk[1], t, '255,240,170', 18, { prog: eo(seg(t, tt - .06, tt + .02)) });
    dust(t, tt, pk[0], pk[1], 26, '#7a6a5a'); if (t > tt) glowDot(pk[0], pk[1], 260 * (1 - seg(t, tt, tt + .8)), '255,240,180', .8); leaves(t, 1, 1); }
  else { const u = seg(t, tt + 1.0, sc.t1); cam(1.0 + .5 * eio(u), 540, 1000); AMZ(t, .8); stormSky(t, 1); fog(t, .9, '110,100,90', 700);
    spr('onca_0', 540, 1500, 900, { tint: '#07060a', a: .85, glow: 'rgba(255,215,90,.7)', gb: 40 }); eyes(310, 1040, .3, seg(t, tt + 1.4, tt + 1.8), t, '255,220,120'); leaves(t, 1, 1); }
};
SCENES.tupa = (t, lt, sc) => {
  const tp = wt('s09', 'Tupã') - .05, tv = wt('s09', 'visitantes') - .1; let z, cy;
  if (t < tv) { const u = eio(seg(t, sc.t0 + .2, tp + 1.6)); z = 2.0; cy = lerp(1700, 600, u); } else { const u = eo(seg(t, tv, tv + .5)); z = lerp(2.0, 1.0, u); cy = lerp(600, 1000, u); }
  cam(z, 540, cy); const sb = seg(t, tp - .2, tp + .3); AMZ(t, .75); stormSky(t, 1);
  if (sb > 0) { g.save(); g.globalAlpha = sb; screen(); sunburst(540, 760, t, '#0f3f26', '#16593a'); g.restore(); apply(1); }
  spr('onca_0', 300, 1880, 760, { glow: 'rgba(255,215,90,.8)', gb: 30 });
  const r = spr('tupa_0', 600, 1900, 1500 * breathe(t, 2), { sway: [t, 5] });
  for (let i = 0; i < 4; i++) { const k = Math.floor(t * 7) + i * 17; const sx = r.x + r.w * (.1 + .8 * rnd(k, 1)), sy = r.y + r.h * (.1 + .7 * rnd(k, 2)); bolt(sx, sy, sx + (rnd(k, 3) - .5) * 260, sy + (rnd(k, 4) - .5) * 260, t + i, ['220,255,150', '255,230,140', '255,255,255', '150,255,170'][i], 5, { branches: false }); }
  unlock('ut', 'TUPÃ', t, tp, sc.t1 + .2, '#1d7a45', { full: true });
};
SCENES.tres = (t, lt, sc) => {
  const tb = L0('s10b') - .1, ta = wt('s10b', 'agora') - .05, tm = wt('s10b', 'mais') - .05, te = L1('s10b') + .1;
  const bz = (c1, c2) => { screen(); sunburst(540, 900, t * .3, c1, c2); apply(1); };
  if (t < tb) { cam(1.05 + lt * .05, 540, 960); bz('#3a2a5a', '#46336c'); spr('zeusb_2', 540, 1960, 1250); }
  else if (t < ta) { cam(1.1, 540, 960); bz('#1d3d8a', '#2850a8'); spr('zeusb_1', 540, 1960, 1250); }
  else if (t < tm) { cam(1.1, 540, 960); bz('#7a1420', '#9a2028'); spr('xangob_0', 560, 1960, 1250); }
  else if (t < te) { cam(1.1, 540, 960); bz('#0f3f26', '#16593a'); spr('tupa_3', 520, 1960, 1250); }
  else { const u = eo(seg(t, te, te + .25)); cam(1 + 1.3 * u, 560, 1080); bz('#1d3d8a', '#2850a8'); spr('zeusb_1', 540, 1960, 1250); }   // comic zoom
};
SCENES.advert = (t, lt, sc) => {
  const tv = L0('s11b') - .05, tf = wt('s11b', 'floresta') - .05;
  if (t < tv) { cam(1.05 + lt * .05, 540, 960); AMZ(t, .5, { s: 1.6 }); spr('tupa_3', 520, 1960, 1250, { sway: [t, 4] }); leaves(t, 1, 1); return; }
  const down = eio(seg(t, tf, tf + 1.0)); cam(1.0, 540, lerp(1000, 1900, down)); AMZ(t, .55); leaves(t, .8 * (1 - down), 1);
  apply(1); g.fillStyle = '#1a120e'; g.fillRect(-400, 1860, W + 800, 1400); g.fillStyle = '#2a1d15'; for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(rnd(i, 1) * W, 1950 + rnd(i, 2) * 900, 40 + 60 * rnd(i, 3), 18 + 20 * rnd(i, 4), 0, 0, 7); g.fill(); }
  const r = spr('tupa_1', 760, 1880, 900); const p = at(r, .1, .95);
  roots(p[0], p[1], seg(t, tv + .3, tf + 1.2), t);
  if (down > 0) { rift(540, 2450, 900, seg(t, tf + .3, tf + 1.2), t, { open: 40 }); for (let i = 0; i < 5; i++) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(170,255,120,${.6 * down})`; g.lineWidth = 6;
      g.beginPath(); g.moveTo(150 + i * 200, 1880); g.bezierCurveTo(150 + i * 200 + 60, 2100, 540 + (i - 2) * 120, 2200, 540 + (i - 2) * 140, 2400); g.stroke(); g.restore(); }
    particles(t, 30, { cols: ['150,255,140'], r: 5, add: true, up: true, speed: 1 }); }
};
SCENES.jaci = (t, lt, sc) => {
  const tn = wt('s12', 'noite'), tfg = wt('s12', 'figura') - .1, k = eio(seg(t, sc.t0 + .2, tn + .3)), u = seg(t, sc.t0, sc.t1);
  cam(1.05 + .12 * u, 540, 1000); AMZ(t, 0); clouds(t * 5, 4, 150, 450, 60, '#fff', '#5c6f9a', .8, 4, .3); night(k, t); riverShine(t, 1180, 1560, .35, '190,210,255');
  // first only her reflection on the river, then Jaci herself
  const ra = seg(t, tn, tn + .6) * (1 - seg(t, tfg + .3, tfg + .9)); if (ra > 0) { apply(1); g.save(); g.beginPath(); g.rect(-400, 1240, W + 800, 900); g.clip(); g.translate(540, 1240); g.scale(1, -1); g.globalAlpha = .55 * ra; spr('jaci_0', 0, 0, 760, { sway: [t * 2, 14], glow: 'rgba(160,200,255,.9)', gb: 30 }); g.restore(); }
  const ma = seg(t, tfg, tfg + .9); if (ma > 0) { glowDot(540, 900, 640, '150,190,255', .4 * ma); spr('jaci_0', 540, lerp(1540, 1500, ma), 980 * breathe(t, 5), { a: ma, glow: 'rgba(170,210,255,.95)', gb: 50 }); particles(t * .5, 40, { cols: ['220,230,255', '170,200,255'], r: 5, add: true, up: true, speed: .7 }); }
  leaves(t, 1, 1);
  unlock('uj', 'JACI', t, tfg - .25, sc.t1 + .2, '#3a5aa8', {});
};
SCENES.visao = (t, lt, sc) => {
  const WS = ['bg_olympus', 'bg_africa', 'bg_nordic', 'bg_egypt', 'bg_asia'], d = (sc.t1 - sc.t0 - .2) / 5, n = Math.min(4, Math.floor(lt / d)), k = (lt - n * d) / d;
  cam(1.0 + .12 * k, 540, 960); worldPane(WS[n], t); portal(540, 820, 120 + 30 * Math.sin(t * 3), t, '150,190,255', '255,255,255', { sy: 1.3 });
  screen(); g.fillStyle = 'rgba(40,70,160,.25)'; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + t * .5; glyph(540 + Math.cos(a) * 420, 1000 + Math.sin(a) * 300, .45, t + i, .5); } g.restore();
  ripple(k < .25 ? (1 - k / .25) * 1.5 : .35, t); vignette(.6, '10,20,60');
  const cnt = ['3', '7', '12', '?', '?'][n]; pill('pd', 'PORTAIS DETECTADOS', t, sc.t0 + .1, sc.t1 + .1, 530, { px: 44, bg: '#120c22', fg: '#9fe9ff', line: '#5ee7ff', r: 14 });
  screen(); const pu = k < .2 ? back(k / .2) : 1; g.save(); g.translate(540, 680); g.scale(pu, pu); stroked(cnt, 0, 0, '130px Anton', n >= 3 ? '#ff4d5e' : '#ffd65a', { lw: 18 }); g.restore();
};
SCENES.guaraci = (t, lt, sc) => {
  const tg = wt('s14', 'Guaraci') - .1, tfz = wt('s14', 'força') - .1, u = seg(t, sc.t0, sc.t1);
  cam(1.05 + .08 * u, 540 + Math.sin(lt * .9) * 40, 980, Math.sin(lt * .9) * .03);   // a slow circling move
  AMZ(t, .78 - .5 * seg(t, tg, tg + .6), { darkc: '20,10,30' }); night(1 - seg(t, tg, tg + .5), t);
  const l = seg(t, tg, tg + .7); if (l > 0) { screen(); g.save(); g.globalAlpha = l; rays(540, 820, 20, t, '255,200,90', .16, 1800, .15); g.restore(); apply(1); glowDot(540, 900, 700, '255,190,80', .55 * l);
    spr('guaraci_0', 540, 1840, 1180 * breathe(t, 6), { a: clamp(l * 1.4), glow: 'rgba(255,200,90,.95)', gb: 60 }); particles(t, 50, { cols: ['255,210,100', '255,160,60'], r: 6, add: true, up: true, speed: 1.2 }); }
  const sh = seg(t, tfz, sc.t1); if (sh > 0) shadowMass(lerp(1300, 980, sh), lerp(300, 520, sh), 1.4, t, sh);
  unlock('ug', 'GUARACI', t, tg + .2, sc.t1 + .2, '#d07a12', {});
};
SCENES.criatura = (t, lt, sc) => {
  const tr = wt('s15', 'rugido') - .05, u = seg(t, sc.t0, sc.t1);
  cam(1.0 + .25 * eio(u), 540, lerp(1000, 900, u)); bg('bg_amazon', .35, { dark: .85, darkc: '8,4,16', dx: Math.sin(t * 30) * 6 * seg(t, tr, tr + .3) });
  shadowMass(540, 520, 1.9, t, seg(t, sc.t0, sc.t0 + 1.5)); eyes(540, 560, .7, seg(t, tr - .1, tr + .3), t, '255,50,40');
  fog(t, 1, '40,20,50', 1000); spr('onca_1', 560, 1880, 650, { glow: 'rgba(255,215,90,.6)', gb: 25, sx: 1 + .02 * Math.sin(t * 8) }); leaves(t, 1, 1); vignette(.8, '0,0,0');
};
SCENES.alianca = (t, lt, sc) => {
  const u = seg(t, sc.t0, sc.t1), ta = T.ally; cam(1.1 + .1 * Math.sin(lt * .8), 540 + Math.sin(lt * 1.1) * 50, 1000, Math.sin(lt * 1.1) * .02);
  AMZ(t, .78 - .4 * seg(t, ta, ta + 1), { darkc: '8,4,16' }); shadowMass(540, 280 - 300 * seg(t, ta, ta + 1.2), 1.6, t, 1 - seg(t, ta, ta + 1.2));
  glowDot(180, 860, 260, '170,210,255', .5); spr('jaci_0', 180, 1200, 560, { glow: 'rgba(170,210,255,.9)', gb: 30, a: .9 });
  glowDot(900, 860, 260, '255,200,90', .5); spr('guaraci_0', 900, 1200, 580, { glow: 'rgba(255,200,90,.9)', gb: 30, a: .9 });
  spr('ogum_0', 90, 1960, 900); spr('iansa_0', 1000, 1960, 880, { sway: [t, 10], flip: true });
  const Z = spr('zeus_2', 300, 1900, 980), X = spr('xango_1', 560, 1900, 1040), P = spr('tupa_2', 800, 1900, 1000, { flip: true, sway: [t, 4] });
  const M = [560, 420], p = eo(seg(t, wt('s16', 'ergueram') - .1, ta)); const hs = [[at(Z, .3, .05), '140,200,255'], [at(X, .45, .06), '255,120,80'], [at(P, .15, .03), '255,230,140']];
  for (const [[hx, hy], c] of hs) if (p > 0) bolt(hx, hy, lerp(hx, M[0], p), lerp(hy, M[1], p), t + hx, c, 12);
  if (t > ta) { bolt(M[0], M[1], M[0], -200, t, '255,255,255', 26); glowDot(M[0], M[1], 300, '255,255,255', .8); }
  particles(t, 40, { cols: ['140,200,255', '255,120,80', '255,230,140'], r: 6, add: true, speed: 2 });
};
SCENES.descob = (t, lt, sc) => {
  const tf = wt('s17', 'fragmento') - .1, u = seg(t, sc.t0, sc.t1);
  if (t < tf) { cam(1.05, 540, 1000); AMZ(t, .45 - .3 * u); fog(t, .4, '255,255,255', 800); const x = lerp(1250, 700, eo(seg(t, sc.t0, tf - .2)));
    const r = spr('anhanga_2', x, 1700, 820, { glow: 'rgba(190,250,255,.8)', gb: 30 }); const f = at(r, -.05, .3); fragment(f[0], f[1], .45, t); leaves(t, 1); }
  else { const v = eio(seg(t, tf, tf + .6)); cam(1.0, 540, 960); AMZ(t, .5, { s: 1.6 }); screen(); g.fillStyle = 'rgba(20,10,40,.45)'; g.fillRect(0, 0, W, H); apply(1);
    fragment(540, 980, lerp(.6, 1.9, v), t); particles(t, 30, { cols: ['200,160,255', '255,215,90'], r: 5, add: true, up: true, speed: 1 }); }
};
SCENES.destino = (t, lt, sc) => {
  const tt = wt('s18', 'tocou'), td = wt('s18', 'dois') - .1;
  if (t < td) { cam(1.1 + .1 * seg(t, sc.t0, td), 540, 1000); AMZ(t, .45); spr('tupa_2', 400, 1900, 1250, { flip: true }); fragment(720, 760, .7, t); if (t > tt) { glowDot(720, 760, 400 * seg(t, tt, tt + .3), '220,180,255', .9 * (1 - seg(t, tt + .3, td))); } return; }
  const k = eo(seg(t, td, td + .5));
  clip(442, 960, () => { cam(1, 540, 960); screen(); g.fillStyle = '#0a1830'; g.fillRect(0, 0, W, H); g.save(); g.beginPath(); g.ellipse(540, 720, 420 * k, 240 * k, 0, 0, 7); g.clip(); g.translate(0, -240); bg('bg_nordic', 0, { s: 1.0 });
      const lf = Math.max(0, Math.sin(t * 4.3)) > .92 ? .7 : 0; spr('gods_0', 600, 1220, 700, { tint: '#081220' }); if (lf) { g.globalAlpha = lf; spr('gods_0', 600, 1220, 700); g.globalAlpha = 1; } g.restore();
    g.lineWidth = 12; g.strokeStyle = '#7fd0ff'; g.shadowColor = '#7fd0ff'; g.shadowBlur = 30; g.beginPath(); g.ellipse(540, 720, 420 * k, 240 * k, 0, 0, 7); g.stroke(); g.shadowBlur = 0; });
  clip(960, H, () => { screen(); g.fillStyle = '#2a1a06'; g.fillRect(0, 0, W, H); g.save(); g.beginPath(); g.ellipse(540, 1260, 420 * k, 260 * k, 0, 0, 7); g.clip(); g.translate(0, 300); bg('bg_egypt', 0, { s: 1.0 });
      const r = spr('gods_1', 520, 1300, 760, { tint: '#120c04' }); const e = at(r, .46, .12); eyes(e[0], e[1], .12, 1, t, '255,215,90'); g.restore();
    g.lineWidth = 12; g.strokeStyle = '#ffd65a'; g.shadowColor = '#ffd65a'; g.shadowBlur = 30; g.beginPath(); g.ellipse(540, 1260, 420 * k, 260 * k, 0, 0, 7); g.stroke(); g.shadowBlur = 0; });
  splitLine(960, '#fff'); particles(t, 30, { cols: ['150,210,255', '255,215,90'], r: 6, add: true, speed: 1.5 });
};
SCENES.part = (t, lt, sc) => {
  const tm = wt('s19', 'mil') - .1, te = sc.t1 - .2;
  cam(1, 540, 960); screen(); sunburst(540, 960, t * .4, '#120c26', '#1a1236'); apply(1); fragment(540, 600, .55, t);
  const likes = Math.round(3000 * eio(seg(t, tm, te)) / 10) * 10;
  screen(); g.save(); g.translate(250, 790); const hb = 1 + .08 * Math.max(0, Math.sin(t * 9)); g.scale(hb, hb); g.fillStyle = '#ff3b6b'; g.strokeStyle = '#0d0a18'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-90, -20, -60, -90, 0, -45); g.bezierCurveTo(60, -90, 90, -20, 0, 40); g.fill(); g.stroke(); g.restore();
  stroked(likes.toLocaleString('pt-BR'), 560, 792, '110px Anton', '#fff', { lw: 16 }); stroked('CURTIDAS', 860, 805, '44px Anton', '#ffd65a', { lw: 10, align: 'left' }); note('curt', 'CURTIDAS', 860, 782, 1040, 828);
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(90, 880, 900, 50, 25); g.fill(); g.fillStyle = '#ffd65a'; rr(90, 880, Math.max(50, 900 * likes / 3000), 50, 25); g.fill(); g.lineWidth = 6; g.strokeStyle = '#0d0a18'; rr(90, 880, 900, 50, 25); g.stroke();
  for (let i = 1; i <= 3; i++) { g.fillStyle = '#0d0a18'; g.fillRect(90 + 300 * i - 3, 870, 6, 70); }
  for (let i = 0; i < 3; i++) { const y = 990 + i * 112, th = (i + 1) * 1000, open = likes >= th, s = back(seg(t, L0('s19') + .3 + i * .2, L0('s19') + .7 + i * .2));
    if (s <= 0) continue; g.save(); g.translate(540, y); g.scale(s, s); g.fillStyle = open ? '#2b5a3a' : '#2a2346'; rr(-430, -48, 860, 96, 22); g.fill(); g.lineWidth = 6; g.strokeStyle = open ? '#7dffa0' : '#ffd65a'; g.stroke();
    const tx = `PISTA 0${i + 1}`; stroked(tx, -370, 0, '54px Anton', '#fff', { lw: 10, align: 'left' }); stroked(`${th.toLocaleString('pt-BR')} CURTIDAS`, 380, 0, '42px Anton', '#ffd65a', { lw: 8, align: 'right' });
    g.save(); g.translate(-40, 0); g.fillStyle = open ? '#7dffa0' : '#ffd65a'; g.strokeStyle = '#0d0a18'; g.lineWidth = 5; rr(-26, -10, 52, 42, 8); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -10, 18, Math.PI, open ? Math.PI * 1.55 : 0); g.lineWidth = 9; g.strokeStyle = open ? '#7dffa0' : '#ffd65a'; g.stroke(); g.restore(); g.restore();
    note('p' + i, tx, 170, y - 28, 330, y + 28); note('pc' + i, `${th.toLocaleString('pt-BR')} CURTIDAS`, 600, y - 21, 920, y + 21); }
  pill('sob', 'PISTAS SOBRE A CRIATURA', t, L0('s19') + .6, sc.t1, 1490, { px: 40, bg: '#3a0a1a', fg: '#ff9db0', line: '#ff4d6d', r: 14 });
  particles(t * 1.2, 30, { cols: ['255,215,90'], r: 6, add: true, up: true, speed: 1 });
};
SCENES.opA = (t, lt, sc) => {
  const ta = sc.t0 + .05, tz = wt('s20', 'portal') - .2;
  if (t < tz) { cam(1, 540, 960); screen(); sunburst(540, 1000, t * .4, '#13306b', '#1b3f86'); apply(1); pill('la', 'A', t, ta, tz, 900, { px: 360, bg: '#9fdcff', fg: '#13306b', r: 60, glow: 'rgba(120,190,255,.9)' }); pill('oa', 'OPÇÃO', t, ta - .2, tz, 560, { px: 70, bg: '#fff' }); return; }
  const u = seg(t, tz, sc.t1); cam(1.05 + .15 * u, 540, 960); bg('bg_nordic', .35); stormSky(t, .5);
  const fl = (Math.sin(t * 3.7) > .9 ? 1 : 0) + Math.max(0, 1 - Math.abs(t - wt('s20', 'Thor')) / .3); if (fl > 0) bolt(380, -50, 520, 700, t, '200,230,255', 10);
  const r = spr('gods_0', 560, 1380, 760, { tint: '#0b1424' }); if (fl > 0) { g.save(); g.globalAlpha = clamp(fl) * .7; spr('gods_0', 560, 1380, 760); g.restore(); }
  g.save(); g.beginPath(); g.arc(r.x + r.w * .76, r.y + r.h * .13, 110, 0, 7); g.clip(); spr('gods_0', 560, 1380, 760); g.restore();   // only the hammer catches the light
  spr('zeus_0', 160, 1960, 780); spr('xango_0', 520, 1990, 800); spr('tupa_0', 900, 1960, 800, { sway: [t, 4] });
  particles(t, 70, { cols: ['255,255,255', '230,242,255'], r: 5, vx: -.6, speed: 1.3, a: .9 });
  pill('a2', 'A', t, tz, sc.t1, 530, { px: 100, bg: '#9fdcff', fg: '#13306b', r: 30, x: 140 });
  pill('a3', 'O PORTAL CONGELADO', t, tz, sc.t1, 1490, { px: 50, bg: '#13306b', fg: '#9fdcff', line: '#9fdcff', r: 18 });
};
SCENES.opB = (t, lt, sc) => {
  const tb = sc.t0 + .05, te = wt('s21', 'seguir') + .6, tc = wt('s21', 'conhece') - .1;
  if (t < te) { cam(1, 540, 960); screen(); sunburst(540, 1000, t * .4, '#6b4a0e', '#86601b'); apply(1); pill('lb', 'B', t, tb, te, 900, { px: 360, bg: '#ffd65a', fg: '#5a3a06', r: 60, glow: 'rgba(255,200,90,.9)' }); pill('ob', 'OPÇÃO', t, tb, te, 560, { px: 70, bg: '#fff' }); return; }
  const z = t < tc ? 1.05 + .05 * seg(t, te, tc) : lerp(1.1, 2.6, eo(seg(t, tc, tc + .6))); cam(z, t < tc ? 540 : 560, t < tc ? 1000 : 700);
  bg('bg_egypt', .35); particles(t, 60, { cols: ['#e6b872', '#c9944a'], r: 4, leaf: true, vx: 1.8, speed: 1.6 });
  const r = spr('gods_1', 560, 1640, 1200, { tint: '#1a1206' }); g.save(); g.globalAlpha = .45; spr('gods_1', 560, 1640, 1200); g.restore();
  const s = at(r, .07, .25); glyph(s[0], s[1] - 10, .35, t); glowDot(s[0], s[1], 110, '190,140,255', .6);
  const e = at(r, .46, .12); eyes(e[0], e[1], .14, 1, t, '255,215,90');
  pill('b2', 'B', t, te, sc.t1, 530, { px: 100, bg: '#ffd65a', fg: '#5a3a06', r: 30, x: 140 });
  pill('b3', 'SEGUIR PARA O EGITO', t, te, sc.t1, 1490, { px: 50, bg: '#5a3a06', fg: '#ffd65a', line: '#ffd65a', r: 18 });
};
SCENES.cta = (t, lt, sc) => {
  const tp = L0('s22b') - .1, cut = sc.t1 - .55;
  if (t >= cut) { screen(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return 'black'; }
  if (t < tp) { const pa = 1 + .04 * Math.max(0, Math.sin(t * 6)), pb = 1 + .04 * Math.max(0, Math.sin(t * 6 + Math.PI));
    clip(442, 960, () => { cam(1, 540, 960); bg('bg_nordic', 0, { s: 1.0, dy: -200 }); screen(); spr('gods_0', 800, 980, 480, { tint: '#0b1424' }); g.save(); g.translate(360, 720); g.scale(pa, pa); stroked('A', 0, 0, '260px Anton', '#9fdcff', { lw: 22 }); g.restore(); });
    clip(960, H, () => { screen(); bg('bg_egypt', 0, { s: 1.0, dy: 300 }); screen(); spr('gods_1', 800, 1560, 520, { tint: '#1a1206' }); g.save(); g.translate(360, 1240); g.scale(pb, pb); stroked('B', 0, 0, '260px Anton', '#ffd65a', { lw: 22 }); g.restore(); });
    splitLine(960, '#fff'); screen(); stroked('OU', 540, 960, '70px Anton', '#fff', { lw: 14 }); }
  else {   // the group, and something behind them
    const u = seg(t, tp, cut); cam(1.0 + .15 * u, 540, 1000); bg('bg_amazon', .35, { dark: .82, darkc: '8,4,16' }); shadowMass(540, 900, 1.6, t, .9 * seg(t, tp, tp + 1));
    eyes(540, 840, .9, seg(t, T.eyes, T.eyes + .15), t, '255,40,40');
    spr('zeus_0', 160, 1960, 760); spr('ogum_0', 360, 1990, 780); spr('xango_0', 560, 1980, 800); spr('iansa_1', 760, 1980, 760, { sway: [t, 5] }); spr('tupa_0', 950, 1970, 800); vignette(.85, '0,0,0'); }
  pill('vd', 'VOCÊ DECIDE O PRÓXIMO PANTEÃO', t, sc.t0 + .15, cut, 530, { px: 46, bg: '#ffd65a', r: 16 });
  pill('ce', 'COMENTE A OU B', t, wt('s22a', 'Comente') - .1, cut, 1560, { px: 60, bg: '#fff', rot: -2 });
  const k = clamp((t - wt('s22a', 'Comente') - .3) / .25); if (k > 0) { screen(); g.save(); g.globalAlpha = k; const b = Math.sin(t * 7) * 8; stroked('comenta aqui embaixo ↓', 540, 1680 + b, '600 52px Fredoka', '#fff', { lw: 10 }); g.restore(); if (k >= 1) note('comenta', 'comenta aqui embaixo', 300, 1650, 780, 1710); }
};

// ---------------------------------------------------------------- frame
const ORDER = ['hook', 'recap', 'queda', 'terr', 'observa', 'anhanga', 'provoc', 'trovao', 'tupa', 'tres', 'advert', 'jaci', 'visao', 'guaraci', 'criatura', 'alianca', 'descob', 'destino', 'part', 'opA', 'opB', 'cta'];
function render(t) {
  t = clamp(t, 0, DUR - 1e-4); TX = []; screen(); g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  SH = shake(t); const id = ORDER.find(k => t >= S0(k) && t < S1(k)) || 'cta', sc = TL.scenes[id];
  const r = SCENES[id](t, t - sc.t0, sc); screen(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (r === 'black') return;
  flash(t); vignette(.4); hud(t); brand(); caption(t);
  if (id === 'hook') { bigText('i1', ['OUTRO SENHOR', 'DOS TROVÕES?'], t, wt('s01', 'outro') - .05, wt('s01', 'Desta') - .1, 1000, { px: 116, cols: ['#ffffff', '#ffd65a'] });
    bigText('i2', ['NO BRASIL!'], t, wt('s01', 'Brasil') - .05, S1('hook'), 1000, { px: 150, cols: ['#7dffa0'] }); }
  if (t > S0('advert') && t < S0('visao')) pill('amz', 'AMEAÇA DIMENSIONAL DETECTADA', t, wt('s11b', 'floresta') - .1, S0('jaci') + 2.6, 530, { px: 40, bg: '#ff2e4a', fg: '#fff', r: 14 });
  if (t > S0('descob') && t < S0('part')) pill('item', 'ITEM MISTERIOSO ENCONTRADO', t, wt('s17', 'fragmento') - .1, S0('destino') + 2.3, 1490, { px: 46, bg: '#2a1a4a', fg: '#e0c8ff', line: '#b48cff', r: 14 });
  if (t > S0('alianca') && t < S0('destino')) pill('ali', 'ALIANÇA ENTRE OS PANTEÕES DESBLOQUEADA', t, T.ally, S0('descob') + 3.3, 530, { px: 38, bg: '#ffd65a', r: 14 });
}
function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o }), w = wt;
  for (const id in TL.lines) E(L0(id), 'vo', { id });
  for (const e of IMP) if (e.a >= 30) E(e.t, 'thunder'); else if (e.a >= 14 || e.f >= .4) E(e.t, 'impact', { v: Math.min(1, (e.a + 30 * e.f) / 40) });
  E(0, 'riser', { d: .25 }); E(.3, 'roar', { d: 1.4 }); E(w('s01', 'outro') - .05, 'freeze'); E(w('s01', 'Brasil') + .4, 'cutsil');
  E(S0('recap'), 'whoosh'); for (let i = 1; i < 5; i++) E(S0('recap') + i * (S1('recap') - S0('recap')) / 5, 'cut'); E(w('s02', 'atravessar'), 'portal', { d: 1.8 }); E(w('s02', 'atravessar') + .2, 'teleport');
  E(w('s03', 'errado') - .05, 'alarm', { n: 2 }); E(w('s03', 'lançou'), 'fall', { d: T.splash - w('s03', 'lançou') }); E(T.splash, 'splash'); E(L1('s03') + .1, 'gulp'); E(L1('s03') + .35, 'boing'); E(w('s03', 'floresta'), 'drain');
  E(S0('terr'), 'jungle', { d: S1('observa') - S0('terr') }); E(S0('terr') + .3, 'notify'); E(S0('terr') + 1.2, 'macaw'); E(S0('terr') + 3.4, 'macaw');
  E(L0('s05') + .4, 'twig'); E(w('s05', 'Havia'), 'heart', { d: S1('observa') - w('s05', 'Havia') }); E(w('s05', 'seguindo'), 'twig');
  E(w('s06', 'Anhangá') - .3, 'shimmer'); E(w('s06', 'Anhangá'), 'unlock'); E(w('s06', 'animais'), 'dissolve'); E(S0('anhanga'), 'spiritwind', { d: S1('anhanga') - S0('anhanga') });
  E(w('s07', 'lançou') - .05, 'charge'); E(w('s07', 'lançou') + .4, 'zap', { d: w('s07', 'Mas') - w('s07', 'lançou') }); E(w('s07', 'Mas') - .1, 'suck'); E(w('s07', 'desapareceu') - .05, 'silence');
  E(S0('trovao'), 'rumble', { d: w('s08', 'trovão') - S0('trovao') }); E(w('s08', 'trovão') + .9, 'roar', { d: 2.2 });
  E(w('s09', 'Tupã') - .05, 'unlock'); E(w('s09', 'Tupã') + .3, 'levelup'); E(S0('tupa') + .2, 'zap', { d: 4 });
  E(L0('s10b') - .1, 'cut'); E(w('s10b', 'agora') - .05, 'cut'); E(w('s10b', 'mais') - .05, 'cut'); E(L1('s10b') + .1, 'boing'); E(L1('s10b') + .1, 'musicstop');
  E(L0('s11b'), 'pulse', { d: S1('advert') - L0('s11b') }); E(L0('s11b') + .3, 'roots', { d: 2.5 }); E(w('s11b', 'floresta') - .1, 'alarm', { n: 3 });
  E(S0('jaci') + .2, 'riser', { d: w('s12', 'noite') - S0('jaci') }); E(w('s12', 'figura') - .1, 'bells'); E(w('s12', 'figura'), 'unlock');
  { const d = (S1('visao') - S0('visao') - .2) / 5; for (let i = 0; i < 5; i++) E(S0('visao') + i * d, i ? 'ripple' : 'whoosh'); for (let i = 0; i < 4; i++) E(S0('visao') + i * d + .05, 'impact', { v: .5 }); }
  E(w('s14', 'Guaraci') - .1, 'sunburst'); E(w('s14', 'Guaraci') + .2, 'unlock'); E(w('s14', 'força') - .1, 'darkgrow', { d: S1('guaraci') - w('s14', 'força') });
  E(S0('criatura') + .1, 'heart', { d: S1('criatura') - S0('criatura') }); E(w('s15', 'rugido') - .1, 'roar', { d: 2.0, big: 1 }); E(w('s15', 'rugido') + .2, 'alarm', { n: 3 }); E(L0('s15') + .3, 'growl', { d: 1.6 });
  E(w('s16', 'ergueram') - .1, 'zap', { d: T.ally - w('s16', 'ergueram') + .1 }); E(w('s16', 'ergueram') - .2, 'riser', { d: T.ally - w('s16', 'ergueram') + .2 }); E(T.ally + .05, 'levelup');
  E(w('s17', 'fragmento') - .1, 'rare'); E(S0('descob') + .2, 'jungle', { d: S1('descob') - S0('descob') });
  E(w('s18', 'tocou'), 'touch'); E(w('s18', 'dois') - .1, 'portal', { d: 3 }); E(w('s18', 'portais') + .1, 'charge');
  { const tm = w('s19', 'mil') - .1, te = S1('part') - .2; for (let i = 0; i < 3; i++) { const u = Math.acos(1 - 2 * ((i + 1) / 3)) / Math.PI; E(tm + (te - tm) * u, 'levelup'); } for (let k = 0; k < 14; k++) E(tm + (te - tm) * k / 14, 'coin'); E(L0('s19') + .3, 'notify'); E(L0('s19') + .5, 'pop'); E(L0('s19') + .7, 'pop'); E(L0('s19') + .9, 'pop'); }
  E(S0('opA') + .05, 'mission'); E(w('s20', 'portal'), 'icewind', { d: S1('opA') - w('s20', 'portal') }); E(w('s20', 'Thor'), 'thunder');
  E(S0('opB') + .05, 'mission'); E(w('s21', 'seguir') + .6, 'sand', { d: S1('opB') - w('s21', 'seguir') - .6 }); E(w('s21', 'conhece') - .1, 'impact', { v: .9 });
  E(S0('cta') + .15, 'pop'); E(w('s22a', 'Comente') - .1, 'pop'); E(L0('s22b') - .1, 'heart', { d: S1('cta') - .55 - L0('s22b'), fast: 1 }); E(T.eyes, 'roar', { d: .9, big: 1 }); E(S1('cta') - .55, 'cutblack');
  return ev.sort((a, b) => a.t - b.t);
}
(async () => {
  TL = await (await fetch('timeline.json')).json(); DUR = TL.dur;
  const idx = await (await fetch('parts/index.json')).json(); const keys = Object.keys(idx).concat(['bg_olympus', 'bg_africa', 'bg_amazon', 'bg_nordic', 'bg_egypt', 'bg_asia']);
  await Promise.all(keys.map(k => new Promise(res => { const im = new Image(); im.onload = res; im.onerror = res; im.src = k.startsWith('bg_') ? `src/${k}.png` : `parts/${k}.png`; IM[k] = im; })));
  await Promise.all(['84px Anton', '600 46px Fredoka', '600 52px Fredoka'].map(f => document.fonts.load(f, 'AÃÉÍÓÇÔáãéíóçô0123456789?↓:')));
  const av = new Image(); av.src = 'brand/avatar.jpg'; await av.decode().catch(() => {}); AV = av.naturalWidth ? av : null;
  T = { splash: wt('s03', 'floresta') + .15, zap: wt('s07', 'raio') + .3, ally: wt('s16', 'escuridão') + .15, eyes: wt('s22c', 'junto') };
  impacts(); NOCAP = [[wt('s01', 'outro') - .1, wt('s01', 'Desta') - .1], [wt('s01', 'Brasil') - .1, S1('hook')]];
  window.DUR = DUR; window.render = render; window.EV = events();
  window.TEXTS = t => { render(t); return TX.map(o => ({ ...o })); };
  render(Q.get('t') ? +Q.get('t') : 1); window.READY = true;
})();
