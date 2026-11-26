// O Encontro dos Panteões — Ep. 03 (same engine as Ep. 01–02). 2D cartoon on one canvas: generated character art (parts/), painted backgrounds (src/bg_*),
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
const YEL = new Set('zeus xango tupa thor heimdall anubis martelo trovoes trovao senhores fragmento fragmentos simbolo ponte arcoiris arvore raizes mapa mundos curtidas pedaco egito observador portal quatro'.split(' '));
const RED = new Set('sombra escuridao escurecendo ferida criatura sozinhos cuidado assistindo congelou'.split(' '));
let NOCAP = [];
function capColor(w, line) { const n = norm(w); if ((n === 'a' || n === 'b') && /s21|s22|s23a/.test(line) && /[AB]/.test(w)) return '#ffd65a';
  if (RED.has(n) && false) return '#ff4d5e'; if (YEL.has(n)) return '#ffd65a'; return '#ffffff'; }
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

// ---------------------------------------------------------------- HUD
function bar(x, y, w, v, max, col, t, alertT) {
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(x, y, w, 22, 11); g.fill();
  const f = clamp(v / max), danger = v < 15; const c = danger ? (Math.sin(t * 14) > 0 ? '#ff3b4e' : '#ff8a3b') : col;
  if (f > .01) { g.fillStyle = c; rr(x, y, Math.max(22, w * f), 22, 11); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; rr(x + 6, y + 3, Math.max(10, w * f - 12), 6, 3); g.fill(); }
  for (let i = 1; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + w * i / 10, y, 2, 22); }
  g.lineWidth = 3; g.strokeStyle = '#0d0a18'; rr(x, y, w, 22, 11); g.stroke();
  if (alertT != null && t - alertT < 1.6 && t >= alertT && Math.sin((t - alertT) * 18) > -.3) glowDot(x + w * f, y + 11, 60, '255,60,60', .8);
}
// ---------------------------------------------------------------- Ep. 02 drawing helpers (re-used)
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

// ---------------------------------------------------------------- Ep. 03 helpers
function aurora(t, a = .6) {   // waving bands of light high in the sky
  apply(.3); g.save(); g.globalCompositeOperation = 'lighter';
  for (let b = 0; b < 3; b++) { const col = ['90,255,170', '160,110,255', '90,200,255'][b];
    for (let i = 0; i < 40; i++) { const x = -200 + i * 38, y = 260 + b * 120 + Math.sin(i * .35 + t * (.8 + b * .3) + b) * 70; const gr = g.createLinearGradient(x, y - 220, x, y + 40);
      gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(.8, `rgba(${col},${a * .22})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x, y - 220, 40, 260); } }
  g.restore(); apply(1);
}
function snow(t, n = 70, k = 1, vx = -.5) { particles(t, n, { cols: ['255,255,255', '225,240,255'], r: 4 + 2 * k, vx, speed: 1.2 * k, a: .9 }); }
function drifts(t) {   // near snow mounds, their own parallax layer
  apply(1.4); g.save(); g.fillStyle = '#eef6ff'; g.strokeStyle = '#2a3a5a'; g.lineWidth = 7;
  for (const [x, y, r] of [[-60, 1960, 260], [260, 2010, 220], [880, 1980, 300], [1160, 1930, 220]]) { g.beginPath(); g.ellipse(x, y, r * 1.6, r, 0, Math.PI, 0); g.fill(); g.stroke(); }
  g.restore(); apply(1);
}
function frost(k, t) {   // ice creeping in from the frame edges
  if (k <= 0) return; screen(); g.save(); const gr = g.createRadialGradient(540, 960, 300, 540, 960, 1150); gr.addColorStop(0, 'rgba(200,235,255,0)'); gr.addColorStop(1, `rgba(200,235,255,${.75 * k})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = `rgba(255,255,255,${.8 * k})`; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const a = rnd(i, 1) * 6.28, x0 = 540 + Math.cos(a) * 1200, y0 = 960 + Math.sin(a) * 1300, L = 500 * k * (.5 + rnd(i, 2));
    const P = boltPts(x0, y0, x0 - Math.cos(a) * L, y0 - Math.sin(a) * L, i + 3, .3, 4); g.beginPath(); P.forEach((p, j) => j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
  g.restore(); apply(1);
}
function icicles(x, y, w, k) { if (k <= 0) return; g.save(); g.fillStyle = 'rgba(215,240,255,.95)'; g.strokeStyle = '#2a5a8a'; g.lineWidth = 4;
  for (let i = 0; i < 9; i++) { const px = x + w * i / 8, L = (40 + 60 * rnd(i, 4)) * k; g.beginPath(); g.moveTo(px - 16, y); g.lineTo(px + 16, y); g.lineTo(px + 2, y + L); g.closePath(); g.fill(); g.stroke(); } g.restore(); }
function watcher(cx, cy, s, t, ea = 1) {   // the hooded observer from Ep. 01 (never shown more than this)
  g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = '#000'; g.beginPath(); g.moveTo(-400, 900); g.quadraticCurveTo(-370, 240, -210, 0); g.quadraticCurveTo(0, -540, 210, 0); g.quadraticCurveTo(370, 240, 400, 900); g.fill();
  g.strokeStyle = 'rgba(170,60,255,.6)'; g.lineWidth = 6; g.stroke(); g.restore(); eyes(cx, cy - 240 * s, .7 * s, ea, t, '200,120,255');
}
function rainbowShine(t, a = .4) { apply(.35); g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const ph = (t * .5 + rnd(i, 1)) % 1; glowDot(lerp(220, 700, rnd(i, 2)), lerp(1900, 900, ph), 40, '255,255,255', a * Math.sin(ph * Math.PI)); } g.restore(); apply(1); }
function mapLines(cx, cy, k, t) {   // the map the two fragments draw: worlds as dots, threads of light between them
  const N = [[0, -320], [-280, -120], [260, -160], [-200, 220], [220, 240], [0, 40], [-60, 420], [120, -420]];
  g.save(); g.translate(cx, cy); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  const E = [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [1, 3], [2, 4], [0, 7], [3, 6], [4, 6]];
  E.forEach(([a, b], i) => { const u = clamp(k * E.length - i); if (u <= 0) return; const [ax, ay] = N[a], [bx, by] = N[b]; g.strokeStyle = 'rgba(200,160,255,.85)'; g.lineWidth = 5; g.beginPath(); g.moveTo(ax, ay); g.lineTo(lerp(ax, bx, u), lerp(ay, by, u)); g.stroke(); });
  N.forEach(([x, y], i) => glowDot(x, y, 46, i === 6 ? '255,60,90' : '220,190,255', clamp(k * 1.5) * (.7 + .3 * Math.sin(t * 4 + i))));
  g.restore();
}

// ---------------------------------------------------------------- impacts, HUD state
let T = {};
function impacts() {
  const I = (t, a, f = 0, c = '255,255,255') => IMP.push({ t, a, f, c });
  I(T.hammer, 40, .8, '220,235,255'); I(wt('s02', 'portal') + .2, 10, .5, '150,200,255');
  I(wt('s03', 'congelou'), 12, .6, '210,240,255');
  I(T.catch, 22, .5, '200,225,255'); I(wt('s06', 'Thor'), 18, .5, '200,225,255');
  I(wt('s07b', 'campeonato'), 12, 0);
  I(wt('s08', 'ergueu'), 22, .6, '200,225,255'); I(wt('s08', 'Tupã'), 8, .3, '200,160,255');
  I(wt('s09', 'símbolo'), 10, .4, '200,160,255');
  I(wt('s11', 'Heimdall'), 14, .6, '255,230,150');
  I(L0('s12b'), 8, 0);
  I(wt('s13', 'fugiu'), 14, .3, '120,30,160');
  I(wt('s15', 'ferida'), 18, .3, '255,60,120');
  I(T.ally, 46, 1);
  I(wt('s18', 'tocaram'), 20, .8, '220,190,255');
  I(wt('s19', 'alguém'), 22, .5, '170,60,255');
  I(wt('s21', 'A'), 10, .3, '140,200,255'); I(wt('s22', 'B'), 10, .3, '255,210,120');
  I(T.eyes, 30, .35, '170,60,255');
}
function hudState(t) {
  const step = (t0, a, b, d = .8) => lerp(a, b, eio(seg(t, t0, t0 + d)));
  const e1 = wt('s02', 'portal') + .2, b1 = wt('s15', 'ferida'), b2 = T.ally + .4;
  const en = step(e1, 65, 15, 1.2), bal = t < b2 ? step(b1, 10, 5) : step(b2, 5, 12, 1.2);
  const loc = t >= S0('arvore') + .3 ? 'ÁRVORE DOS MUNDOS' : t >= S0('ponte') + .3 ? 'PONTE DE ARCO-ÍRIS' : t >= S0('terra') + .3 ? 'TERRAS CONGELADAS' : 'DESCONHECIDO';
  const locT = [S0('terra') + .3, S0('ponte') + .3, S0('arvore') + .3].filter(x => t >= x).pop();
  return { en, bal, loc, locT: locT == null ? -9 : locT, pan: t >= wt('s06', 'Thor') + .3 ? '4/?' : '3/?', panT: wt('s06', 'Thor') + .3,
    frag: t >= T.frag2 ? '2/?' : '1/?', fragT: T.frag2, mis: t >= T.newMis ? 'ENCONTRAR O OBSERVADOR' : 'DESCOBRIR QUEM ABRIU OS PORTAIS', misT: T.newMis,
    alerts: [[e1, 'energy'], [b1, 'balance']] };
}
function hud(t) {
  screen(); const S = hudState(t), y0 = 236;
  g.save(); g.shadowColor = 'rgba(90,230,255,.6)'; g.shadowBlur = 18; g.fillStyle = 'rgba(8,10,30,.78)'; rr(40, y0, 1000, 214, 22); g.fill(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = '#5ee7ff'; g.stroke();
  g.font = '40px Anton'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('ENCONTRO DOS PANTEÕES', 66, y0 + 34); note('hudt', 'ENCONTRO DOS PANTEÕES', 66, y0 + 14, 450, y0 + 54);
  g.fillStyle = '#ffd65a'; rr(900, y0 + 14, 116, 40, 20); g.fill(); g.fillStyle = '#1a1030'; g.font = '30px Anton'; g.textAlign = 'center'; g.fillText('EP. 03', 958, y0 + 35); note('hudep', 'EP. 03', 915, y0 + 18, 1000, y0 + 52);
  const blink = (t0, d = 1.2) => t >= t0 && t - t0 < d && Math.sin(t * 16) > 0;
  g.textAlign = 'left'; g.font = '27px Anton'; g.fillStyle = '#ffd65a'; g.fillText('LOCAL:', 66, y0 + 78); const lw = g.measureText('LOCAL: ').width; g.fillStyle = blink(S.locT) ? '#7dffa0' : '#fff'; g.fillText(S.loc, 66 + lw, y0 + 78);
  note('loc' + S.loc.length, S.loc, 66 + lw, y0 + 64, 66 + lw + g.measureText(S.loc).width, y0 + 92);
  g.fillStyle = '#ffd65a'; g.fillText('PANTEÕES:', 760, y0 + 78); g.fillStyle = blink(S.panT, 1.4) ? '#7dffa0' : '#fff'; g.fillText(S.pan, 760 + g.measureText('PANTEÕES: ').width, y0 + 78); note('panl', 'PANTEÕES:', 760, y0 + 64, 900, y0 + 92);
  const al = k => { let a = null; for (const [tt, kk] of S.alerts) if (kk === k && t >= tt) a = tt; return a; };
  g.font = '25px Anton'; g.fillStyle = '#b9a8ff'; g.fillText('ENERGIA DO PORTAL', 66, y0 + 114); bar(66, y0 + 130, 360, S.en, 100, '#b06bff', t, al('energy'));
  g.fillStyle = S.en < 15 ? '#ff6b7a' : '#fff'; g.font = '30px Anton'; g.fillText(Math.round(S.en) + '%', 438, y0 + 141);
  g.font = '25px Anton'; g.fillStyle = '#9fe9ff'; g.fillText('EQUILÍBRIO ENTRE OS MUNDOS', 560, y0 + 114); bar(560, y0 + 130, 360, S.bal, 100, '#4fd8ff', t, al('balance'));
  g.fillStyle = t >= T.ally + .4 && t < T.ally + 2 ? '#7dffa0' : S.bal < 15 ? '#ff6b7a' : '#fff'; g.font = '30px Anton'; g.fillText(Math.round(S.bal) + '%', 932, y0 + 141);
  g.font = '27px Anton'; g.fillStyle = blink(S.misT, 2) ? '#ff6b7a' : '#ffd65a'; const mh = t >= S.misT ? 'NOVA MISSÃO:' : 'MISSÃO:'; g.fillText(mh, 66, y0 + 186); const mw = g.measureText(mh + ' ').width; g.fillStyle = '#fff';
  g.fillText(S.mis, 66 + mw, y0 + 186); note('mis' + S.mis.length, S.mis, 66 + mw, y0 + 170, 66 + mw + g.measureText(S.mis).width, y0 + 202);
  g.fillStyle = '#ffd65a'; g.textAlign = 'right'; g.fillText('FRAGMENTOS: ', 966, y0 + 186); g.fillStyle = blink(S.fragT, 1.4) ? '#7dffa0' : '#fff'; g.textAlign = 'left'; g.fillText(S.frag, 966, y0 + 186); note('fragl', 'FRAGMENTOS:', 800, y0 + 172, 960, y0 + 200);
  g.restore();
}

// ---------------------------------------------------------------- scenes
const SCENES = {};
const NOR = (t, dark = 0, o = {}) => bg('bg_nordic', o.depth || .35, { dark, darkc: o.darkc || '10,20,45', ...o });
const bzz = (t, c1, c2) => { screen(); sunburst(540, 900, t * .3, c1, c2); apply(1); };
SCENES.hook = (t, lt, sc) => {
  const th = T.hammer, tz = wt('s01', 'Zeus', 0, false) - .05;
  if (t < tz) { const z = t < th ? 1.0 + lt * .03 : 1.05 + .15 * eo(seg(t, th, th + .3)); cam(z, 540, 1000); NOR(t, .1); aurora(t, .5); snow(t);
    spr('zeus_0', 540, 1880, 1000 * breathe(t));
    if (t < th) { const p = ei(seg(t, th - .7, th)); if (p > 0) spr('thor_0', 520, lerp(-200, 1600, p), 300, { ay: .5, rot: 2.2 - p * .5 }); }
    else { spr('thor_0', 520, 1700, 320, { ay: .8, rot: 1.7 }); dust(t, th, 520, 1660, 30, '#eef6ff'); bolt(520, 1500, 300, 1400, t, '200,230,255', 4, { branches: false }); bolt(520, 1500, 760, 1380, t + 2, '200,230,255', 4, { branches: false }); }
    drifts(t); pill('vot', 'VOCÊS VOTARAM: A', t, sc.t0 + .1, th - .1, 1490, { px: 70, bg: '#9fdcff', fg: '#13306b' }); return; }
  cam(1.0 + .2 * eo(seg(t, tz, tz + .3)), 540, 960); bzz(t, '#1d3d8a', '#2850a8'); spr('zeusb_1', 540, 1960, 1250); snow(t, 30);
};
SCENES.recap = (t, lt, sc) => {
  const d = (sc.t1 - sc.t0) / 4, n = Math.min(3, Math.floor(lt / d)), k = (lt - n * d) / d;
  if (n === 0) { cam(1.05 + .05 * k, 540, 960); AMZ(t, .3, { s: 1.5 }); spr('tupa_3', 520, 1960, 1250); }
  else if (n === 1) { cam(1, 540, 960); screen(); g.fillStyle = 'rgba(20,10,40,1)'; g.fillRect(0, 0, W, H); apply(1); fragment(540, 980, 1.6, t); }
  else if (n === 2) { cam(1.05, lerp(420, 620, k), 1000); AMZ(t, .4); portal(960, 1100, 260, t, '120,190,255', '255,255,255');
    const bob = j => Math.abs(Math.sin(t * 6 + j)) * 12; spr('tupa_0', 140, 1800 - bob(2), 900, { flip: true }); spr('xango_2', 400, 1820 - bob(1), 940, { flip: true }); spr('zeus_3', 660, 1820 - bob(0), 900); }
  else { const u = k; cam(1 + .3 * u, 540, 960); screen(); g.fillStyle = '#081430'; g.fillRect(0, 0, W, H); apply(1); portal(540, 1000, 300 + 600 * ei(u), t * 2, '120,190,255', '255,255,255');
    ['zeus_3', 'xango_2', 'tupa_0'].forEach((k2, i) => { const p = clamp(u * 1.6 - i * .15); spr(k2, lerp([220, 540, 860][i], 540, p), lerp(1800, 1050, p), 700 * (1 - .85 * p), { a: 1 - p, rot: p * 2, flip: k2 !== 'zeus_3' }); });
    snow(t * 2, 40, 1.5, 0); }
  glitch(k < .15 ? .6 : .1, t);
  pill('ant', 'NO EPISÓDIO ANTERIOR', t, sc.t0 + .05, sc.t0 + 3.3, 530, { px: 40, bg: '#120c22', fg: '#ffd65a', line: '#ffd65a', r: 14 });
};
SCENES.frio = (t, lt, sc) => {
  const tc = wt('s03', 'congelou'), te = L1('s03') + .1, k = seg(t, sc.t0 + .3, tc);
  if (t < sc.t0 + 1.4) { cam(1.05, 540, 1000); NOR(t, .1); aurora(t, .5); snow(t, 120, 1.6, -1.4); spr('zeus_0', 300, 1880, 900, { sx: 1 + .015 * Math.sin(t * 40) }); spr('xango_0', 600, 1880, 940); spr('tupa_0', 870, 1880, 920); drifts(t); return; }
  cam(1.0 + .1 * k + (t > te ? .4 * eo(seg(t, te, te + .3)) : 0), 540, t > te ? 1080 : 960); bzz(t, '#1a4a6a', '#215a80');
  spr('zeusb_1', 540 + Math.sin(t * 50) * 4 * k, 1960, 1250); frost(k, t);
  if (t > tc - .1) { icicles(330, 1190, 420, eo(seg(t, tc - .1, tc + .4))); screen(); g.save(); g.globalAlpha = .45 * seg(t, tc - .1, tc + .3); g.fillStyle = '#cfefff'; g.beginPath(); g.ellipse(540, 1150, 270, 230, 0, 0, 7); g.fill(); g.restore(); apply(1); }
  snow(t, 50, 1.2, -1);
};
SCENES.terra = (t, lt, sc) => {
  const u = seg(t, sc.t0, sc.t1); cam(1.1 + .2 * u, lerp(380, 700, eio(u)), lerp(1000, 900, u));
  NOR(t, 0, { depth: .3 }); aurora(t, .7); fog(t, .25, '255,255,255', 900); snow(t, 60, 1, -.4); drifts(t);
  pill('reino', 'NOVO REINO DESCOBERTO', t, sc.t0 + .3, sc.t1 + .3, 530, { px: 42, bg: '#0f2a4a', fg: '#9fdcff', line: '#9fdcff', r: 14 });
};
SCENES.martelo = (t, lt, sc) => {
  const tl = wt('s05', 'levantou') - .1, tv = wt('s05', 'voltou') - .05, tc = T.catch;
  if (t < tv) { cam(1.4, 520, 1450); NOR(t, .15); snow(t); const sh = seg(t, tl, tv); spr('thor_0', 520 + Math.sin(t * 60) * 6 * sh, 1700 - 120 * eo(sh), 320, { ay: .8, rot: 1.7 - 1.7 * eo(sh), glow: sh > .3 ? 'rgba(190,225,255,.9)' : null, gb: 30 }); return; }
  const u = seg(t, tv, tc); cam(1.0, lerp(520, 820, eio(u)), lerp(1500, 900, eio(u)));
  NOR(t, .2); aurora(t, .5); snow(t, 60, 1.4, -1);
  if (t < tc) { spr('thor_0', lerp(520, 990, eio(u)), lerp(1550, 760, eio(u)), 300, { ay: .5, rot: -t * 14 }); }
  const r = spr('thor_1', 1180, 1600, 1150, { tint: t < tc ? '#0b1424' : null, a: 1 }); if (t >= tc) { const h = at(r, .05, .05); spr('thor_0', h[0] + 30, h[1] - 10, 300, { ay: .5, rot: -.3 }); glowDot(h[0], h[1], 200 * (1 - seg(t, tc, tc + .5)), '200,230,255', .9); }
};
SCENES.thor = (t, lt, sc) => {
  const tt = wt('s06', 'Thor') - .05, tf = wt('s06', 'feliz') - .1; let z, cy;
  if (t >= tf) { cam(1.03 + .05 * seg(t, tf, sc.t1), 540, 960); bzz(t, '#203048', '#2a3c5a'); spr('thor_4', 560, 1960, 1250); snow(t, 30); unlock('uth', 'THOR', t, tt, sc.t1 + .2, '#3a5a8a', { full: true }); return; }
  const u = eio(seg(t, sc.t0 + .2, tt + 1.4)); z = 1.9; cy = lerp(1700, 640, u); cam(z, 540, cy);
  const sb = seg(t, tt - .2, tt + .3); NOR(t, .4); if (sb > 0) { g.save(); g.globalAlpha = sb; screen(); sunburst(540, 760, t, '#1c2a44', '#26385a'); g.restore(); apply(1); }
  const r = spr('thor_1', 560, 1900, 1500 * breathe(t, 2)); const h = at(r, .05, .05); spr('thor_0', h[0] + 30, h[1] - 10, 380, { ay: .5, rot: -.3 });
  for (let i = 0; i < 3; i++) { const k = Math.floor(t * 7) + i * 13; bolt(h[0], h[1], h[0] + (rnd(k, 3) - .5) * 300, h[1] + (rnd(k, 4) - .5) * 300, t + i, '200,230,255', 5, { branches: false }); }
  snow(t, 40);
  unlock('uth', 'THOR', t, tt, sc.t1 + .2, '#3a5a8a', { full: true });
};
SCENES.quatro = (t, lt, sc) => {
  const tb = L0('s07b') - .1, tc = wt('s07b', 'Isso') - .05, te = L1('s07b') + .1;
  if (t < tb) { cam(1.05 + lt * .03, 540, 1000); NOR(t, .2); aurora(t, .4); snow(t); spr('zeus_0', 540, 1900, 1300 * breathe(t)); drifts(t); return; }
  if (t < tc) { const P = [['zeusb_0', '#1d3d8a'], ['xangob_0', '#7a1420'], ['tupa_3', '#0f3f26'], ['thor_4', '#203048']], i = Math.min(3, Math.floor((t - tb) / ((tc - tb) / 4)));
    cam(1.05, 540, 960); bzz(t, P[i][1], P[i][1]); spr(P[i][0], 540, 1960, 1250); screen(); g.save(); g.translate(880, 640); const s = back(clamp(((t - tb) % ((tc - tb) / 4)) / .2)); g.scale(s, s); stroked(String(i + 1), 0, 0, '170px Anton', '#ffd65a', { lw: 20 }); g.restore(); return; }
  if (t < te) { cam(1.05, 540, 960); bzz(t, '#1d3d8a', '#2850a8'); spr('zeusb_0', 540, 1960, 1250); }
  else { const u = eo(seg(t, te, te + .25)); cam(1 + 1.0 * u, 560, 1120); bzz(t, '#203048', '#2a3c5a'); spr('thor_4', 560, 1960, 1250); }
  pill('camp', 'CAMPEONATO DE TROVÕES', t, tb, sc.t1 + .1, 530, { px: 46, bg: '#ffd65a', rot: -2 });
};
SCENES.duelo = (t, lt, sc) => {
  const tu = wt('s08', 'Tupã') - .1, tm = wt('s08', 'mostrou');
  if (t < tu) { cam(1.0 + lt * .05, 540, 1000); NOR(t, .5); stormSky(t, .8); snow(t, 60, 1.4, -1); const r = spr('thor_2', 560, 1880, 1350 * breathe(t, 2)); const h = at(r, .6, .04);
    for (let i = 0; i < 4; i++) { const k = Math.floor(t * 8) + i * 11; bolt(h[0], h[1], h[0] + (rnd(k, 3) - .5) * 500, h[1] - 100 + (rnd(k, 4) - .5) * 400, t + i, '200,230,255', 6, { branches: false }); } return; }
  cam(1.05, 540, 1000); NOR(t, .55); stormSky(t, .8); snow(t, 40, .8, -.3);
  const r = spr('tupa_2', 520, 1900, 1300, { flip: true, sway: [t, 4] }); const h = at(r, .15, .03); fragment(h[0], h[1] - 40, .55, t);
  if (t > tm) glowDot(h[0], h[1], 340, '200,160,255', .5 + .2 * Math.sin(t * 8));
};
SCENES.simbolo = (t, lt, sc) => {
  const tp = wt('s09', 'gravado') - .1;
  if (t < tp) { cam(1.05 + lt * .05, 540, 960); bzz(t, '#203048', '#2a3c5a'); spr('thor_3', 560, 1960, 1250); screen(); glyph(860, 700, .9, t); glowDot(860, 700, 180, '200,160,255', .4); return; }
  const u = seg(t, tp, sc.t1); cam(lerp(2.4, 1.6, eio(u)), 230, 1610); bg('bg_bifrost', .35); aurora(t, .4); snow(t, 30, .8, -.3);
  apply(1); glyph(215, 1640, .65, t, seg(t, tp + .2, tp + .6));
};
SCENES.ponte = (t, lt, sc) => {
  const u = seg(t, sc.t0, sc.t1); cam(1.05 + .25 * u, 540, lerp(1150, 1000, u)); bg('bg_bifrost', .35); aurora(t, .5); rainbowShine(t);
  const run = (k2, x0, i, fl) => { const p = seg(t, sc.t0 + .2 + i * .15, sc.t1); spr(k2, lerp(x0, 540, p * .6), lerp(1980, 1500, p) - Math.abs(Math.sin(t * 9 + i)) * 16, 720 * (1 - .45 * p), { flip: fl }); };
  run('thor_1', 820, 0, false); run('tupa_0', 330, 1, true); run('xango_2', 690, 2, true); run('zeus_3', 430, 3, false);
  snow(t, 30, .8, -.3);
};
SCENES.heim = (t, lt, sc) => {
  const th = wt('s11', 'Heimdall') - .1, ap = eo(seg(t, th - .3, th + .5)), u = seg(t, sc.t0, sc.t1);
  cam(1.0 + .15 * u, 540, 980); bg('bg_bifrost', .35, { dark: .25 }); aurora(t, .6); rainbowShine(t, .6);
  if (ap > 0) { screen(); g.save(); g.globalAlpha = ap; rays(540, 800, 16, t, '255,230,150', .12, 1600, .08); g.restore(); apply(1); glowDot(540, 900, 600, '255,220,130', .45 * ap);
    const r = spr('heimdall_0', 540, 1820, 1300 * breathe(t, 3), { a: ap, glow: 'rgba(255,220,130,.9)', gb: 40 }); const e = at(r, .5, .08); glowDot(e[0] - 14, e[1], 40, '255,220,100', ap); glowDot(e[0] + 14, e[1], 40, '255,220,100', ap); }
  snow(t, 30, .8, -.3);
  unlock('uhe', 'HEIMDALL', t, th, sc.t1 + .2, '#b88a1a', {});
};
SCENES.aviso = (t, lt, sc) => {
  const tb = L0('s12b') - .1, u = seg(t, tb, sc.t1);
  cam(t < tb ? 1.03 + lt * .03 : 1.05 + 1.1 * eio(u), 540, t < tb ? 960 : lerp(960, 1080, eio(u))); bzz(t, '#3a2a10', '#4a3614');
  const r = spr('heimdall_1', 540, 1960, 1250); const e1 = at(r, .43, .42), e2 = at(r, .57, .42);
  if (t > tb) { glowDot(e1[0], e1[1], 70, '255,220,100', .9 * u); glowDot(e2[0], e2[1], 70, '255,220,100', .9 * u); vignette(.7 * u, '0,0,0'); }
};
SCENES.sombra = (t, lt, sc) => {
  const tf = wt('s13', 'fugiu') - .1, rise = seg(t, sc.t0 + .3, tf), fl = seg(t, tf, sc.t1);
  if (t < tf) { cam(1.05 + .1 * rise, 540, 1050); NOR(t, .45); snow(t, 60, 1.2, -.6);
    spr('zeus_0', 150, 1960, 800); spr('xango_0', 380, 1990, 820); spr('thor_1', 640, 1980, 820, { flip: true }); spr('tupa_0', 920, 1970, 820);
    shadowMass(540, lerp(1700, 1250, rise), 1.1 * rise + .1, t, rise); eyes(540, lerp(1700, 1220, rise), .5, seg(t, tf - .8, tf - .4), t, '255,40,40'); drifts(t); return; }
  cam(1.0, lerp(540, 600, fl), lerp(1300, 900, fl)); bg('bg_bifrost', .35, { dark: .3 }); aurora(t, .5);
  const sx = lerp(420, 640, fl), sy = lerp(1700, 700, eio(fl)); for (let i = 0; i < 6; i++) shadowMass(lerp(sx, 420, i * .12), lerp(sy, 1800, i * .12), .55 * (1 - i * .12), t, .8 - i * .1);
  eyes(sx, sy - 20, .35, 1, t, '255,40,40');
};
SCENES.arvore = (t, lt, sc) => {
  const u = seg(t, sc.t0, sc.t1); cam(1.15 - .1 * u, 540, lerp(700, 1250, eio(u))); bg('bg_tree', .9, { s: 1.4 });
  particles(t, 40, { cols: ['255,230,160', '200,180,255'], r: 4, add: true, up: true, speed: .5 });
  const p = eio(seg(t, sc.t0 + .3, sc.t1)); apply(1); shadowMass(lerp(700, 560, p), lerp(400, 1900, p), .5, t, .9); eyes(lerp(700, 560, p), lerp(400, 1900, p) - 10, .3, 1, t, '255,40,40');
  pill('arv', 'NOVO LOCAL DESCOBERTO', t, sc.t0 + .3, sc.t1 + .3, 530, { px: 42, bg: '#2a1a4a', fg: '#e0c8ff', line: '#b48cff', r: 14 });
};
SCENES.raizes = (t, lt, sc) => {
  const te = wt('s15', 'escurecendo') - .1, tf = wt('s15', 'ferida') - .1, u = seg(t, sc.t0, sc.t1);
  cam(1.6 + .3 * u, 540, 1550); bg('bg_tree', .9, { s: 1.15, dark: .25 + .3 * seg(t, te, tf), darkc: '20,5,30' });
  apply(1); const k = seg(t, te, tf + .8); g.save(); g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const x0 = 200 + i * 90, P = boltPts(x0, 1300, x0 + (rnd(i, 1) - .5) * 300, 1300 + 600 * k, i + 40, .25, 5);
    g.beginPath(); P.forEach((p, j) => j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = 'rgba(15,0,25,.9)'; g.lineWidth = 26; g.stroke(); g.strokeStyle = `rgba(255,40,180,${.5 * k})`; g.lineWidth = 5; g.stroke(); }
  g.restore();
  if (t > tf) for (let i = 0; i < 4; i++) rift(300 + i * 160, 1500 + (i % 2) * 160, 180, seg(t, tf + i * .2, tf + i * .2 + .5), t, { open: 16 });
};
SCENES.raios = (t, lt, sc) => {
  const ta = T.ally; cam(1.1 + .08 * Math.sin(lt * .8), 540 + Math.sin(lt * 1.1) * 50, 1000, Math.sin(lt * 1.1) * .02);
  bg('bg_tree', .35, { s: 1.15, dark: .55 - .35 * seg(t, ta, ta + 1), darkc: '20,5,30' }); shadowMass(540, 1650 + 400 * seg(t, ta, ta + 1.2), 1.4, t, 1 - seg(t, ta, ta + 1.2));
  const A = spr('thor_2', 170, 1250, 820), Z = spr('zeus_2', 400, 1260, 780), X = spr('xango_1', 650, 1260, 820), P = spr('tupa_2', 900, 1260, 800, { flip: true });
  const M = [540, 1600], p = eo(seg(t, wt('s16', 'lançaram') - .1, ta));
  for (const [[hx, hy], c] of [[at(A, .6, .04), '200,230,255'], [at(Z, .3, .05), '140,200,255'], [at(X, .45, .06), '255,120,80'], [at(P, .15, .03), '255,230,140']]) if (p > 0) bolt(hx, hy, lerp(hx, M[0], p), lerp(hy, M[1], p), t + hx, c, 11);
  if (t > ta) glowDot(M[0], M[1], 380 * (1 - seg(t, ta, ta + 1.2)) + 60, '255,255,255', .9);
  particles(t, 40, { cols: ['200,230,255', '255,120,80', '255,230,140'], r: 6, add: true, speed: 2 });
};
SCENES.frag2 = (t, lt, sc) => {
  const tr = wt('s17', 'recuou'), tf = T.frag2 - .2, u = seg(t, sc.t0, sc.t1);
  cam(1.0 + .3 * seg(t, tf, sc.t1), 540, lerp(1100, 1000, u)); bg('bg_tree', .35, { s: 1.15, dark: .4 }); shadowMass(540, lerp(1500, 2400, seg(t, sc.t0, tr + 1)), 1.0, t, 1 - seg(t, sc.t0, tr + 1));
  apply(1); const fy = lerp(1700, 1100, eo(seg(t, tf, tf + 1))); if (t > tf - .3) fragment(540, fy, .9 * eo(seg(t, tf - .3, tf + .5)), t + 2);
  particles(t, 30, { cols: ['200,160,255'], r: 5, add: true, up: true, speed: 1 });
};
SCENES.mapa = (t, lt, sc) => {
  const tt = wt('s18', 'tocaram') - .05, u = seg(t, sc.t0, tt);
  cam(1.0, 540, 960); screen(); g.fillStyle = '#0c0718'; g.fillRect(0, 0, W, H); apply(1); particles(t, 50, { cols: ['200,180,255'], r: 3, add: true, speed: .3 });
  if (t < tt) { fragment(lerp(250, 470, eio(u)), 980, .8, t); fragment(lerp(830, 610, eio(u)), 980, .8, t + 2); return; }
  const k = seg(t, tt, sc.t1); fragment(540, 980, .8 + .2 * eo(k), t); mapLines(540, 980, k, t);
};
SCENES.obs = (t, lt, sc) => {
  const ta = wt('s19', 'alguém') - .1, tp = wt('s19', 'primeiro'), u = seg(t, sc.t0, sc.t1);
  if (t < ta) { cam(1.0 + .5 * eio(seg(t, sc.t0, ta)), 540, lerp(980, 1400, eio(seg(t, sc.t0, ta)))); screen(); g.fillStyle = '#0c0718'; g.fillRect(0, 0, W, H); apply(1); mapLines(540, 980, 1, t); return; }
  cam(1.0 + .25 * seg(t, ta, sc.t1), 540, 1000); screen(); g.fillStyle = '#07040f'; g.fillRect(0, 0, W, H); apply(1);
  g.save(); g.beginPath(); g.ellipse(540, 1100, 300, 380, 0, 0, 7); g.clip(); g.translate(540, 1100); g.scale(.4, .4); g.translate(-540, -960); bg('bg_tree', 0, { dark: .3 }); g.restore();
  g.save(); g.lineWidth = 14; g.strokeStyle = 'rgba(170,60,255,.9)'; g.shadowColor = '#a03cff'; g.shadowBlur = 40; g.beginPath(); g.ellipse(540, 1100, 300, 380, 0, 0, 7); g.stroke(); g.restore();
  watcher(540, 1060, 1, t, seg(t, ta + .2, ta + .6)); fog(t, .5, '60,20,90', 1200); glitch(t > tp ? .6 * Math.abs(Math.sin(t * 9)) : .15, t); vignette(.8, '0,0,0');
  pill('obsv', 'O OBSERVADOR', t, ta + .1, sc.t1 + .2, 1490, { px: 64, bg: '#1a0a2a', fg: '#d9b8ff', line: '#a03cff', r: 16 });
};
SCENES.part = (t, lt, sc) => {
  const tm = wt('s20', 'mil') - .1, te = sc.t1 - .2;
  cam(1, 540, 960); screen(); sunburst(540, 960, t * .4, '#120c26', '#1a1236'); apply(1);
  g.save(); g.translate(540, 620); g.scale(.45, .45); mapLines(0, 0, 1, t); g.restore(); fragment(500, 620, .3, t); fragment(580, 620, .3, t + 2);
  const likes = Math.round(3000 * eio(seg(t, tm, te)) / 10) * 10;
  screen(); g.save(); g.translate(250, 830); const hb = 1 + .08 * Math.max(0, Math.sin(t * 9)); g.scale(hb, hb); g.fillStyle = '#ff3b6b'; g.strokeStyle = '#0d0a18'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-90, -20, -60, -90, 0, -45); g.bezierCurveTo(60, -90, 90, -20, 0, 40); g.fill(); g.stroke(); g.restore();
  stroked(likes.toLocaleString('pt-BR'), 560, 832, '110px Anton', '#fff', { lw: 16 }); stroked('CURTIDAS', 860, 845, '44px Anton', '#ffd65a', { lw: 10, align: 'left' }); note('curt', 'CURTIDAS', 860, 822, 1040, 868);
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(90, 910, 900, 50, 25); g.fill(); g.fillStyle = '#ffd65a'; rr(90, 910, Math.max(50, 900 * likes / 3000), 50, 25); g.fill(); g.lineWidth = 6; g.strokeStyle = '#0d0a18'; rr(90, 910, 900, 50, 25); g.stroke();
  for (let i = 1; i <= 3; i++) { g.fillStyle = '#0d0a18'; g.fillRect(90 + 300 * i - 3, 900, 6, 70); }
  for (let i = 0; i < 3; i++) { const y = 1030 + i * 105, th = (i + 1) * 1000, open = likes >= th, s = back(seg(t, sc.t0 + .3 + i * .2, sc.t0 + .7 + i * .2));
    if (s <= 0) continue; g.save(); g.translate(540, y); g.scale(s, s); g.fillStyle = open ? '#2b5a3a' : '#2a2346'; rr(-430, -44, 860, 88, 22); g.fill(); g.lineWidth = 6; g.strokeStyle = open ? '#7dffa0' : '#ffd65a'; g.stroke();
    const tx = `MAPA 0${i + 1}`; stroked(tx, -370, 0, '52px Anton', '#fff', { lw: 10, align: 'left' }); stroked(`${th.toLocaleString('pt-BR')} CURTIDAS`, 380, 0, '42px Anton', '#ffd65a', { lw: 8, align: 'right' });
    g.save(); g.translate(-40, 0); g.fillStyle = open ? '#7dffa0' : '#ffd65a'; g.strokeStyle = '#0d0a18'; g.lineWidth = 5; rr(-26, -10, 52, 42, 8); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -10, 18, Math.PI, open ? Math.PI * 1.55 : 0); g.lineWidth = 9; g.strokeStyle = open ? '#7dffa0' : '#ffd65a'; g.stroke(); g.restore(); g.restore();
    note('p' + i, tx, 170, y - 26, 330, y + 26); note('pc' + i, `${th.toLocaleString('pt-BR')} CURTIDAS`, 600, y - 21, 920, y + 21); }
  pill('sob', 'PEDAÇOS DO MAPA', t, sc.t0 + .6, sc.t1, 1490, { px: 44, bg: '#2a1a4a', fg: '#e0c8ff', line: '#b48cff', r: 14 });
  particles(t * 1.2, 30, { cols: ['255,215,90'], r: 6, add: true, up: true, speed: 1 });
};
SCENES.opA = (t, lt, sc) => {
  const ta = sc.t0 + .05, tz = wt('s21', 'raízes') - .1;
  if (t < tz) { cam(1, 540, 960); bzz(t, '#13306b', '#1b3f86'); pill('la', 'A', t, ta, tz, 900, { px: 360, bg: '#9fdcff', fg: '#13306b', r: 60, glow: 'rgba(120,190,255,.9)' }); pill('oa', 'OPÇÃO', t, ta - .2, tz, 560, { px: 70, bg: '#fff' }); return; }
  const u = seg(t, tz, sc.t1); cam(1.2 + .3 * u, 540, lerp(1300, 1700, u)); bg('bg_tree', .9, { s: 1.15, dark: .5, darkc: '10,5,25' });
  apply(1); shadowMass(540, 2000, 1.2, t, .9); eyes(540, 1950, .4, .7 + .3 * Math.sin(t * 2), t, '255,40,40');
  spr('thor_1', 330, 1480, 360, { flip: true }); spr('zeus_0', 470, 1480, 340); spr('xango_0', 600, 1480, 350); spr('tupa_0', 740, 1480, 350);
  pill('a2', 'A', t, tz, sc.t1, 530, { px: 100, bg: '#9fdcff', fg: '#13306b', r: 30, x: 140 });
  pill('a3', 'SEGUIR A CRIATURA', t, tz, sc.t1, 1490, { px: 50, bg: '#13306b', fg: '#9fdcff', line: '#9fdcff', r: 18 });
};
SCENES.opB = (t, lt, sc) => {
  const tb = sc.t0 + .05, te = wt('s22', 'levar') + .7;
  if (t < te) { cam(1, 540, 960); bzz(t, '#6b4a0e', '#86601b'); pill('lb', 'B', t, tb, te, 900, { px: 360, bg: '#ffd65a', fg: '#5a3a06', r: 60, glow: 'rgba(255,200,90,.9)' }); pill('ob', 'OPÇÃO', t, tb - .2, te, 560, { px: 70, bg: '#fff' }); return; }
  const u = seg(t, te, sc.t1); cam(1.05 + .15 * u, 540, 1000); bg('bg_egypt', .35); particles(t, 60, { cols: ['#e6b872', '#c9944a'], r: 4, leaf: true, vx: 1.8, speed: 1.6 });
  apply(1); g.save(); g.globalAlpha = .35; watcher(800, 560, .45, t, .8); g.restore();
  const r = spr('gods_1', 520, 1640, 1200, { tint: '#1a1206' }); g.save(); g.globalAlpha = .45; spr('gods_1', 520, 1640, 1200); g.restore();
  const s = at(r, .07, .25); glyph(s[0], s[1] - 10, .35, t); glowDot(s[0], s[1], 110, '190,140,255', .6); const e = at(r, .46, .12); eyes(e[0], e[1], .14, 1, t, '255,215,90');
  pill('b2', 'B', t, te, sc.t1, 530, { px: 100, bg: '#ffd65a', fg: '#5a3a06', r: 30, x: 140 });
  pill('b3', 'LEVAR OS FRAGMENTOS A ANÚBIS', t, te, sc.t1, 1490, { px: 46, bg: '#5a3a06', fg: '#ffd65a', line: '#ffd65a', r: 18 });
};
SCENES.cta = (t, lt, sc) => {
  const tp = L0('s23b') - .1, cut = sc.t1 - .55;
  if (t >= cut) { screen(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return 'black'; }
  if (t < tp) { const pa = 1 + .04 * Math.max(0, Math.sin(t * 6)), pb = 1 + .04 * Math.max(0, Math.sin(t * 6 + Math.PI));
    clip(442, 960, () => { cam(1, 540, 960); bg('bg_tree', 0, { s: 1.0, dy: -200, dark: .45, darkc: '10,5,25' }); screen(); g.save(); g.translate(360, 720); g.scale(pa, pa); stroked('A', 0, 0, '260px Anton', '#9fdcff', { lw: 22 }); g.restore(); eyes(800, 820, .3, 1, t, '255,40,40'); });
    clip(960, H, () => { screen(); bg('bg_egypt', 0, { s: 1.0, dy: 300 }); screen(); spr('gods_1', 800, 1560, 520, { tint: '#1a1206' }); g.save(); g.translate(360, 1240); g.scale(pb, pb); stroked('B', 0, 0, '260px Anton', '#ffd65a', { lw: 22 }); g.restore(); });
    splitLine(960, '#fff'); screen(); stroked('OU', 540, 960, '70px Anton', '#fff', { lw: 14 }); }
  else { const u = seg(t, tp, cut); cam(1.0 + .3 * eio(u), 540, 1000); screen(); g.fillStyle = '#05030a'; g.fillRect(0, 0, W, H); apply(1); fog(t, .6, '60,20,90', 1000);
    watcher(540, 1150, 1.25, t, seg(t, T.eyes, T.eyes + .2)); vignette(.85, '0,0,0'); glitch(t > T.eyes ? .5 * Math.abs(Math.sin(t * 7)) : .1, t); }
  pill('vd', 'VOCÊ DECIDE O PRÓXIMO CAMINHO', t, sc.t0 + .15, cut, 530, { px: 46, bg: '#ffd65a', r: 16 });
  pill('ce', 'COMENTE A OU B', t, wt('s23a', 'Comente') - .1, cut, 1560, { px: 60, bg: '#fff', rot: -2 });
  const k = clamp((t - wt('s23a', 'Comente') - .3) / .25); if (k > 0) { screen(); g.save(); g.globalAlpha = k; const b = Math.sin(t * 7) * 8; stroked('comenta aqui embaixo ↓', 540, 1680 + b, '600 52px Fredoka', '#fff', { lw: 10 }); g.restore(); if (k >= 1) note('comenta', 'comenta aqui embaixo', 300, 1650, 780, 1710); }
};

// ---------------------------------------------------------------- frame
const ORDER = ['hook', 'recap', 'frio', 'terra', 'martelo', 'thor', 'quatro', 'duelo', 'simbolo', 'ponte', 'heim', 'aviso', 'sombra', 'arvore', 'raizes', 'raios', 'frag2', 'mapa', 'obs', 'part', 'opA', 'opB', 'cta'];
function render(t) {
  t = clamp(t, 0, DUR - 1e-4); TX = []; screen(); g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  SH = shake(t); const id = ORDER.find(k => t >= S0(k) && t < S1(k)) || 'cta', sc = TL.scenes[id];
  const r = SCENES[id](t, t - sc.t0, sc); screen(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (r === 'black') return;
  flash(t); vignette(.4); hud(t); brand(); caption(t);
  if (t > S0('raizes') && t < S0('frag2')) pill('fer', 'A ÁRVORE ESTÁ FERIDA', t, wt('s15', 'ferida') - .1, S0('raios') + 2.3, 1490, { px: 46, bg: '#ff2e4a', fg: '#fff', r: 14 });
  if (t > S0('raios') && t < S0('frag2') + 1.3) pill('quat', 'ATAQUE COMBINADO: 4 TROVÕES', t, wt('s16', 'lançaram') - .1, S0('frag2') + 1.2, 1490, { px: 44, bg: '#ffd65a', r: 14 });
  if (t > S0('frag2') && t < S0('obs')) pill('it2', 'ITEM ENCONTRADO: FRAGMENTO 2', t, T.frag2 - .2, S0('mapa') + 1.4, 1490, { px: 44, bg: '#2a1a4a', fg: '#e0c8ff', line: '#b48cff', r: 14 });
  if (t > S0('obs') && t < S0('opA')) pill('nmis', 'NOVA MISSÃO', t, T.newMis, S0('part') + 2.6, 530, { px: 46, bg: '#ff2e4a', fg: '#fff', r: 14 });
}
function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o }), w = wt;
  for (const id in TL.lines) E(L0(id), 'vo', { id });
  for (const e of IMP) if (e.a >= 30) E(e.t, 'thunder'); else if (e.a >= 14 || e.f >= .4) E(e.t, 'impact', { v: Math.min(1, (e.a + 30 * e.f) / 40) });
  E(0, 'icewind', { d: S1('hook') }); E(S0('hook') + .1, 'mission'); E(T.hammer - .7, 'fall', { d: .7 }); E(w('s01', 'Zeus') - .05, 'cut');
  E(S0('recap'), 'whoosh'); for (let i = 1; i < 4; i++) E(S0('recap') + i * (S1('recap') - S0('recap')) / 4, 'cut'); E(w('s02', 'portal'), 'portal', { d: 1.8 }); E(w('s02', 'portal') + .2, 'teleport'); E(w('s02', 'portal') + .2, 'drain');
  E(S0('frio'), 'icewind', { d: 1.5 }); E(S0('frio') + .1, 'chatter', { d: 1.2 }); E(w('s03', 'congelou') - .1, 'freezeup'); E(L1('s03') + .1, 'boing'); E(L1('s03') + .1, 'musicstop');
  E(S0('terra'), 'icewind', { d: S1('terra') - S0('terra') }); E(S0('terra') + .3, 'notify');
  E(w('s05', 'levantou') - .1, 'rattle', { d: w('s05', 'voltou') - w('s05', 'levantou') }); E(w('s05', 'voltou') - .05, 'spin', { d: T.catch - w('s05', 'voltou') }); E(T.catch, 'clank');
  E(w('s06', 'Thor') - .05, 'unlock'); E(w('s06', 'Thor') + .3, 'levelup'); E(S0('thor') + .3, 'zap', { d: 3 });
  E(L0('s07b') - .1, 'cut'); for (let i = 1; i < 4; i++) E(L0('s07b') - .1 + i * (w('s07b', 'Isso') - L0('s07b')) / 4, 'cut'); E(w('s07b', 'Isso') - .05, 'buzzer'); E(L1('s07b') + .1, 'boing'); E(L1('s07b') + .1, 'musicstop');
  E(w('s08', 'ergueu') - .1, 'zap', { d: 1.5 }); E(w('s08', 'Tupã') - .1, 'silence'); E(w('s08', 'mostrou'), 'shimmer');
  E(w('s09', 'símbolo') - .1, 'rare'); E(w('s09', 'gravado') - .1, 'whoosh');
  E(S0('ponte'), 'steps', { d: S1('ponte') - S0('ponte') }); E(S0('ponte'), 'rainbow');
  E(w('s11', 'Heimdall') - .3, 'shimmer'); E(w('s11', 'Heimdall'), 'unlock');
  E(L0('s12b') - .6, 'silence'); E(L0('s12b'), 'heart', { d: S1('aviso') - L0('s12b') });
  E(S0('sombra') + .3, 'growl', { d: 1.8 }); E(w('s13', 'fugiu') - .1, 'whoosh'); E(w('s13', 'fugiu'), 'alarm', { n: 2 });
  E(S0('arvore') + .3, 'notify'); E(S0('arvore'), 'riser', { d: S1('arvore') - S0('arvore') });
  E(w('s15', 'escurecendo') - .1, 'darkgrow', { d: S1('raizes') - w('s15', 'escurecendo') }); E(w('s15', 'ferida'), 'alarm', { n: 3 }); E(w('s15', 'ferida') + .1, 'glass');
  E(w('s16', 'lançaram') - .2, 'riser', { d: T.ally - w('s16', 'lançaram') + .2 }); E(w('s16', 'lançaram') - .1, 'zap', { d: T.ally - w('s16', 'lançaram') + .1 }); E(T.ally + .05, 'levelup');
  E(T.frag2 - .2, 'rare');
  E(S0('mapa'), 'hum', { d: w('s18', 'tocaram') - S0('mapa') }); E(w('s18', 'tocaram') - .05, 'touch'); E(w('s18', 'tocaram') + .2, 'shimmer');
  E(w('s19', 'alguém') - .1, 'reveal'); E(w('s19', 'alguém'), 'whispers', { d: 2.5 }); E(T.newMis, 'mission');
  { const tm = w('s20', 'mil') - .1, te = S1('part') - .2; for (let i = 0; i < 3; i++) { const u = Math.acos(1 - 2 * ((i + 1) / 3)) / Math.PI; E(tm + (te - tm) * u, 'levelup'); } for (let k = 0; k < 14; k++) E(tm + (te - tm) * k / 14, 'coin'); E(S0('part') + .3, 'notify'); for (let i = 0; i < 3; i++) E(S0('part') + .3 + i * .2, 'pop'); }
  E(S0('opA') + .05, 'mission'); E(w('s21', 'raízes'), 'heart', { d: S1('opA') - w('s21', 'raízes') }); E(w('s21', 'criatura'), 'growl', { d: 1.2 });
  E(S0('opB') + .05, 'mission'); E(w('s22', 'levar') + .7, 'sand', { d: S1('opB') - w('s22', 'levar') - .7 });
  E(S0('cta') + .15, 'pop'); E(w('s23a', 'Comente') - .1, 'pop'); E(L0('s23b') - .1, 'heart', { d: S1('cta') - .55 - L0('s23b'), fast: 1 }); E(L0('s23b') - .1, 'whispers', { d: S1('cta') - .6 - L0('s23b') }); E(T.eyes, 'reveal'); E(S1('cta') - .55, 'cutblack');
  return ev.sort((a, b) => a.t - b.t);
}
(async () => {
  TL = await (await fetch('timeline.json')).json(); DUR = TL.dur;
  const idx = await (await fetch('parts/index.json')).json(); const keys = Object.keys(idx).concat(['bg_amazon', 'bg_nordic', 'bg_egypt', 'bg_bifrost', 'bg_tree']);
  await Promise.all(keys.map(k => new Promise(res => { const im = new Image(); im.onload = res; im.onerror = res; im.src = k.startsWith('bg_') ? `src/${k}.png` : `parts/${k}.png`; IM[k] = im; })));
  await Promise.all(['84px Anton', '600 46px Fredoka', '600 52px Fredoka'].map(f => document.fonts.load(f, 'AÃÉÍÓÇÔáãéíóçô0123456789?↓:')));
  const av = new Image(); av.src = 'brand/avatar.jpg'; await av.decode().catch(() => {}); AV = av.naturalWidth ? av : null;
  T = { hammer: wt('s01', 'martelo') + .35, catch: wt('s05', 'dono') + .1, ally: wt('s16', 'escuridão') + .15, frag2: wt('s17', 'fragmento') - .1, newMis: L1('s19') - .3, eyes: wt('s23c', 'assistindo') - .1 };
  impacts(); NOCAP = [];
  window.DUR = DUR; window.render = render; window.EV = events();
  window.TEXTS = t => { render(t); return TX.map(o => ({ ...o })); };
  render(Q.get('t') ? +Q.get('t') : 1); window.READY = true;
})();
