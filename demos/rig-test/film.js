// Rig viewer: draws a rig with its bones, pivots, limit arcs and sockets, and exercises it over time.
// ?rig=<url of a rig.json> loads a real character; without it, a PLACEHOLDER figure made of capsules (engine/tests/fixtures.mjs).
// Sections (8 s): 0–3 each joint sweeps min → max of its limits · 3–6 IK: the right hand follows a moving target, feet planted · 6–8 the mirrored copy.
import { Rig } from './engine/characters/rig.js';
import { TEST_RIG } from './engine/tests/fixtures.mjs';
import { seg, EASE } from './engine/core/math.js';
import { loadJSON, loadImages, canvas } from './engine/core/assets.js';
const W = 1080, H = 1920, Q = new URLSearchParams(location.search), g = document.getElementById('c').getContext('2d');
let RIG, IMG, REF, PLACEHOLDER = false;
const VARIANT = { head: Q.get('face'), forearmN: Q.get('hand') };
function capsule(w, h, fill, line) { const c = canvas(w, h), x = c.getContext('2d'); x.fillStyle = fill; x.strokeStyle = line; x.lineWidth = 5; x.beginPath(); x.roundRect(3, 3, w - 6, h - 6, Math.min(w, h) / 2 - 3); x.fill(); x.stroke(); return c; }
function placeholderImages() {
  const head = canvas(150, 170), h = head.getContext('2d'); h.fillStyle = '#e8c39e'; h.strokeStyle = '#2a1a10'; h.lineWidth = 6; h.beginPath(); h.ellipse(75, 85, 68, 78, 0, 0, 7); h.fill(); h.stroke(); h.fillStyle = '#2a1a10'; h.beginPath(); h.arc(100, 70, 8, 0, 7); h.fill();
  return { pelvis: capsule(120, 70, '#d9d4c4', '#2a1a10'), torso: capsule(120, 220, '#f2efe6', '#2a1a10'), head, limb: capsule(44, 140, '#e8c39e', '#2a1a10'), limbB: capsule(44, 140, '#c49c78', '#2a1a10'), leg: capsule(52, 160, '#e8c39e', '#2a1a10'), legB: capsule(52, 160, '#c49c78', '#2a1a10') };
}
const DUR = 8;
let GROUND = 1480;
function pose(t, x, flip = false) {
  const sc = RIG.m.viewScale || 1, angles = {}, p = { root: { x, y: 1180, scale: sc, flip }, angles };
  for (const [bone, v] of Object.entries(VARIANT)) if (RIG.m.variants?.[bone]?.[v]) (p.images ||= {})[bone] = RIG.m.variants[bone][v];   // ?face=surprised&hand=fist
  const rest = RIG.socket(RIG.m.chains.legN[2], { root: { x, y: 0, scale: sc } }); p.root.y = GROUND - rest[1];   // stand on the ground line
  if (t < 3) { const ids = RIG.bones.filter(b => b.limits).map(b => b.id), u = t / 3, k = Math.min(ids.length - 1, Math.floor(u * ids.length)), v = u * ids.length - k, b = RIG.byId[ids[k]];
    angles[b.id] = b.limits[0] + (b.limits[1] - b.limits[0]) * EASE.io(v < .5 ? v * 2 : 2 - v * 2); p.active = b.id; return p; }
  const C = RIG.m.chains, u = seg(t, 3, 6), a = u * Math.PI * 2, F0 = RIG.compute(p), sh = [F0.W[C.arm[0]][4], F0.W[C.arm[0]][5]], reach = 200 * sc / 1.4 * 1.4;
  const target = [sh[0] + (flip ? -1 : 1) * reach * (.6 + .3 * Math.cos(a)), sh[1] - reach * .2 + reach * .75 * Math.sin(a)];
  Object.assign(angles, RIG.solve(p, ...C.arm, target, 0).angles); p.target = target;
  const crouch = 40 * sc * Math.sin(a) ** 2; p.root.y += crouch;                                   // bend the knees: hips go down, feet stay planted
  for (const ch of [C.legN, C.legF]) { const f0 = RIG.socket(ch[2], { ...p, root: { ...p.root, y: p.root.y - crouch }, angles: {} }); Object.assign(angles, RIG.solve(p, ...ch, f0, 0).angles); }
  return p;
}
function label(text, x, y, col = '#fff', px = 34) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = `${px}px sans-serif`; g.fillStyle = col; g.textAlign = 'center'; g.fillText(text, x, y); g.restore(); }
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#1b1d26'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.fillStyle = '#3a3f52'; g.fillRect(0, 1480, W, 6);
  if (Q.get('ref') && REF) {   // fit check: the reference figure (left), the rig at rest (right), and the rig drawn over the reference (centre)
    const place = x => ({ ...pose(0, x), angles: {} }), p0 = place(0), F = RIG.compute(p0), hb = RIG.byId.head, top = F.W.head[5] + F.W.head[3] * (0 - hb.pivot[1]);
    const h = GROUND - top, w = REF.width * h / REF.height;   // the reference figure scaled to the rig's height: compares shape, not size
    if (Q.get('ref') === 'solo' || Q.get('only')) {   // for tools/fit_rig.py: the reference alone, or one bone alone, flat background, same placement
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#00ff00'; g.fillRect(0, 0, W, H);
      if (Q.get('only')) RIG.draw(g, place(540), IMG, { only: Q.get('only').split(',') }); else g.drawImage(REF, 540 - w / 2, GROUND - h, w, h);
      return; }
    for (const [x, rig, ref] of [[200, false, true], [540, true, true], [880, true, false]]) {
      const p = place(x); if (ref) { g.save(); g.globalAlpha = rig ? .45 : 1; g.drawImage(REF, x - w / 2, GROUND - h, w, h); g.restore(); }
      if (rig) { g.save(); g.globalAlpha = ref ? .7 : 1; RIG.draw(g, p, IMG); g.restore(); } }
    label('referência · sobreposição · rig', 540, 260); return;
  }
  const mirrored = t >= 6 && !Q.get('still'), P = Q.get('still') ? [{ ...pose(0, 540), angles: {} }] : mirrored ? [pose(t - 3, 330), pose(t - 3, 750, true)] : [pose(t, 540)];
  for (const p of P) { RIG.draw(g, p, IMG); if (!Q.get('clean')) RIG.debug(g, p, { labels: !mirrored });
    if (Q.get('still')) break; if (p.target) { g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = '#ffdd33'; g.lineWidth = 4; g.beginPath(); g.arc(p.target[0], p.target[1], 16, 0, 7); g.stroke(); } }
  label(t < 3 ? `limites: ${P[0].active}` : t < 6 ? 'IK: mão segue o alvo, pés no chão' : 'espelhado (direita) = mesma ordem de desenho', 540, 260);
  if (PLACEHOLDER) label('PLACEHOLDER — rig de teste feito em código, não é arte de personagem', 540, 1700, '#ff8a8a', 28);
  label(`t = ${t.toFixed(2)} s`, 540, 1780, '#8a90a8', 26);
}
(async () => {
  if (Q.get('rig')) { const base = Q.get('rig').replace(/[^/]*$/, ''), m = await loadJSON(Q.get('rig')); RIG = new Rig(m);
    const keys = new Set(m.bones.map(b => b.image).filter(Boolean)); for (const v of Object.values(m.variants || {})) for (const k of Object.values(v)) keys.add(k);
    IMG = await loadImages(Object.fromEntries([...keys].map(k => [k, base + k])));
    if (m.reference) REF = (await loadImages({ r: base + m.reference })).r; }
  else { RIG = new Rig(TEST_RIG); IMG = placeholderImages(); PLACEHOLDER = true; }
  window.DUR = DUR; window.EV = []; window.render = render; window.TEXTS = () => [];
  render(+(Q.get('t') || 1)); window.READY = true;
})();
