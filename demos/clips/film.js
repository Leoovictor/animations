// Clip gallery: Zeus acts the pilot's 12 s on a neutral stage. Labels show the active clips; ?debug=1 adds bones and sockets.
import { Rig } from './engine/characters/rig.js';
import { Character } from './engine/characters/animator.js';
import { loadJSON, loadImages } from './engine/core/assets.js';
import { act, PILOT_CLIPS } from './acting.js';
const W = 1080, H = 1920, Q = new URLSearchParams(location.search), g = document.getElementById('c').getContext('2d');
const PLACE = { x: -40, y: 1480, scale: .4 };
let Z;
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#20232f'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.fillStyle = '#3a3f52'; g.fillRect(0, PLACE.y, W, 4); g.fillStyle = '#2a2e3d'; g.fillRect(0, PLACE.y + 4, W, H);
  for (let x = 0; x < W; x += 120) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, PLACE.y + 10, 4, 20); }   // ground ticks: show the travel and any foot slide
  const pose = Z.draw(g, t, PLACE);
  if (Q.get('debug')) { Z.rig.debug(g, pose, { labels: false, limits: false }); for (const f of pose.feet) { g.strokeStyle = '#ffdd33'; g.lineWidth = 3; g.beginPath(); g.arc(f[0], f[1], 10, 0, 7); g.stroke(); } }
  const hand = Z.rig.socket('handN', pose); g.strokeStyle = 'rgba(158,216,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(hand[0], hand[1], 14, 0, 7); g.stroke();
  const on = PILOT_CLIPS.filter(c => c.action !== 'idle' && Z.weight(c, t) > .05).map(c => `${c.action} ${(Z.weight(c, t) * 100) | 0}%`);
  g.fillStyle = '#fff'; g.font = '40px sans-serif'; g.textAlign = 'center'; g.fillText(on.join(' · ') || 'idle', 540, 260);
  g.fillStyle = '#8a90a8'; g.font = '30px sans-serif'; g.fillText(`t = ${t.toFixed(2)} s`, 540, 1780);
}
(async () => {
  const m = await loadJSON('assets/characters/zeus/rig.json'), keys = new Set(m.bones.map(b => b.image)); for (const v of Object.values(m.variants || {})) for (const k of Object.values(v)) keys.add(k);
  const imgs = await loadImages(Object.fromEntries([...keys].map(k => [k, 'assets/characters/zeus/' + k])));
  Z = act(new Character(new Rig(m), imgs));
  Z.clips = Z.clips.map(c => PILOT_CLIPS.find(p => p.action === c.action && p.start === c.start) ? Object.assign(PILOT_CLIPS.find(p => p.action === c.action && p.start === c.start), c) : c);
  window.DUR = 12; window.EV = []; window.render = render; window.TEXTS = () => [];
  render(+(Q.get('t') || 1)); window.READY = true;
})();
