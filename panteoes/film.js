// O Encontro dos Panteões — Ep. 01. 2D cartoon on one canvas: generated character art (parts/), painted backgrounds (src/bg_*),
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
function impacts() {
  const I = (t, a, f = 0, c = '255,255,255') => IMP.push({ t, a, f, c });
  I(.3, 34, 1); I(.32, 0, 0);
  I(wt('s02', 'portal'), 8, .25, '200,150,255');
  I(wt('s05', 'trovão'), 40, 1, '255,220,200'); I(wt('s05', 'estremecer'), 26, 0);
  I(wt('s06', 'Xangô'), 14, .35, '255,210,120'); I(wt('s06', 'trovões'), 22, .5, '255,230,180');
  I(wt('s07b', 'trovões'), 16, 0);
  I(wt('s08b', 'céu'), 18, .7, '255,215,110');
  I(wt('s09', 'raio'), 16, .4, '180,220,255'); I(wt('s09', 'outro'), 16, .4, '255,220,140'); I(wt('s09', 'outro') + .55, 46, 1);
  I(wt('s10', 'provocou'), 20, .4, '255,140,220');
  I(wt('s11', 'Ogum') + .25, 14, 0);
  I(L0('s12b'), 22, .5, '255,190,150');
  I(wt('s14', 'atravessar'), 24, .2, '200,60,160');
  I(wt('s15', 'Oxalá'), 0, .8, '255,255,245');
  I(L0('s16b') - .05, 18, .6, '170,60,255');
  I(wt('s19', 'A'), 10, .3, '140,200,255'); I(wt('s20', 'B'), 10, .3, '255,120,150');
  I(wt('s21c', 'atravessar') + .25, 40, .5, '255,80,160');
}
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

// ---------------------------------------------------------------- HUD (the story's own game state; not a ranking of anyone's faith)
function hudState(t) {
  const step = (t0, a, b, d = .7) => lerp(a, b, eio(seg(t, t0, t0 + d)));
  let bal = 100; const c1 = wt('s09', 'outro') + .55, c2 = wt('s10', 'provocou'), c3 = wt('s14', 'atravessar');
  bal = t < c2 ? step(c1, 100, 75) : t < c3 ? step(c2, 75, 50) : step(c3, 50, 20);
  let en = 100; if (t > c2) en = step(c2, 100, 125) + Math.sin(t * 23) * 3; if (t > c3) en = step(c3, 125, 160) + Math.sin(t * 29) * 4;
  const alerts = [[c1, 'balance'], [c2, 'balance'], [c2, 'energy'], [c3, 'balance'], [c3, 'energy']];
  const newMission = L1('s16b') - .3;
  return { bal, en, alerts, newMission, pulse: [wt('s02', 'portal')] };
}
function bar(x, y, w, v, max, col, t, alertT) {
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(x, y, w, 22, 11); g.fill();
  const f = clamp(v / max), danger = v < 35 || v > 120; const c = danger ? (Math.sin(t * 14) > 0 ? '#ff3b4e' : '#ff8a3b') : col;
  g.fillStyle = c; rr(x, y, Math.max(22, w * f), 22, 11); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; rr(x + 6, y + 3, Math.max(10, w * f - 12), 6, 3); g.fill();
  for (let i = 1; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + w * i / 10, y, 2, 22); }
  g.lineWidth = 3; g.strokeStyle = '#0d0a18'; rr(x, y, w, 22, 11); g.stroke();
  if (alertT != null && t - alertT < 1.6 && t >= alertT && Math.sin((t - alertT) * 18) > -.3) { glowDot(x + w * f, y + 11, 60, '255,60,60', .8); }
}
function hud(t) {
  screen(); const S = hudState(t), y0 = 236, ex = t >= S.pulse[0] - .2 && t < S.pulse[0] + 1.2 ? Math.sin(seg(t, S.pulse[0], S.pulse[0] + 1.2) * Math.PI) : 0;
  const pub = seg(t, wt('s17', 'vocês'), wt('s17', 'vocês') + .4) * (1 - seg(t, S0('mec') + .3, S0('mec') + .8));
  g.save(); g.translate(540, y0); g.scale(1 + .03 * pub, 1 + .03 * pub); g.translate(-540, -y0);
  g.shadowColor = pub > 0 ? 'rgba(255,215,90,.9)' : 'rgba(90,230,255,.6)'; g.shadowBlur = 18 + 30 * pub;
  g.fillStyle = 'rgba(8,10,30,.78)'; rr(40, y0, 1000, 180 + 44 * pub, 22); g.fill(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = pub > 0 ? '#ffd65a' : '#5ee7ff'; g.stroke();
  g.font = '40px Anton'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('ENCONTRO DOS PANTEÕES', 66, y0 + 34); note('hudt', 'ENCONTRO DOS PANTEÕES', 66, y0 + 14, 450, y0 + 54);
  g.fillStyle = '#ffd65a'; rr(900, y0 + 14, 116, 40, 20); g.fill(); g.fillStyle = '#1a1030'; g.font = '30px Anton'; g.textAlign = 'center'; g.fillText('EP. 01', 958, y0 + 35); note('hudep', 'EP. 01', 915, y0 + 18, 1000, y0 + 52);
  const al = k => { let a = null; for (const [tt, kk] of S.alerts) if (kk === k && t >= tt) a = tt; return a; };
  g.textAlign = 'left'; g.font = '25px Anton';
  g.fillStyle = '#b9a8ff'; g.fillText('ENERGIA DO PORTAL', 66, y0 + 80); bar(66, y0 + 98, 360, S.en, 160, '#b06bff', t, al('energy'));
  g.fillStyle = S.en > 110 ? '#ff6b7a' : '#fff'; g.font = '30px Anton'; g.fillText(Math.round(S.en) + '%', 438 + 6 * ex, y0 + 109);
  if (ex > 0) glowDot(246, y0 + 109, 220, '200,150,255', .5 * ex);
  g.font = '25px Anton'; g.fillStyle = '#9fe9ff'; g.fillText('EQUILÍBRIO ENTRE OS MUNDOS', 560, y0 + 80); bar(560, y0 + 98, 360, S.bal, 100, '#4fd8ff', t, al('balance'));
  g.fillStyle = S.bal < 35 ? '#ff6b7a' : '#fff'; g.font = '30px Anton'; g.fillText(Math.round(S.bal) + '%', 932, y0 + 109);
  const nm = t >= S.newMission, mf = nm ? seg(t, S.newMission, S.newMission + .3) : 1;
  g.font = '27px Anton'; g.fillStyle = nm && t - S.newMission < 2 && Math.sin(t * 16) > 0 ? '#ff6b7a' : '#ffd65a'; g.fillText(nm ? 'NOVA MISSÃO:' : 'MISSÃO:', 66, y0 + 150);
  const mw = g.measureText(nm ? 'NOVA MISSÃO: ' : 'MISSÃO: ').width; g.fillStyle = '#fff'; g.globalAlpha = mf; const mt = nm ? 'DESCOBRIR O RESPONSÁVEL' : 'DESCOBRIR QUEM ABRIU O PORTAL';
  g.fillText(mt, 66 + mw, y0 + 150); g.globalAlpha = 1; if (mf >= 1) note(nm ? 'mis2' : 'mis1', mt, 66 + mw, y0 + 134, 66 + mw + g.measureText(mt).width, y0 + 166);
  if (pub > 0) { g.globalAlpha = pub; g.font = '27px Anton'; g.fillStyle = '#ffd65a'; g.fillText('JOGADORES:', 66, y0 + 196); g.fillStyle = '#fff'; g.fillText('VOCÊS', 66 + g.measureText('JOGADORES: ').width, y0 + 196); g.globalAlpha = 1; }
  // alert chip
  for (const [tt] of S.alerts) if (t >= tt && t < tt + 1.6) { g.save(); g.globalAlpha = Math.sin((t - tt) * 14) > -.2 ? 1 : .3; g.fillStyle = '#ff2e4a'; rr(760, y0 + 136, 256, 34, 17); g.fill(); g.lineWidth = 3; g.strokeStyle = '#0d0a18'; g.stroke();
    g.fillStyle = '#fff'; g.font = '26px Anton'; g.textAlign = 'center'; g.fillText('⚠ ALERTA', 888, y0 + 154); g.restore(); break; }
  g.restore();
}

// ---------------------------------------------------------------- captions: 2–5 words, word-by-word pop, key words in yellow, danger in red
const YEL = new Set('zeus xango ogum iansa oxala orixa olimpo portal trovoes trovao senhor unico raio raios poder ceu povo verdade mundo mundos curtidas pista episodio decisao justica panteoes tempestade juntos voces mil'.split(' '));
const RED = new Set('perigo ameacalo criatura desconhecida rachadura colisao batalha estremecer contra rapido alguem atravessar'.split(' '));
let NOCAP = [];
function capColor(w, line) { const n = norm(w); if ((n === 'a' || n === 'b') && /s19|s20|s21a/.test(line) && /[AB]/.test(w)) return '#ffd65a';
  if (RED.has(n) && !(n === 'atravessar' && line !== 's21c')) return '#ff4d5e'; if (YEL.has(n)) return '#ffd65a'; return '#ffffff'; }
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
  pill(id + 'b', o.full ? 'NOVO PERSONAGEM DESBLOQUEADO' : 'NOVO PERSONAGEM', t, t0, t1, o.by || 560, { px: 40, bg: '#120c22', fg: '#ffd65a', line: '#ffd65a', r: 14 });
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

// ---------------------------------------------------------------- scenes
const SCENES = {};
const AFR = (t, dark = 0, o = {}) => { bg('bg_africa', o.depth || .35, { dark, darkc: '22,18,60', ...o }); };
const OLY = (t, o = {}) => bg('bg_olympus', o.depth || .35, o);

SCENES.hook = (t, lt) => {
  const z = lt < .35 ? 1.35 - .3 * eo(lt / .35) : 1.05 + lt * .02; cam(z, 540, 1000);
  AFR(t, .55); stormSky(t, 1);
  const hit = .3, freeze = wt('s01', 'único') - .1;
  if (t < freeze) {
    const zr = spr('zeus_2', 270, 1800, 1080 * breathe(t)), xr = spr('xango_1', 820, 1800, 1150 * breathe(t, 1));
    const zh = at(zr, .3, .05), xh = at(xr, .45, .06), mid = [540, 520];
    const p = eo(seg(lt, 0, hit));
    bolt(zh[0], zh[1], lerp(zh[0], mid[0], p), lerp(zh[1], mid[1], p), t, '140,200,255', 12);
    bolt(xh[0], xh[1], lerp(xh[0], mid[0], p), lerp(xh[1], mid[1], p), t + 7, '255,170,80', 12, { seed: 50 });
    if (lt > hit) { glowDot(mid[0], mid[1], 260 + 60 * Math.sin(t * 30), '255,255,255', .9); rays(mid[0], mid[1], 16, t, '255,240,200', .18, 1400, .6); }
  } else {   // freeze on both faces, split diagonally
    const fz = seg(t, freeze, freeze + .15);
    clip(0, 960, () => { cam(1.05, 540, 960); sunburst(540, 480, 0, '#1d3d8a', '#2850a8'); spr('zeusb_0', 420, 1010, 640, {}); });
    clip(960, H, () => { cam(1.05, 540, 960); sunburst(540, 1440, 0, '#7a1420', '#9a2028'); spr('xangob_0', 640, 1960, 920, {}); });
    splitLine(960, '#ffd65a');
    screen(); g.fillStyle = `rgba(255,255,255,${.6 * (1 - fz)})`; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .9; g.fillStyle = '#ffd65a'; g.font = '34px Anton'; g.textAlign = 'left'; g.fillText('❚❚', 60, 500); g.restore();
  }
};
SCENES.olimpo = (t, lt, sc) => {
  const pz = wt('s02', 'portal'), u = seg(t, sc.t0, wt('s02', 'Olimpo')); cam(lerp(2.3, 1.0, eio(u)), lerp(540, 540, u), lerp(900, 960, u));
  OLY(t, { depth: .5 }); screen(); rays(540, -100, 12, t, '255,240,190', .08, 2200, .03); apply(1);
  clouds(t, 5, 1000, 1250, 40, '#ffffff', '#5c6f9a', .9, 3, .6);
  const zr = spr('zeus_4', 540, 1560, 820);
  const pr = 170 * eo(seg(t, pz - .1, pz + .6)); portal(900, 1200, pr * (1 + .05 * Math.sin(t * 5)), t);
  if (pr > 0) particles(t, 36, { cols: ['190,120,255', '255,210,100'], r: 5, add: true, up: true, speed: 1.4 });
  clouds(t, 4, 1650, 1900, 70, '#ffffff', '#5c6f9a', 1.5, 11, 1.25);
};
SCENES.trav = (t, lt, sc) => {
  const zw = wt('s03', 'Zeus'), ta = wt('s03', 'atravessar'), te = sc.t1 - .45;
  if (t < zw - .05) {   // smug close-up
    cam(1.0 + lt * .03, 540, 960); OLY(t, { depth: .2, s: 1.4 }); screen(); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, W, H); apply(1);
    spr('zeusb_0', 560, 1960, 1250 * breathe(t)); return;
  }
  const u = seg(t, zw - .05, te); cam(1.15, lerp(420, 700, eio(u)), 1000);
  OLY(t, { depth: .5, dx: -120 }); clouds(t, 4, 1050, 1250, 40, '#fff', '#5c6f9a', .9, 3, .6);
  const px = 960, py = 1180, pr = 190 * (1 + .06 * Math.sin(t * 6)) * (1 + 1.2 * ei(seg(t, te - .3, sc.t1)));
  portal(px, py, pr, t);
  const wx = lerp(250, px - 40, eio(seg(t, zw, te))), into = seg(t, ta + .2, te + .1), bob = Math.abs(Math.sin(t * 7)) * 14;
  spr('zeus_3', wx, 1640 - bob * (1 - into), 1000 * (1 - .75 * into), { a: 1 - into, rot: into * .8, sx: 1 - .5 * into });
  particles(t, 30, { cols: ['190,120,255', '255,210,100'], r: 5, add: true, up: true, speed: 1.6, vx: 1 });
  if (t > te - .25) { screen(); const k = seg(t, te - .25, sc.t1); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(200,140,255,${k})`; g.fillRect(0, 0, W, H); g.restore(); glitch(k, t); }
};
SCENES.mundo = (t, lt, sc) => {
  const zc = wt('s04', 'completamente') - .05;
  if (t < zc) { cam(1.0 + lt * .025, 540, lerp(900, 980, seg(lt, 0, 3))); AFR(t, 0, { depth: .4 }); clouds(t, 4, 150, 450, 25, '#fff8ec', '#7a4a3a', .9, 2, .3);
    spr('zeus_0', 300, 1780, 720 * breathe(t)); particles(t, 22, { cols: ['#7fbf3f', '#c9a23a', '#5e9a2e'], r: 7, leaf: true, vx: .8, speed: .8 });
  } else { const u = seg(t, zc, zc + .25); cam(1.0 + .2 * (1 - eo(u)), 540, 960); AFR(t, 0, { depth: .2, s: 1.5, dx: 200 }); screen(); g.fillStyle = 'rgba(255,220,160,.15)'; g.fillRect(0, 0, W, H); apply(1);
    spr('zeusb_2', 560, 1960, 1220 * breathe(t)); particles(t, 14, { cols: ['#7fbf3f', '#c9a23a'], r: 8, leaf: true, vx: .8, speed: .8 });
    const q = clamp((t - zc - .2) / .3); if (q > 0) { screen(); g.save(); g.translate(860, 640 + Math.sin(t * 5) * 14); g.rotate(.15 + Math.sin(t * 3) * .08); g.scale(back(q), back(q)); stroked('?', 0, 0, '220px Anton', '#ffd65a', { lw: 22 }); g.restore(); }
  }
  if (lt < .45) glitch(1 - lt / .45, t);
};
SCENES.trovao = (t, lt, sc) => {
  const tb = wt('s05', 'trovão'), dk = eio(seg(t, sc.t0, tb));
  if (t < tb + .9) { cam(1.0 + lt * .04, 540, 1000); AFR(t, .62 * dk); stormSky(t, dk); if (t < tb) spr('zeus_0', 270, 1790, 900 * breathe(t));
    else spr('zeusb_1', 230, 1960, 760, {});
    if (t >= tb - .06 && t < tb + .35) bolt(860, -60, 830, 800, t, '255,90,70', 16, { prog: eo(seg(t, tb - .06, tb + .02)) });
    dust(t, tb, 830, 820, 30);
    if (t > tb) { glowDot(830, 820, 300 * (1 - seg(t, tb, tb + .8)), '255,140,90', .8); }
  } else { const u = seg(t, tb + .9, sc.t1); cam(1.9 - .2 * u, 820, 830); AFR(t, .62); stormSky(t, 1); dust(t, tb, 830, 820, 30);
    fog(t, .9, '120,100,110', 500); for (let i = 0; i < 3; i++) if (rnd(Math.floor(t * 6), i) > .7) bolt(830 + (rnd(i, Math.floor(t * 6)) - .5) * 300, 820, 830 + (rnd(i + 3, Math.floor(t * 6)) - .5) * 400, 620, t + i, '255,110,80', 4, { branches: false }); }
};
SCENES.xango = (t, lt, sc) => {
  const tx = wt('s06', 'Xangô'), tj = wt('s06', 'justiça'), tt = wt('s06', 'trovões');
  const xr = 1500; // sprite height
  let z, cy; if (t < tt) { const u = eio(seg(t, sc.t0 + .3, tj)); z = 2.0; cy = lerp(1720, 600, u); } else { const u = eo(seg(t, tt, tt + .5)); z = lerp(2.0, 1.0, u); cy = lerp(600, 1000, u); }
  cam(z, 540, cy);
  apply(1); const sb = seg(t, tx - .2, tx + .3); if (sb < 1) { AFR(t, .62); stormSky(t, 1); }
  if (sb > 0) { g.save(); g.globalAlpha = sb; screen(); sunburst(540, 760, t, '#8a1420', '#c22a2a'); g.restore(); apply(1); }
  const r = spr('xango_0', 540, 1900, xr * breathe(t, 1));
  const ax = at(r, .2, .66); if (t > wt('s06', 'raios') - .1) for (let i = 0; i < 3; i++) bolt(ax[0], ax[1], ax[0] + (rnd(i, Math.floor(t * 8)) - .5) * 320, ax[1] + (rnd(i + 9, Math.floor(t * 8)) - .5) * 320, t + i, '255,200,90', 5, { branches: false });
  fog(t, .7 * (1 - seg(t, sc.t0, tx + .4)), '150,140,150', 900);
  unlock('ux', 'XANGÔ', t, tx, sc.t1, '#c22a2a', { full: true });
};
SCENES.confr = (t, lt, sc) => {
  const b0 = L0('s07b') - .1, to = wt('s07b', 'outro') - .05, tv = wt('s07b', 'trovões') - .05, pz = L1('s07b') + .1;
  if (t < b0) { cam(1.0 + lt * .03, 540, 1000); AFR(t, .62); stormSky(t, 1); spr('xango_0', 820, 1500, 700); spr('zeus_1', 330, 1880, 1200 * breathe(t)); }
  else if (t < to) { cam(1.05 + (t - b0) * .08, 540, 960); screen(); sunburst(540, 900, t, '#1d3d8a', '#2850a8'); apply(1); spr('zeusb_0', 520, 1960, 1250); }
  else if (t < tv) { cam(1.05, 540, 960); AFR(t, .7, { s: 1.6 }); spr('xangob_0', 560, 1960, 1250); }
  else if (t < pz) { cam(2.4, 600, 1060); screen(); sunburst(540, 900, t, '#1d3d8a', '#2850a8'); apply(1); spr('zeusb_0', 520, 1960, 1250); }
  else { const u = seg(t, pz, sc.t1); cam(2.4 + .3 * u, 560, 1010); AFR(t, .75, { s: 1.6 }); spr('xangob_1', 540, 1960, 1250); }
};
SCENES.resp = (t, lt, sc) => {
  const tc = wt('s08b', 'céu'), u = seg(t, sc.t0, sc.t1); cam(1.0 + .25 * eio(u), 540, lerp(1000, 900, u));
  AFR(t, .66); stormSky(t, 1);
  for (let i = 0; i < 2; i++) { const k = Math.floor(t * 2.5 + i * .5); if (rnd(k, i) > .45) bolt(100 + rnd(k, 3) * 880, 300, 100 + rnd(k, 4) * 880, 980, t + i, i ? '255,210,120' : '255,150,90', 6, { branches: false }); }
  const raise = eo(seg(t, L0('s08a'), tc)); spr(raise < .5 ? 'xango_0' : 'xango_1', 540, 1880, 1350 * breathe(t, 2), {});
  if (t > tc) { const r = { x: 540, y: 500 }; glowDot(r.x - 40, r.y, 260 + 30 * Math.sin(t * 9), '255,210,90', .55); }
  bigText('impact2', ['O CÉU NÃO PERTENCE', 'A UM ÚNICO POVO'], t, tc - .1, sc.t1 - .05, 1280, { px: 100, cols: ['#ffffff', '#ffd65a'] });
};
SCENES.demo = (t, lt, sc) => {
  const tr = wt('s09', 'raio'), tx = wt('s09', 'Xangô', 0), to = wt('s09', 'outro'), tc = to + .55;
  if (t < to - .05) {
    clip(0, 960, () => { cam(1, 540, 960); apply(1); g.save(); g.translate(0, -480); AFR(t, .55, { depth: 0 }); g.restore(); screen(); g.translate(0, -580);
      const r = spr('zeus_2', 260, 1950, 1000 * breathe(t)); const h = at(r, .3, .05); if (t > tr) bolt(h[0], h[1], lerp(h[0], 1150, eo(seg(t, tr, tr + .3))), lerp(h[1], 700, eo(seg(t, tr, tr + .3))), t, '140,200,255', 12); });
    clip(960, H, () => { screen(); g.translate(0, 470); AFR(t, .55, { depth: 0, dx: 0 }); screen(); g.translate(0, 330);
      const r = spr('xango_1', 800, 1950, 1150 * breathe(t, 1)); const h = at(r, .45, .06); if (t > tx + .2) bolt(h[0], h[1], lerp(h[0], -100, eo(seg(t, tx + .2, tx + .6))), lerp(h[1], 700, eo(seg(t, tx + .2, tx + .6))), t, '255,170,80', 12, { seed: 50 }); });
    splitLine(960, '#ffd65a'); screen(); g.font = '60px Anton'; stroked('VS', 540, 960, '80px Anton', '#ff4d5e', { lw: 14 });
  } else {
    const u = seg(t, to, sc.t1); cam(1.0 + .1 * u, 540, 960); AFR(t, .6); stormSky(t, 1);
    const p = eo(seg(t, to - .05, tc)), mid = [540, 700];
    spr('zeus_2', 200, 1820, 900); spr('xango_1', 880, 1820, 960);
    bolt(250, 980, lerp(-50, mid[0], p), lerp(900, mid[1], p), t, '140,200,255', 14); bolt(830, 960, lerp(1130, mid[0], p), lerp(900, mid[1], p), t + 3, '255,170,80', 14, { seed: 40 });
    if (t > tc) { const d = t - tc; screen(); g.save(); g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) { const rr2 = (d - k * .12) * 1600; if (rr2 > 0) { g.beginPath(); g.ellipse(mid[0], mid[1] + SH[1], rr2, rr2 * .45, 0, 0, 7); g.lineWidth = 26 * Math.max(0, 1 - d); g.strokeStyle = k === 1 ? 'rgba(255,200,90,.8)' : 'rgba(150,210,255,.8)'; g.stroke(); } }
      g.restore(); apply(1); glowDot(mid[0], mid[1], 380 * (1 - seg(t, tc, tc + 1.2)) + 80, '255,255,255', .9); particles(t, 50, { cols: ['150,210,255', '255,200,90'], r: 6, add: true, speed: 2.5 }); }
  }
};
SCENES.conseq = (t, lt, sc) => {
  const tp = wt('s10', 'provocou'), k = seg(t, tp - .2, tp + 1.6), u = seg(t, sc.t0, sc.t1);
  cam(1.0 + .5 * eio(seg(t, tp + .3, sc.t1)), 540, lerp(960, 760, eio(seg(t, tp + .3, sc.t1))));
  AFR(t, .66); stormSky(t, 1); rift(540, 650, 760, k, t);
  spr('zeus_0', 220, 1820, 760, {}); spr('xango_0', 860, 1820, 800, {});
  glitch(.6 * clamp(Math.sin(t * 7)) * k, t);
  if (t > tp) { screen(); const a = .35 + .25 * Math.sin(t * 10); g.lineWidth = 40; g.strokeStyle = `rgba(255,30,60,${a})`; g.strokeRect(0, 0, W, H); }
};
SCENES.ogum = (t, lt, sc) => {
  const to = wt('s11', 'Ogum'), tpr = wt('s11', 'primeiro'), tp = wt('s11', 'perigo') - .1;
  if (t < tp) { cam(1.05, 540, 960); AFR(t, .62); stormSky(t, 1); rift(380, 520, 600, 1, t);
    const x = lerp(1400, 620, eo(seg(t, to - .3, tpr))); const r = spr(seg(t, to - .3, tpr) < 1 ? 'ogum_1' : 'ogum_0', x, 1860, 1300 * breathe(t, 3));
    const tip = at(r, seg(t, to - .3, tpr) < 1 ? .1 : .17, seg(t, to - .3, tpr) < 1 ? .7 : .04); const gl = seg(t, wt('s11', 'perceber') - .1, wt('s11', 'perceber') + .5);
    if (gl > 0 && gl < 1) { screen(); apply(1); g.save(); g.translate(tip[0], tip[1] + 40); g.rotate(t * 3); g.globalCompositeOperation = 'lighter'; const s = Math.sin(gl * Math.PI) * 120; g.fillStyle = 'rgba(220,240,255,.95)';
      g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .12, 0); g.lineTo(0, s); g.lineTo(-s * .12, 0); g.fill(); g.beginPath(); g.moveTo(-s, 0); g.lineTo(0, s * .12); g.lineTo(s, 0); g.lineTo(0, -s * .12); g.fill(); g.restore(); glowDot(tip[0], tip[1] + 40, 90 * Math.sin(gl * Math.PI), '200,230,255', .8); }
  } else { const u = seg(t, tp, sc.t1); cam(1.05 + .1 * u, 540, 960); AFR(t, .7, { s: 1.5, dx: 150 }); stormSky(t, 1); rift(200, 380, 500, 1, t); spr('ogum_2', 600, 1960, 1250 * breathe(t, 3)); }
  unlock('uo', 'OGUM', t, to, sc.t1 + .1, '#23407a', {});
};
SCENES.iansa = (t, lt, sc) => {
  const tb = L0('s12b'), tc = wt('s12b', 'chegado') - .1;
  const storm = seg(t, sc.t0, tb);
  if (t < tc) { cam(1.0 + .08 * Math.sin(lt * .7), 540, 960, Math.sin(t * 1.3) * .015); AFR(t, .62 + .1 * storm); stormSky(t, 1); clouds(t * (1 + 5 * storm), 7, 80, 600, 220, '#4a4478', '#1a1630', 1.4, 21, .3);
    wind(t, .4 + .6 * storm, 540, 1050); particles(t * 3, 30, { cols: ['#c9a23a', '#a86b2a', '#7fbf3f'], r: 7, leaf: true, vx: 2.5, speed: 1.5 });
    const ap = eo(seg(t, tb - .3, tb + .5)); if (ap > 0) spr('iansa_0', 540, 1820, 1250 * (.7 + .3 * ap), { a: ap, sway: [t, 22], rot: (1 - ap) * -.6 });
  } else { const u = seg(t, tc, sc.t1); cam(1.0 + .25 * eo(u), 540, 900); AFR(t, .7, { s: 1.6 }); stormSky(t, 1); wind(t, .7, 560, 900);
    spr('iansa_2', 560, 1960, 1250, { sway: [t, 10] }); particles(t * 3, 18, { cols: ['#c9a23a', '#a86b2a'], r: 7, leaf: true, vx: 2.5, speed: 1.5 }); }
  unlock('ui', 'IANSÃ', t, tb - .35, sc.t1 + .1, '#c2441f', {});
};
SCENES.percebe = (t, lt, sc) => {
  const tp = wt('s13', 'percebeu') - .05, tend = L1('s13'), gulp = tend + .1, back2 = tend + .75;
  if (t < tp) { const u = seg(t, sc.t0, tp); cam(1.12, lerp(380, 700, u), 1000); AFR(t, .66); stormSky(t, 1); rift(540, 450, 700, 1, t);
    spr('ogum_0', 180, 1800, 1050); spr('xango_0', 540, 1820, 1120, {}); spr('iansa_1', 900, 1800, 1080, { sway: [t, 8] }); }
  else if (t < back2) { cam(1.0 + .05 * seg(t, tp, back2), 540, 960); screen(); sunburst(540, 900, t * .3, '#2b2f6b', '#363b80'); apply(1); spr('zeusb_1', 560, 1960, 1250 * breathe(t));
    if (t > gulp) { const d = t - gulp; screen(); g.save(); g.translate(820, 760 + d * 160); g.fillStyle = '#9fe2ff'; g.strokeStyle = '#0d0a18'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -46); g.quadraticCurveTo(34, 10, 0, 30); g.quadraticCurveTo(-34, 10, 0, -46); g.fill(); g.stroke(); g.restore(); } }
  else { const u = seg(t, back2, sc.t1); cam(1.3 + .4 * u, 540, 640); AFR(t, .72); stormSky(t, 1); rift(540, 650, 760, 1, t, { open: 34 }); glitch(.5 * (Math.sin(t * 13) > .6), t); }
};
SCENES.ameaca = (t, lt, sc) => {
  const tc = wt('s14', 'criatura'), ta = wt('s14', 'atravessar'), u = seg(t, sc.t0, sc.t1);
  cam(1.0 + .7 * eio(u), 540, lerp(900, 640, eio(u))); AFR(t, .85, { darkc: '10,5,25' }); stormSky(t, 1);
  rift(540, 650, 820, 1, t, { open: 60 + 40 * seg(t, ta, sc.t1) });
  eyes(540, 640, .55, seg(t, tc, tc + .5) * (.75 + .25 * Math.sin(t * 3)), t);
  const hg = eo(seg(t, ta - .1, ta + .6)); if (hg > 0) { spr('beast_1', 800, 690, 560 * hg, { ay: .55, rot: -.2, a: hg }); }
  fog(t, .9, '70,30,90', 900); vignette(.75, '0,0,0');
};
SCENES.oxala = (t, lt, sc) => {
  const to = wt('s15', 'Oxalá') - .05, u = seg(t, to, sc.t1);
  if (t < to) { cam(1.05 + lt * .04, 540, 980, Math.sin(t * 8) * .006); AFR(t, .78, { darkc: '10,5,25' }); stormSky(t, 1); rift(540, 520, 700, 1, t, { open: 60 });
    spr('ogum_0', 220, 1800, 1000); spr('xango_1', 560, 1820, 1150, {}); spr('iansa_0', 900, 1800, 1000, { sway: [t, 14] }); }
  else { const l = eo(seg(t, to, to + 1.2)); cam(1.0 + .04 * u, 540, 960); AFR(t, lerp(.78, .25, l), { darkc: '10,5,25' }); stormSky(t, 1 - .7 * l);
    screen(); g.save(); g.globalAlpha = l; rays(540, -200, 14, t * .3, '255,255,240', .14, 2600, .02, .05); g.restore(); apply(1);
    const y = lerp(1300, 1860, eo(seg(t, to, to + 1.6))); glowDot(540, y - 900, 700, '255,255,235', .55 * l);
    spr('oxala_0', 540, y, 1450 * breathe(t, 4), { glow: 'rgba(255,255,230,.9)', gb: 60, a: clamp(l * 1.5) });
    particles(t * .4, 50, { cols: ['255,255,240', '255,240,200'], r: 5, add: true, up: true, speed: .6 }); }
  unlock('uox', 'OXALÁ', t, to + .1, sc.t1 + .1, '#d9d4c4', {});
};
SCENES.revel = (t, lt, sc) => {
  const tb = L0('s16b') - .05, tp = wt('s16b', 'panteões') - .1, tr = wt('s16b', 'outros') + .1;
  if (t < tb) { cam(1.02 + lt * .03, 540, 960); screen(); const gr = g.createRadialGradient(540, 800, 100, 540, 900, 1300); gr.addColorStop(0, '#fffbea'); gr.addColorStop(1, '#c9c1a8'); g.fillStyle = gr; g.fillRect(0, 0, W, H); apply(1);
    rays(540, 700, 18, t, '255,250,220', .12, 1600, .05); spr('oxala_1', 540, 1960, 1250 * breathe(t, 4)); particles(t * .4, 30, { cols: ['255,255,240'], r: 5, add: true, up: true, speed: .6 }); return; }
  if (t < tr) { const u = seg(t, tb, tr), zz = t < tp ? 1 + .1 * u : 1 + .1 * u + 1.6 * eo(seg(t, tp, tp + .5));
    cam(zz, 540, lerp(960, 700, seg(t, tp, tp + .5))); screen(); g.fillStyle = '#07040f'; g.fillRect(0, 0, W, H); apply(1);
    // a small portal shows the clearing with the gods, seen from somewhere else
    g.save(); g.beginPath(); g.ellipse(540, 1100, 300, 380, 0, 0, 7); g.clip(); g.translate(540, 1100); g.scale(.4, .4); g.translate(-540, -960); AFR(t, .6, { depth: 0 });
    spr('zeus_0', 300, 1800, 800); spr('xango_0', 760, 1800, 840); g.restore();
    g.save(); g.lineWidth = 14; g.strokeStyle = 'rgba(170,60,255,.9)'; g.shadowColor = '#a03cff'; g.shadowBlur = 40; g.beginPath(); g.ellipse(540, 1100, 300, 380, 0, 0, 7); g.stroke(); g.restore();
    // the watcher: a hooded shape in front, back lit by the small portal
    g.save(); g.fillStyle = '#000'; g.beginPath(); g.moveTo(140, 1960); g.quadraticCurveTo(170, 1300, 330, 1060); g.quadraticCurveTo(540, 520, 750, 1060); g.quadraticCurveTo(910, 1300, 940, 1960); g.fill();
    g.strokeStyle = 'rgba(170,60,255,.55)'; g.lineWidth = 6; g.stroke(); g.restore();
    eyes(540, 820, .7, seg(t, tb + .2, tb + .6), t, '200,120,255');
    fog(t, .5, '60,20,90', 1200); glitch(t > tp ? .8 * Math.abs(Math.sin(t * 9)) : .15, t); vignette(.8, '0,0,0');
  } else { cam(1.0, 540, 960); AFR(t, .66); stormSky(t, 1); rift(540, 520, 700, 1, t, { open: 60 }); spr('zeus_0', 200, 1800, 900); spr('xango_0', 560, 1820, 950); spr('oxala_0', 880, 1800, 980); glitch(.6 * (1 - seg(t, tr, tr + .3)), t); }

};
SCENES.publico = (t, lt, sc) => {
  const tv = wt('s17', 'vocês') - .05, nm = S0('publico') + 3.2;
  cam(lerp(1.05, .97, eo(seg(t, tv, tv + .5))), 540, 1000); screen(); sunburst(540, 1000, t * .5, '#160f2e', '#1f1640'); apply(1);
  const P = [['zeusb_0', 200, 900, '#2850a8', false], ['xangob_1', 540, 900, '#9a2028'], ['ogum_2', 880, 900, '#23407a', false], ['iansa_2', 370, 1330, '#c2441f', true], ['oxala_1', 710, 1330, '#8f8a78']];
  P.forEach(([k, x, y, c, f], i) => { const u = seg(t, sc.t0 + .15 + i * .22, sc.t0 + .5 + i * .22); if (u <= 0) return; const s = back(u);
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = c; rr(-145, -200, 290, 400, 24); g.fill(); g.save(); rr(-145, -200, 290, 400, 24); g.clip(); spr(k, 0, 200, 420 * breathe(t, i), { flip: f }); g.restore();
    g.lineWidth = 10; g.strokeStyle = '#ffd65a'; rr(-145, -200, 290, 400, 24); g.stroke(); g.restore(); });
  if (t > tv) { screen(); const k = seg(t, tv, tv + .4); g.save(); g.globalAlpha = k; g.lineWidth = 14; g.strokeStyle = '#ffd65a'; g.setLineDash([40, 24]); g.lineDashOffset = -t * 120; rr(30, 640, 1020, 920, 40); g.stroke(); g.restore(); }
};
SCENES.mec = (t, lt, sc) => {
  const tm = wt('s18', 'mil') - .1, te = sc.t1 - .2;
  cam(1, 540, 960); screen(); sunburst(540, 960, t * .4, '#120c26', '#1a1236'); apply(1);
  const likes = Math.round(3000 * eio(seg(t, tm, te)) / 10) * 10;
  // heart + counter
  screen(); g.save(); g.translate(250, 720); const hb = 1 + .08 * Math.max(0, Math.sin(t * 9)); g.scale(hb, hb); g.fillStyle = '#ff3b6b'; g.strokeStyle = '#0d0a18'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-90, -20, -60, -90, 0, -45); g.bezierCurveTo(60, -90, 90, -20, 0, 40); g.fill(); g.stroke(); g.restore();
  stroked(likes.toLocaleString('pt-BR'), 560, 722, '110px Anton', '#fff', { lw: 16 }); stroked('CURTIDAS', 860, 735, '44px Anton', '#ffd65a', { lw: 10, align: 'left' });
  note('curt', 'CURTIDAS', 860, 712, 1040, 758);
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(90, 820, 900, 56, 28); g.fill(); const f = likes / 3000; g.fillStyle = '#ffd65a'; rr(90, 820, Math.max(56, 900 * f), 56, 28); g.fill(); g.lineWidth = 6; g.strokeStyle = '#0d0a18'; rr(90, 820, 900, 56, 28); g.stroke();
  for (let i = 1; i <= 3; i++) { g.fillStyle = '#0d0a18'; g.fillRect(90 + 300 * i - 3, 810, 6, 76); }
  for (let i = 0; i < 3; i++) { const y = 1000 + i * 150, th = (i + 1) * 1000, open = likes >= th, ou = open ? seg(t, tm + (te - tm) * Math.acos(1 - 2 * ((i + 1) / 3)) / Math.PI, 1e9) : 0, s = back(seg(t, wt('s18', 'pista') - .2 + i * .15, wt('s18', 'pista') + .2 + i * .15));
    if (s <= 0) continue; g.save(); g.translate(540, y); g.scale(s, s); g.fillStyle = open ? '#2b5a3a' : '#2a2346'; rr(-430, -60, 860, 120, 22); g.fill(); g.lineWidth = 6; g.strokeStyle = open ? '#7dffa0' : '#ffd65a'; g.stroke();
    const tx = `PISTA 0${i + 1}`; stroked(tx, -370, 0, '58px Anton', '#fff', { lw: 10, align: 'left' }); stroked(`${th.toLocaleString('pt-BR')} CURTIDAS`, 380, 0, '44px Anton', '#ffd65a', { lw: 8, align: 'right' });
    g.save(); g.translate(-40, 0); g.fillStyle = open ? '#7dffa0' : '#ffd65a'; g.strokeStyle = '#0d0a18'; g.lineWidth = 5; rr(-26, -10, 52, 42, 8); g.fill(); g.stroke();
    g.beginPath(); g.arc(0, -10, 18, Math.PI, open ? Math.PI * 1.55 : 0); g.lineWidth = 9; g.strokeStyle = open ? '#7dffa0' : '#ffd65a'; g.stroke(); g.restore(); g.restore();
    note('p' + i, tx, 170, y - 30, 330, y + 30); note('pc' + i, `${th.toLocaleString('pt-BR')} CURTIDAS`, 600, y - 22, 920, y + 22); }
  particles(t * 1.2, 30, { cols: ['255,215,90'], r: 6, add: true, up: true, speed: 1 });
  stroked('DEMONSTRAÇÃO', 540, 1490, '34px Anton', 'rgba(255,255,255,.7)', { lw: 6 });
};
function optBG(t, c1, c2) { screen(); sunburst(540, 1000, t * .4, c1, c2); apply(1); }
SCENES.opA = (t, lt, sc) => {
  const ta = wt('s19', 'Opção') - .05, tz = wt('s19', 'deixam');
  if (t < tz - .1) { cam(1, 540, 960); optBG(t, '#13306b', '#1b3f86'); pill('la', 'A', t, ta, tz, 900, { px: 360, bg: '#ffd65a', fg: '#13306b', r: 60, glow: 'rgba(120,190,255,.9)' }); pill('oa', 'OPÇÃO', t, ta, tz, 560, { px: 70, bg: '#fff' }); return; }
  const u = seg(t, tz - .1, sc.t1); cam(1.08, lerp(480, 640, u), 1000); AFR(t, .6); stormSky(t, 1); rift(980, 560, 520, 1, t, { open: 40 });
  const bob = k => Math.abs(Math.sin(t * 6 + k)) * 12, x0 = lerp(160, 420, u);
  const zr = spr('zeus_3', x0, 1800 - bob(0), 980), xr = spr('xango_2', x0 + 330, 1820 - bob(1.5), 1060, { flip: true });
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const a = t * 2.4 + i * .5, r = 120 + 40 * Math.sin(i), cx = x0 + 165, cy = 1250;
    glowDot(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r * .8, 22, i % 2 ? '150,210,255' : '255,210,100', .8); } g.restore();
  screen(); g.fillStyle = 'rgba(20,50,120,.25)'; g.fillRect(0, 0, W, H);
  pill('a2', 'A', t, tz - .1, sc.t1, 570, { px: 110, bg: '#ffd65a', fg: '#13306b', r: 30, x: 150 });
  pill('a3', 'ZEUS + XANGÔ INVESTIGAM JUNTOS', t, tz, sc.t1, 1150, { px: 52, bg: '#13306b', fg: '#ffd65a', line: '#ffd65a', r: 18 });
};
SCENES.opB = (t, lt, sc) => {
  const tb = wt('s20', 'Opção') - .05, to = wt('s20', 'atravessam') - .15;
  if (t < to - .1) { cam(1, 540, 960); optBG(t, '#5a0f2e', '#6e1a46'); pill('lb', 'B', t, tb, to, 900, { px: 360, bg: '#ff4d6d', fg: '#fff', r: 60, glow: 'rgba(200,60,255,.9)' }); pill('ob', 'OPÇÃO', t, tb, to, 560, { px: 70, bg: '#fff' }); return; }
  const u = seg(t, to - .1, sc.t1); cam(1.05 + .12 * u, 540, 1000); AFR(t, .8, { darkc: '25,5,30' }); stormSky(t, 1);
  portal(540, 760, 260, t, '120,30,160', '255,60,120', { core: 'rgba(20,0,30,1)', sy: 1.3 }); eyes(540, 760, .35, .5 + .3 * Math.sin(t * 2), t, '255,80,120');
  spr('ogum_0', 260, 1840, 1100, { flip: true }); spr('iansa_1', 820, 1830, 1080, { sway: [t, 10] });
  fog(t, .8, '90,20,80', 1000); particles(t, 30, { cols: ['120,20,140', '60,0,60'], r: 8, up: true, speed: .9 });
  screen(); g.fillStyle = 'rgba(90,10,60,.2)'; g.fillRect(0, 0, W, H);
  pill('b2', 'B', t, to - .1, sc.t1, 570, { px: 110, bg: '#ff4d6d', fg: '#fff', r: 30, x: 150 });
  pill('b3', 'OGUM + IANSÃ ATRAVESSAM O PORTAL', t, to, sc.t1, 1150, { px: 50, bg: '#3a0a2a', fg: '#ff9db0', line: '#ff4d6d', r: 18 });
};
SCENES.cta = (t, lt, sc) => {
  const tc = wt('s21c', 'atravessar'), hand = tc + .15, cut = sc.t1 - .55, cd = L0('s21b') - .1;
  if (t >= cut) { screen(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return 'black'; }
  const pa = 1 + .04 * Math.max(0, Math.sin(t * 6)), pb = 1 + .04 * Math.max(0, Math.sin(t * 6 + Math.PI));
  clip(420, 960, () => { cam(1, 540, 960); optBG(t, '#13306b', '#1b3f86'); screen(); spr('zeus_0', 260, 1000, 520); spr('xango_0', 820, 1000, 540); screen(); g.save(); g.translate(540, 700); g.scale(pa, pa); stroked('A', 0, 0, '300px Anton', '#ffd65a', { lw: 22 }); g.restore(); });
  clip(960, H, () => { screen(); optBG(t, '#5a0f2e', '#6e1a46'); screen(); spr('ogum_0', 240, 1520, 520); spr('iansa_1', 830, 1520, 520); screen(); g.save(); g.translate(540, 1230); g.scale(pb, pb); stroked('B', 0, 0, '300px Anton', '#ff4d6d', { lw: 22 }); g.restore(); });
  splitLine(960, '#fff'); screen(); stroked('OU', 540, 960, '70px Anton', '#fff', { lw: 14 });
  pill('vd', 'VOCÊ DECIDE O PRÓXIMO EPISÓDIO', t, sc.t0 + .2, cut, 520, { px: 48, bg: '#ffd65a', r: 16 });
  pill('ce', 'COMENTE A OU B', t, wt('s21a', 'Comente') - .1, cut, 1560, { px: 60, bg: '#fff', rot: -2 });
  const k = clamp((t - wt('s21a', 'Comente') - .3) / .25); if (k > 0) { screen(); g.save(); g.globalAlpha = k; const b = Math.sin(t * 7) * 8; stroked('comenta aqui embaixo ↓', 540, 1680 + b, '600 52px Fredoka', '#fff', { lw: 10 }); g.restore(); if (k >= 1) note('comenta', 'comenta aqui embaixo', 300, 1650, 780, 1710); }
  if (t > cd && t < hand) { const n = 3 - Math.floor((t - cd) / ((hand - cd) / 3)); const f = ((t - cd) / ((hand - cd) / 3)) % 1; screen(); g.save(); g.translate(540, 960); g.scale(1.4 - .4 * eo(f), 1.4 - .4 * eo(f)); g.globalAlpha = 1 - f * .5;
    g.fillStyle = '#ff2e4a'; g.beginPath(); g.arc(0, 0, 95, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke(); stroked(String(Math.max(1, n)), 0, 6, '120px Anton', '#fff', { lw: 10 }); g.restore(); }
  if (t > hand) { const u = seg(t, hand, cut); screen(); g.fillStyle = `rgba(10,0,20,${.6 * u})`; g.fillRect(0, 0, W, H); rift(540, 960, 1000, 1, t, { open: 200 * u }); spr('beast_0', 540, 960, lerp(500, 3600, ei(u)), { ay: .5 }); glitch(.6 * u, t); }
};

// ---------------------------------------------------------------- frame
const ORDER = ['hook', 'olimpo', 'trav', 'mundo', 'trovao', 'xango', 'confr', 'resp', 'demo', 'conseq', 'ogum', 'iansa', 'percebe', 'ameaca', 'oxala', 'revel', 'publico', 'mec', 'opA', 'opB', 'cta'];
function render(t) {
  t = clamp(t, 0, DUR - 1e-4); TX = []; screen(); g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  SH = shake(t); const id = ORDER.find(k => t >= S0(k) && t < S1(k)) || 'cta', sc = TL.scenes[id];
  const r = SCENES[id](t, t - sc.t0, sc); screen(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (r === 'black') return;
  flash(t); vignette(.45); hud(t); brand(); caption(t);
  if (t > S0('revel') && t < S0('mec')) { pill('nm1', 'NOVA MISSÃO', t, L1('s16b') - .45, S0('publico') + 3.2, 520, { px: 54, bg: '#ff2e4a', fg: '#fff' });
  pill('nm2', 'DESCOBRIR O RESPONSÁVEL', t, L1('s16b') - .3, S0('publico') + 3.2, 625, { px: 56, bg: '#120c22', fg: '#ffd65a', line: '#ffd65a', r: 16 }); }
  if (id === 'hook') bigText('impact1', ['O ÚNICO SENHOR', 'DOS TROVÕES?'], t, wt('s01', 'único') - .05, S1('hook') - .02, 960, { px: 120, cols: ['#ffffff', '#ffd65a'] });
}
function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o }), w = wt;
  for (const id in TL.lines) E(L0(id), 'vo', { id });
  for (const e of IMP) if (e.a >= 30) E(e.t, 'thunder'); else if (e.a >= 14 || e.f >= .4) E(e.t, 'impact', { v: Math.min(1, (e.a + 30 * e.f) / 40) });
  E(.0, 'riser', { d: .3 }); E(.3, 'zap', { d: 1.2 }); E(w('s01', 'único') - .1, 'freeze');
  E(w('s02', 'portal') - .1, 'portal', { d: 3.5 }); E(w('s02', 'portal') + .1, 'charge');
  E(w('s03', 'Zeus'), 'steps', { d: w('s03', 'atravessar') - w('s03', 'Zeus') + .3 }); E(S1('trav') - .5, 'teleport');
  E(S0('mundo') + .05, 'whoosh'); E(w('s04', 'completamente') + .15, 'pop'); E(S0('mundo'), 'birds', { d: 4.5 });
  E(S0('trovao'), 'rumble', { d: w('s05', 'trovão') - S0('trovao') }); E(w('s05', 'trovão') + .05, 'rocks');
  E(S0('xango') + .2, 'smoke'); E(w('s06', 'Xangô') - .05, 'unlock'); E(w('s06', 'raios'), 'zap', { d: 1.4 });
  E(L1('s07b') + .1, 'pulse', { d: S1('confr') - L1('s07b') }); E(w('s07b', 'outro') - .05, 'cut'); E(w('s07b', 'trovões') - .05, 'cut');
  E(L0('s08b') - .5, 'riser', { d: .5 });
  E(S0('demo'), 'riser', { d: w('s09', 'outro') + .5 - S0('demo') }); E(w('s09', 'raio'), 'zap', { d: .8 }); E(w('s09', 'Xangô') + .2, 'zap', { d: .8 }); E(w('s09', 'outro') + .55, 'collide');
  E(w('s09', 'outro') + .6, 'alarm', { n: 2 });
  E(w('s10', 'provocou') - .1, 'glass'); E(w('s10', 'provocou') + .2, 'alarm', { n: 3 }); E(w('s10', 'provocou'), 'unstable', { d: S1('conseq') - w('s10', 'provocou') });
  E(w('s11', 'Ogum') - .3, 'whoosh'); E(w('s11', 'Ogum'), 'unlock'); E(w('s11', 'Ogum') + .25, 'metal'); E(w('s11', 'perceber') - .1, 'shing');
  E(S0('iansa'), 'wind', { d: S1('iansa') - S0('iansa') }); E(L0('s12b') - .35, 'unlock');
  E(L1('s13') + .1, 'gulp'); E(L1('s13') + .75, 'riser', { d: S1('percebe') - L1('s13') - .75 });
  E(S0('ameaca') + .1, 'heart', { d: S1('ameaca') - S0('ameaca') }); E(w('s14', 'criatura'), 'growl', { d: 2.0 }); E(w('s14', 'atravessar'), 'alarm', { n: 3 });
  E(w('s15', 'Oxalá') - .1, 'shimmer'); E(w('s15', 'Oxalá') + .05, 'unlock');
  E(L0('s16b') - .05, 'reveal'); E(L0('s16b'), 'whispers', { d: 2.6 }); E(L1('s16b') - .45, 'mission');
  E(S0('publico') + .15, 'select', { n: 5 }); E(w('s17', 'vocês'), 'notify');
  { const tm = w('s18', 'mil') - .1, te = S1('mec') - .2; for (let i = 0; i < 3; i++) { const u = Math.acos(1 - 2 * ((i + 1) / 3)) / Math.PI; E(tm + (te - tm) * u, 'levelup'); } for (let k = 0; k < 14; k++) E(tm + (te - tm) * k / 14, 'coin'); E(w('s18', 'pista') - .2, 'notify'); }
  E(w('s19', 'A') - .1, 'mission'); E(w('s20', 'B') - .1, 'mission'); E(S0('opB'), 'heart', { d: S1('opB') - S0('opB') });
  E(S0('cta') + .2, 'pop'); E(w('s21a', 'Comente') - .1, 'pop');
  { const cd = L0('s21b') - .1, hand = w('s21c', 'atravessar') + .15; for (let i = 0; i < 3; i++) E(cd + i * (hand - cd) / 3, 'tick'); E(cd, 'heart', { d: hand - cd, fast: 1 }); E(hand - .1, 'growl', { d: 1.0, big: 1 }); E(S1('cta') - .55, 'cutblack'); }
  return ev.sort((a, b) => a.t - b.t);
}
(async () => {
  TL = await (await fetch('timeline.json')).json(); DUR = TL.dur;
  const idx = await (await fetch('parts/index.json')).json(); const keys = Object.keys(idx).concat(['bg_olympus', 'bg_africa']);
  await Promise.all(keys.map(k => new Promise(res => { const im = new Image(); im.onload = res; im.onerror = res; im.src = k.startsWith('bg_') ? `src/${k}.png` : `parts/${k}.png`; IM[k] = im; })));
  await Promise.all(['84px Anton', '600 46px Fredoka', '600 52px Fredoka'].map(f => document.fonts.load(f, 'AÃÉÍÓÇÔáãéíóçô0123456789?↓:')));
  const av = new Image(); av.src = 'brand/avatar.jpg'; await av.decode().catch(() => {}); AV = av.naturalWidth ? av : null;
  impacts(); NOCAP = [[wt('s01', 'único') - .1, S1('hook')], [L0('s08b') - .1, S1('resp')]];
  window.DUR = DUR; window.render = render; window.EV = events();
  window.TEXTS = t => { render(t); return TX.map(o => ({ ...o })); };
  render(Q.get('t') ? +Q.get('t') : 1); window.READY = true;
})();
