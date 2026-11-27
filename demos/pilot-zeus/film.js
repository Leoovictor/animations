// Zeus pilot — 12 s, 1080×1920, 30 fps (docs/ANIMATION_ENGINE_V2.md §12). Everything is a function of t.
// 0–3 walk in (tracking, parallax) · 3–6 stops, looks up, surprise, wind (medium shot) · 6–9 wind-up, energy gathers in the fist (slow push)
// · 9–12 strike: the bolt leaves the fist socket, light on Zeus and the ground, one shake on the impact; recoil and recovery (wide shot).
import { Rig } from './engine/characters/rig.js';
import { Character } from './engine/characters/animator.js';
import { createCamera } from './engine/camera/camera.js';
import { loadJSON, loadImages } from './engine/core/assets.js';
import { K, seg, lerp, clamp, EASE } from './engine/core/math.js';
import { bolt, sparks, glowDot, particles, flashAlpha } from './engine/effects/fx.js';
import { drawLit, groundLight, grade } from './engine/lighting/light.js';
import { act } from './acting.js';
const W = 1080, H = 1920, DUR = 12, Q = new URLSearchParams(location.search), g = document.getElementById('c').getContext('2d'), CAM = createCamera(g, W, H);
const BG = 'assets/backgrounds/forest/layers/', CH = 'assets/characters/zeus/';
let Z, L, META, GY;                                     // GY: the walking line in world px (soles stand here)
const SC = .4, X0 = 160;                                // Zeus scale and start x (world px)
const T = { strike: 9.0, impact: 9.12 };
const IMPACTS = [{ t: T.impact, a: 26, f: .75, c: '200,230,255' }];
const zx = t => Z.poseAt(t, place()).root.x;            // hips x in the world
function place() { return { x: X0, y: GY, scale: SC }; }
// ---------------------------------------------------------------- camera: one function of t, per shot
function shot(t) {
  if (t < 3.0) return { z: 1.0, x: zx(t) + 60, y: 960 };                                                         // tracking the walk
  const xe = zx(3.0);
  if (t < 6.0) { const push = K(t, [[3.0, 1.18], [3.5, 1.18], [3.62, 1.26, 'o'], [6.0, 1.3, 'io']]); return { z: push, x: xe + 40, y: K(t, [[3, 1080], [6, 1060]]) }; }   // medium; quick push on the start
  if (t < T.strike) { const u = EASE.io(seg(t, 6.0, 9.0)); return { z: lerp(1.3, 1.45, u), x: xe + lerp(40, 100, u), y: lerp(1060, 990, u) }; }  // slow push toward the fist
  const u = EASE.io(seg(t, 10.6, 12)); return { z: lerp(1.02, .98, u), x: xe + 230, y: 980 };                     // wide for the bolt and the recoil
}
// ---------------------------------------------------------------- scene
function layer(img, depth, o = {}) {   // a wide strip tiled side by side so any pan stays covered
  CAM.apply(depth); const w = o.w, h = img.height * w / img.width, y = o.y - (o.anchor ?? 1) * h;
  const c = CAM.state, x0 = c.x - (W / 2) / Math.max(.2, 1 + (c.z - 1) * depth) - w, n = 4;
  const start = Math.floor(x0 / w) * w; for (let i = 0; i < n; i++) g.drawImage(img, start + i * w + (o.dx || 0), y, w, h);
}
function scene(t) {
  const s = shot(t); CAM.begin(t); CAM.cam(s.z, s.x, s.y);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#9fc6ef'; g.fillRect(0, 0, W, H);
  const windK = seg(t, 3.15, 3.9) * (1 - seg(t, 10.8, 12)), sway = Math.sin(t * 5.3) * 14 * windK;
  layer(L.far, .12, { w: 2400, y: GY - 260, anchor: 1 });
  clouds(t, windK);
  layer(L.mid, .45, { w: 2600, y: GY + 40, anchor: 1, dx: sway * .3 });
  layer(L.ground, 1, { w: 2700, y: GY - META.ground.pathLine * L.ground.height * 2700 / L.ground.width - 14, anchor: 0 });
  return { s, windK, sway };
}
function clouds(t, windK) {   // a dark front rolling in with the wind: one gradient band at the far layer's depth
  if (windK <= 0) return; CAM.apply(.08); g.save(); const gr = g.createLinearGradient(0, -400, 0, 900); gr.addColorStop(0, `rgba(40,44,78,${.75 * windK})`); gr.addColorStop(1, 'rgba(40,44,78,0)');
  g.fillStyle = gr; g.fillRect(-3000, -1500, 8000, 2400); g.restore(); CAM.apply(1);
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-4); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const { windK, sway } = scene(t);
  const pose = Z.poseAt(t, place()), hand = Z.rig.socket('handN', pose);
  // light from the bolt (and a little from the charged fist), only on Zeus's own pixels
  const charge = seg(t, 6.2, 8.95) * (t < T.strike + .05 ? 1 : 0), boltK = t >= T.strike ? Math.max(0, 1 - (t - T.impact) / 1.1) * (.75 + .25 * Math.sin(t * 61)) : 0;
  const light = boltK > 0 ? { x: hand[0], y: hand[1] - 80, radius: 900, col: '170,215,255', k: .5 * Math.min(1, boltK) } : charge > 0 ? { x: hand[0], y: hand[1], radius: 260, col: '170,215,255', k: .28 * charge } : null;
  CAM.apply(1); groundLight(g, ...worldToScreen(zx(t), GY), 520 * CAM.state.z, '160,210,255', Math.max(boltK * .9, charge * .25));
  if (Q.get('nozeus')) {} else if (Q.get('nolight')) { CAM.apply(1); Z.draw(g, t, place()); } else drawLit(g, x => { x.setTransform(g.getTransform()); Z.draw(x, t, place()); }, light ? { ...light, x: worldToScreen(light.x, light.y)[0], y: worldToScreen(light.x, light.y)[1], radius: light.radius * CAM.state.z } : null);
  CAM.apply(1);
  if (charge > 0) sparks(g, hand[0], hand[1], 70, t, charge);
  if (!Q.get('nobolt') && t >= T.strike && t < T.strike + .75) {   // the bolt leaves the fist socket and travels to the sky, then flickers out
    const prog = EASE.o3(seg(t, T.strike, T.strike + .07)), a = 1 - seg(t, T.strike + .4, T.strike + .75), top = [hand[0] + 760, hand[1] - 1500];
    bolt(g, hand[0], hand[1], top[0], top[1], t, '170,215,255', 16, { prog, alpha: a }); glowDot(g, hand[0], hand[1], 160, '200,235,255', .9 * a);
    if (t > T.impact) glowDot(g, top[0], top[1] + 200, 600, '200,230,255', .6 * a);
  }
  if (!Q.get('nofront')) front(t, sway);
  if (!Q.get('noleaves')) particles(g, t * 1.6, Math.round(26 * windK), { cols: ['#9a8c3a', '#6f8a52', '#b5a04a'], r: 8, leaf: true, vx: 2.4, speed: 1.3, a: windK });
  grade(g, '#7c86b8', .28 * windK + .14 * charge);                                               // ambient light drops with the wind, more during the charge
  const fl = Math.max(flashAlpha(t, T.impact, .3) * .55, flashAlpha(t, T.strike, .08) * .25); if (fl > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(225,240,255,${fl})`; g.fillRect(0, 0, W, H); }
  vignette(.35);
}
// foreground framing: three pieces cut from the front layer, kept at the frame edges, sliding a little faster than the camera (parallax)
let FR;
function cutFront(img) {
  const piece = (x0, y0, x1, y1) => { const c = document.createElement('canvas'), w = x1 - x0, h = y1 - y0; c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, x0, y0, w, h, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; let a = w, b = h, cc = 0, e = 0; for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 20) { a = Math.min(a, xx); b = Math.min(b, yy); cc = Math.max(cc, xx); e = Math.max(e, yy); }
    const o = document.createElement('canvas'); o.width = cc - a + 1; o.height = e - b + 1; o.getContext('2d').drawImage(c, -a, -b); return o; };
  const W0 = img.width, H0 = img.height;
  return { left: piece(0, H0 * .62, W0 * .42, H0), right: piece(W0 * .62, H0 * .74, W0, H0), branch: piece(W0 * .27, 0, W0, H0 * .36) };
}
function front(t, sway) {
  const px = -(CAM.state.x - 300) * .35; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const put = (im, x, y, h, rot = 0) => { const w = im.width * h / im.height; g.save(); g.translate(x + px, y); g.rotate(rot); g.drawImage(im, 0, -h, w, h); g.restore(); };
  put(FR.left, -90, H + 70, 330, -.02 + sway * .0015);
  put(FR.right, W - FR.right.width * 250 / FR.right.height + 150, H + 40, 250, .02 + sway * .0015);
  const bw = 900, bh = FR.branch.height * bw / FR.branch.width; g.save(); g.translate(W - bw + 140 + px * .6, -40); g.rotate(sway * .002); g.drawImage(FR.branch, 0, 0, bw, bh); g.restore();
  g.restore();
}
function worldToScreen(x, y) { const m = g.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; }
function vignette(a) { g.setTransform(1, 0, 0, 1, 0, 0); const vg = g.createRadialGradient(540, 960, 520, 540, 960, 1300); vg.addColorStop(0, 'rgba(10,10,20,0)'); vg.addColorStop(1, `rgba(10,10,20,${a})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
// ---------------------------------------------------------------- sound events (one list, the same times as the picture)
function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o }), P = .9, walk = Z.clips.find(c => c.action === 'walk');
  for (const off of [0, .5]) for (let n = 0; n < 10; n++) { const t = walk.start + (n - off) * P; if (t > .15 && t < walk.start + walk.duration) E(t, 'step', { foot: off ? 'F' : 'N' }); }
  E(walk.start + walk.duration + .25, 'step', { soft: 1 });
  E(0, 'forest', { d: 3.6 }); E(3.15, 'wind', { d: 7.6 }); E(3.3, 'gust'); E(3.5, 'startle');
  E(6.1, 'charge', { d: T.strike - 6.1 }); E(T.strike, 'zap'); E(T.impact, 'thunder'); E(9.6, 'whoosh'); E(9.75, 'step', { soft: 1 }); E(9.82, 'step', { soft: 1 }); E(10.4, 'forest', { d: 1.6, back: 1 });
  return ev.sort((a, b) => a.t - b.t);
}
(async () => {
  const m = await loadJSON(CH + 'rig.json'), keys = new Set(m.bones.map(b => b.image)); for (const v of Object.values(m.variants || {})) for (const k of Object.values(v)) keys.add(k);
  const imgs = await loadImages(Object.fromEntries([...keys].map(k => [k, CH + k])), { canvas: true });
  L = await loadImages({ far: BG + 'far.png', mid: BG + 'mid.png', ground: BG + 'ground.png', front: BG + 'front.png' }, { canvas: true }); META = await loadJSON(BG + 'meta.json'); FR = cutFront(L.front);
  GY = 1560; Z = act(new Character(new Rig(m), imgs)); CAM.impacts(IMPACTS);
  window.DUR = DUR; window.EV = events(); window.render = render; window.TEXTS = () => [];
  render(+(Q.get('t') || 1)); window.READY = true;
})();
