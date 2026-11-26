// Rig fit editor: move, scale and re-layer the pieces of a character's rig over its reference figure, test joints, play the acting, save.
// Edits rig_plan.json (offset, scale, z per bone) through tools/rig_editor_server.py, which rebuilds rig.json. Interactive tool, not a film page.
import { Rig, inv, mul, ap } from '/engine/characters/rig.js';
import { Character } from '/engine/characters/animator.js';
import { act } from '/demos/clips/acting.js';
import { assemble } from './assemble.js';
const Q = new URLSearchParams(location.search), CHAR = Q.get('char') || 'zeus', BASE = `/assets/characters/${CHAR}/`;
const cv = document.getElementById('c'), g = cv.getContext('2d'), $ = id => document.getElementById(id), W = 1080, H = 1920, GROUND = 1560;
let plan, pieces, IMG = {}, ALPHA = {}, REF = null, sel = null, test = {}, hist = [], refOff = [0, 0], playT0 = null, dirty = false;
const getJSON = async u => { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
const loadImg = u => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(u)); i.src = u; });
const bone = id => plan.bones.find(b => b.id === id);
const snapshot = () => JSON.stringify(plan.bones.map(b => ({ id: b.id, offset: b.offset, scale: b.scale, z: b.z })));
function push() { hist.push(snapshot()); if (hist.length > 200) hist.shift(); dirty = true; status(''); }
function undo() { const s = hist.pop(); if (!s) return; for (const o of JSON.parse(s)) { const b = bone(o.id); b.offset = o.offset; b.scale = o.scale; b.z = o.z; } dirty = true; listBones(); }
function place() { const zoom = $('zoom').value / 100; return { x: 540, y: GROUND, scale: (plan.viewScale || .4) * zoom }; }
function rig() { return new Rig(assemble(plan, pieces)); }
function poseFor(R) { const p = place(); const root = { x: p.x, y: 0, scale: p.scale }, F = R.compute({ root }); const feet = Object.keys(R.sockets).filter(k => k.startsWith('foot')).map(k => R.socket(k, { root }, F)[1]);
  root.y = GROUND - Math.max(...feet, 0); return { root, angles: { ...test } }; }
function draw() {
  const R = rig(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#20232f'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a3f52'; g.fillRect(0, GROUND, W, 4);
  let pose;
  if (playT0 != null) { const t = ((performance.now() - playT0) / 1000) % 12; const C = act(new Character(R, IMG)); C.draw(g, t, { x: 140, y: GROUND, scale: place().scale }); g.fillStyle = '#8a90a8'; g.font = '30px sans-serif'; g.fillText(`t = ${t.toFixed(1)} s`, 40, 80); requestAnimationFrame(draw); return; }
  pose = poseFor(R);
  if (REF && $('ref').checked) { const F = R.compute(pose), hb = R.byId.head, top = F.W.head[5] + F.W.head[3] * (0 - hb.pivot[1]) * (hb.scale ?? 1), h = GROUND - top, w = REF.width * h / REF.height;
    g.save(); g.globalAlpha = $('refa').value / 100; g.drawImage(REF, 540 - w / 2 + refOff[0], top + refOff[1], w, h); g.restore(); }
  const F = R.draw(g, pose, IMG);
  if (sel) { const b = R.byId[sel], M = F.W[sel], k = b.scale ?? 1, im = IMG[b.image]; g.save(); g.setTransform(...M); g.scale(k, k); g.strokeStyle = '#ffd65a'; g.lineWidth = 3 / (k * place().scale); g.setLineDash([12 / (k * place().scale), 8 / (k * place().scale)]); g.strokeRect(-b.pivot[0], -b.pivot[1], im.width, im.height); g.restore(); }
  if ($('dbg').checked) R.debug(g, pose, { labels: false, limits: false });
}
// which piece is under the point: topmost bone whose image pixel there is opaque
function pick(x, y) { const R = rig(), F = R.compute(poseFor(R));
  for (const id of [...R.order].reverse()) { const b = R.byId[id], k = b.scale ?? 1, p = ap(inv(F.W[id]), [x, y]), ix = Math.round(p[0] / k + b.pivot[0]), iy = Math.round(p[1] / k + b.pivot[1]), a = ALPHA[b.image];
    if (a && ix >= 0 && iy >= 0 && ix < a.w && iy < a.h && a.d[(iy * a.w + ix) * 4 + 3] > 40) return id; } return null; }
function toCanvas(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
// a drag on screen → an offset change in the parent's own frame (rig px)
function nudge(id, dxs, dys) { const b = bone(id); if (!b.parent) { refOff[0] += dxs; refOff[1] += dys; return; }
  const R = rig(), F = R.compute(poseFor(R)), P = F.W[b.parent], d = ap(inv([P[0], P[1], P[2], P[3], 0, 0]), [dxs, dys]);
  b.offset = [Math.round(((b.offset || [0, 0])[0] + d[0]) * 10) / 10, Math.round(((b.offset || [0, 0])[1] + d[1]) * 10) / 10]; dirty = true; }
let drag = null;
cv.addEventListener('pointerdown', e => { const [x, y] = toCanvas(e), id = pick(x, y); if (id) { sel = id; listBones(); push(); drag = [x, y]; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; } });
cv.addEventListener('pointermove', e => { if (!drag) return; const [x, y] = toCanvas(e); nudge(sel, x - drag[0], y - drag[1]); drag = [x, y]; draw(); });
cv.addEventListener('pointerup', () => { drag = null; cv.style.cursor = 'grab'; listBones(); });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'range') return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { undo(); draw(); e.preventDefault(); return; }
  if (!sel) return; const st = e.shiftKey ? 10 : 1, k = place().scale, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
  if (mv) { push(); nudge(sel, mv[0] * k, mv[1] * k); }
  else if (e.key === '[' || e.key === ']') { push(); const b = bone(sel); b.scale = Math.round(((b.scale ?? 1) + (e.key === ']' ? .01 : -.01)) * 100) / 100; }
  else if (e.key === 'PageUp' || e.key === 'PageDown') { push(); bone(sel).z += e.key === 'PageUp' ? 1 : -1; }
  else return; e.preventDefault(); listBones(); draw();
});
function listBones() {
  $('bones').innerHTML = plan.bones.map(b => `<div class="bone ${b.id === sel ? 'sel' : ''}" data-id="${b.id}">${b.id}<small>z ${b.z} · ×${(b.scale ?? 1).toFixed(2)}${b.offset ? ` · ${b.offset.map(v => Math.round(v)).join(', ')}` : ''}</small></div>`).join('');
  for (const el of document.querySelectorAll('.bone')) el.onclick = () => { sel = el.dataset.id; $('ang').value = test[sel] || 0; $('angv').textContent = (test[sel] || 0) + '°'; listBones(); draw(); };
  const b = sel && bone(sel); $('selinfo').textContent = b ? `${b.id}: peça ${b.piece}, pai ${b.parent || '—'}${b.limits ? `, limites ${b.limits.join('…')}°` : ''}` : 'nenhuma peça selecionada';
}
function status(t) { $('status').textContent = t || (dirty ? 'alterações não salvas' : ''); }
$('zup').onclick = () => { if (!sel) return; push(); bone(sel).z++; listBones(); draw(); };
$('zdn').onclick = () => { if (!sel) return; push(); bone(sel).z--; listBones(); draw(); };
$('sup').onclick = () => { if (!sel) return; push(); const b = bone(sel); b.scale = Math.round(((b.scale ?? 1) + .02) * 100) / 100; listBones(); draw(); };
$('sdn').onclick = () => { if (!sel) return; push(); const b = bone(sel); b.scale = Math.round(((b.scale ?? 1) - .02) * 100) / 100; listBones(); draw(); };
$('ang').oninput = () => { if (!sel) return; test[sel] = +$('ang').value; $('angv').textContent = $('ang').value + '°'; draw(); };
$('angz').onclick = () => { if (sel) { delete test[sel]; $('ang').value = 0; $('angv').textContent = '0°'; draw(); } };
$('reset').onclick = () => { if (!sel) return; push(); const b = bone(sel), o = ORIG[sel]; b.offset = o.offset; b.scale = o.scale; b.z = o.z; listBones(); draw(); };
for (const id of ['ref', 'refa', 'dbg', 'zoom']) $(id).oninput = draw;
$('undo').onclick = () => { undo(); draw(); };
$('play').onclick = () => { playT0 = playT0 == null ? performance.now() : null; $('play').textContent = playT0 == null ? '▶ tocar atuação (12 s)' : '■ parar'; draw(); };
$('save').onclick = async () => {
  status('salvando…'); const r = await fetch(`/api/save?char=${CHAR}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan, null, 1) });
  const j = await r.json().catch(() => ({})); if (r.ok && j.ok) { dirty = false; status('salvo ✓ ' + (j.log || '')); } else status('erro ao salvar: ' + (j.error || j.log || r.status));
};
addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
let ORIG;
(async () => {
  try {
    plan = await getJSON(BASE + 'rig_plan.json'); pieces = await getJSON(BASE + 'parts/pieces.json'); ORIG = Object.fromEntries(plan.bones.map(b => [b.id, { offset: b.offset, scale: b.scale, z: b.z }]));
    const m = assemble(plan, pieces), keys = new Set(m.bones.map(b => b.image)); for (const v of Object.values(m.variants)) for (const k of Object.values(v)) keys.add(k);
    for (const k of keys) { const im = await loadImg(BASE + k); IMG[k] = im; const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); ALPHA[k] = { w: im.width, h: im.height, d: x.getImageData(0, 0, im.width, im.height).data }; }
    if (plan.reference) REF = await loadImg(BASE + plan.reference);
    listBones(); status('pronto: clique numa peça para começar'); draw();
  } catch (e) { status('erro: ' + e.message + '\nAbra pelo servidor: python3 tools/rig_editor_server.py'); }
})();
