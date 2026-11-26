// Umbral — parte 1: the film on one timeline (timeline.json). 3D toon world (world.js) + a 2D overlay (identity, captions, cards).
import * as THREE from 'three';
import { buildWorld, makeKid, makeHand, toon, flat, M, mulberry } from './world.js';

const W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(+(Q.get('pr') || 1.5)); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), g = ov.getContext('2d');
const scene = new THREE.Scene(), FOGC = new THREE.Color('#4b5574');
scene.fog = new THREE.FogExp2(FOGC.clone(), .075); scene.background = FOGC.clone();
const camera = new THREE.PerspectiveCamera(50, W / H, .05, 300);
const hemi = new THREE.HemisphereLight('#a7b6e0', '#2a2638', 1.6); scene.add(hemi);
const moon = new THREE.DirectionalLight('#c3ccff', 1.3); moon.position.set(6, 12, 8); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 }); moon.shadow.bias = -.0008; scene.add(moon, moon.target);

const Wd = buildWorld(scene);
const caio = makeKid({ skin: '#f1c7a5', shirt: '#4f7fc4', pants: '#5b627c', hair: '#5a3a26', tuft: true, hairCover: .34 }); scene.add(caio.root);
const lia = makeKid({ skin: '#e2ad88', shirt: '#e6bf47', pants: '#e6bf47', hair: '#2a1f2a', buns: true, dress: true, sleeveless: true, hairCover: .4, blush: '#ef8a7a' }); scene.add(lia.root);
// flashback hands (big, for the close-up): Caio's, and his little brother's (red sleeve)
const handC = new THREE.Group(), handB = new THREE.Group(); Wd.flash.add(handC, handB);
handC.add(makeHand('#f1c7a5', 1)); handC.add(Object.assign(M(new THREE.CylinderGeometry(.19, .2, .9, 20), toon('#4f7fc4'), .012), {})); handC.children[1].rotation.x = Math.PI / 2; handC.children[1].position.z = -.6;
handB.add(makeHand('#f3cfae', .75)); handB.add(M(new THREE.CylinderGeometry(.15, .16, .9, 20), toon('#c0453a'), .012)); handB.children[1].rotation.x = Math.PI / 2; handB.children[1].position.z = -.55;

// ---------------------------------------------------------------- timing helpers
let TL, ENV, DUR, LINES;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u, seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = u => u * u * (3 - 2 * u), eio = u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u), eo = u => 1 - (1 - u) * (1 - u);
const back = u => { const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const norm = s => s.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
function wt(lid, word, n = 0, end = false) { const q = norm(word); let k = 0; for (const w of TL.words[lid]) if (norm(w[0]).startsWith(q)) { if (k++ === n) return end ? w[2] : w[1]; } throw new Error(`wt ${lid} ${word}`); }
const L0 = id => TL.lines[id].t0, L1 = id => TL.lines[id].t1, SC = id => TL.scenes[id];
function talk(who, t) { for (const l of LINES) if (l.who === who) { const a = L0(l.id), b = L1(l.id); if (t >= a && t < b) { const e = ENV[l.id], i = Math.floor((t - a) * 30); return e[Math.min(i, e.length - 1)] || 0; } } return 0; }
const blink = (t, off) => { const u = ((t + off) % 3.3); return u < .12 ? Math.sin(u / .12 * Math.PI) : 0; };
function K(t, keys, ease = eio) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; const u = ease((t - a) / (b - a)); return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], u)) : lerp(va, vb, u); } return keys[keys.length - 1][1]; }

// ---------------------------------------------------------------- places
const SIDE = .16, DOORSTEP = [-4.75, 0], WALLSPOT = [-5.0, -6.0], CURB = [2.75, -2.6];
const FACE = { mx: -Math.PI / 2, px: Math.PI / 2, mz: Math.PI, pz: 0 };

// ---------------------------------------------------------------- the acting: where each kid is and what they do, as a function of t
function caioPose(t) {
  const p = { x: DOORSTEP[0], z: DOORSTEP[1], y: SIDE, ry: FACE.mx, blink: blink(t, 0), talk: talk('caio', t) * .9, tb: t };
  const s = id => SC(id);
  if (t < s('acorda').t1) {   // at the door; wide eyes; two steps back, then runs down the street
    p.ry = FACE.mx + .45; p.wide = t > wt('l01', 'abre') ? 1 : 0; p.worry = t > L0('l02') ? .8 : .3; p.head = [0, Math.sin(t * .7) * .03, 0];
    if (t > wt('l04', 'passos') - .3) {
      const st = wt('l04', 'passos') - .3, run0 = wt('l04', 'correndo') - .2;
      p.x = lerp(DOORSTEP[0], -3.6, eio(seg(t, st, st + 1.0))); p.move = t < st + 1.0 ? 1 : 0; p.walk = t * 9;
      if (t > run0) { const u = t - run0; p.ry = lerp(FACE.mx, FACE.mz, eo(clamp(u / .3))); p.z = -u * 4.2 * clamp(u / .4); p.x = lerp(-3.6, -1.8, clamp(u / 1.2)); p.move = 1; p.run = 1; p.walk = t * 13; p.y = u > .3 ? 0 : SIDE; }
    }
    return p;
  }
  if (t < s('corre').t1) {
    const tf = wt('l05', 'fôlego') - .4, tArr = L0('l06') - .1;
    if (t < tArr) { const u = t - s('corre').t0; p.x = -.6; p.z = -30 - u * 4.2; p.y = 0; p.ry = FACE.mz; p.move = t < tf ? 1 : .2; p.run = 1; p.walk = t * 13; p.worry = 1; p.wide = .4;
      if (t > tf) { p.z = -30 - (tf - s('corre').t0) * 4.2 - Math.min(1, (t - tf)) * 1.2; p.pant = 1; p.move = 0; p.crouch = .6; p.head = [0, -.3, 0]; }
      return p; }
    p.x = -3.9; p.z = .4; p.y = SIDE; p.ry = FACE.mx + .25; p.pant = clamp(1 - (t - tArr) / 3); p.crouch = .3 * p.pant; p.worry = 1; p.wide = t > L0('l07') ? 1 : .5; p.head = [0, .15 * (1 - p.pant), 0];
    return p;
  }
  if (t < s('ciclo').t1) {
    const t3 = wt('l08', 'terceira') - .4, tM = wt('l09', 'reparou') - .2;
    p.x = WALLSPOT[0]; p.z = WALLSPOT[1]; p.ry = FACE.mx; p.worry = .7;
    if (t < t3) { const sc = seg(t, wt('l08', 'riscou') - .1, wt('l08', 'pedra', 0, true)); p.arm = { R: [2.35 + Math.sin(t * 14) * .12 * (sc > 0 && sc < 1), .1], L: null }; p.head = [0, .1, 0]; }
    else if (t < tM) { const u = seg(t, t3, t3 + 1.3); p.z = lerp(WALLSPOT[1] + 5, WALLSPOT[1], eo(u)); p.ry = u < 1 ? FACE.mz : FACE.mx; p.move = u < 1 ? 1 : 0; p.run = 1; p.walk = t * 13; p.wide = u >= 1 ? 1 : 0; p.arm = u >= 1 ? { R: [1.6, .1] } : null; }
    else { p.ry = lerp(FACE.mx, FACE.px - .4, eio(seg(t, tM, tM + .6))); p.wide = .6; p.worry = .6; }
    return p;
  }
  if (t < s('umbral').t1) {   // crosses to Lia, asks, looks back at the wall
    const a = s('menina').t0, tW = wt('l12', 'olhou') - .2;
    const u = seg(t, a - .2, a + 1.4); p.x = lerp(WALLSPOT[0], 1.6, eio(u)); p.z = lerp(WALLSPOT[1], -2.2, eio(u)); p.y = u < .25 ? SIDE : 0; p.move = u > 0 && u < 1 ? 1 : 0; p.walk = t * 9; p.ry = FACE.px - .25;
    p.worry = .7; p.head = [0, .15, 0];
    if (t > tW && t < L1('l12') + .3) { p.ry = FACE.mx + .6; p.head = [.3, 0, 0]; p.wide = t > wt('l12', 'outros') - .1 ? 1 : .3; }
    if (t > L0('l13') - .2) { p.ry = FACE.px - .25; p.worry = 1; p.wide = .3; }
    return p;
  }
  if (t < s('flash').t0) {   // back at the door, ear against it
    const a = s('lembra').t0; const u = seg(t, a, a + 1.6);
    p.x = lerp(1.6, DOORSTEP[0] - .1, eio(u)); p.z = lerp(-2.2, .2, eio(u)); p.y = u < .8 ? 0 : SIDE; p.move = u > 0 && u < 1 ? 1 : 0; p.walk = t * 9; p.ry = u < 1 ? Math.atan2(DOORSTEP[0] - 1.6, .2 + 2.2) : FACE.mx;
    const lean = seg(t, wt('l15', 'ficou') - .2, wt('l15', 'ficou') + .6); p.lean = .18 * lean; p.head = [.25 * lean, 0, -.45 * lean]; p.worry = .8; p.wide = t > wt('l16', 'irmão') - .1 ? 1 : .3;
    return p;
  }
  if (t < s('flash').t1) {   // the memory: running down a smoky corridor
    p.x = 200; p.y = 0; p.z = -1 - (t - s('flash').t0) * 3.2; p.ry = FACE.mz; p.move = 1; p.run = 1; p.walk = t * 13; p.worry = 1;
    if (t > L0('l18') - .3) { p.x = DOORSTEP[0] + .15; p.z = 0; p.y = SIDE; p.ry = FACE.mx + .5; p.move = 0; p.run = 0; p.tear = seg(t, L1('l18') - .4, L1('l18') + .6); p.worry = 1; p.head = [0, -.1, 0]; }
    return p;
  }
  if (t < s('nome').t0) {   // hand on the knob; looks at Lia; lets go
    const tRel = wt('l21', 'soltou') - .1, tLook = wt('l19', 'viu') - .2;
    p.x = DOORSTEP[0] - .25; p.z = -.3; p.ry = FACE.mx; p.worry = .9;
    p.arm = { L: [t < tRel ? 2.55 : lerp(2.55, .2, eio(seg(t, tRel, tRel + .6))), .05], R: null };
    if (t > tLook) p.head = [Math.min(1.3, (t - tLook) * 4) * .9, 0, 0];
    if (t > L0('l20')) p.head = [1.1, 0, 0];
    return p;
  }
  if (t < s('irmao').t0) {   // goes to Lia, asks her name, holds out his hand
    const a = s('nome').t0 - .3, u = seg(t, a, a + 1.2), tHand = wt('l24', 'estendeu') - .1;
    p.x = lerp(DOORSTEP[0] - .25, .4, eio(u)); p.z = lerp(-.3, -2.2, eio(u)); p.y = u < .3 ? SIDE : 0; p.move = u > 0 && u < 1 ? 1 : 0; p.walk = t * 9; p.ry = FACE.px - .5;
    p.worry = .5; p.smile = t > L0('l23') ? .4 : 0;
    if (t > tHand) p.arm = { R: [lerp(0, 1.3, eo(seg(t, tHand, tHand + .5))), .1] };
    if (t > wt('l24', 'apagou') - .3) { p.head = [.9, .05, 0]; p.wide = .6; }
    if (t > wt('l24', 'neblina') - .3) { p.ry = FACE.mz; p.head = [0, -.05, 0]; p.arm = { R: [.5, -.15] }; p.wide = 1; }
    return p;
  }
  // walking with Lia toward the far door; the knock stops them
  const a = s('irmao').t0, tK = wt('l26', 'bateu') - .3, stop = Math.min(t, tK);
  p.x = .7; p.z = -2.6 - (stop - a) * 1.4; p.y = 0; p.ry = FACE.mz; p.move = t < tK ? 1 : 0; p.walk = t * 8; p.arm = { L: [.25, -.55] };
  p.wide = t > tK ? 1 : .4; p.worry = 1; p.head = [t > L0('l28') ? .5 : 0, 0, 0];
  return p;
}
function liaPose(t) {
  const p = { x: CURB[0], z: CURB[1], y: 0, ry: FACE.mx, sit: 1, blink: blink(t, 1.3), talk: talk('lia', t), tb: t + 2, worry: .5, arm: { L: [.9, .25], R: [.9, -.25] }, head: [0, -.1, 0] };
  const s = id => SC(id);
  if (t < s('ciclo').t0 + 6) { p.x = 200; return p; }   // she is only seen once Caio notices her
  if (t < s('macaneta').t0) { p.head = [t > L0('l10') ? .25 : 0, .05, 0]; if (t > L0('l11')) p.smile = .1; if (t > s('lembra').t0) p.head = [-.3, -.05, 0]; return p; }
  if (t < s('nome').t0) { const tUp = wt('l19', 'levantar') - .5, u = seg(t, tUp, tUp + .8); p.sit = 1 - eio(u); p.y = 0; p.x = lerp(CURB[0], CURB[0] - .2, u); p.arm = u > 0 ? { L: [.2, .1], R: [.2, -.1] } : p.arm; p.head = [-.35, 0, 0]; p.worry = .9; return p; }
  if (t < s('irmao').t0) {
    p.sit = 0; p.x = CURB[0] - .2; p.ry = FACE.mx + .45; p.arm = { L: [.15, .1], R: [.15, -.1] }; p.worry = .6; p.smile = t > L0('l23') ? .5 : 0;
    const tUp = wt('l24', 'levantou') - .2, u = seg(t, tUp, tUp + 1.1); p.x = lerp(CURB[0] - .2, 1.25, eio(u)); p.z = lerp(CURB[1], -2.6, eio(u)); p.move = u > 0 && u < 1 ? 1 : 0; p.walk = t * 9;
    if (u >= 1) { p.ry = FACE.mx; p.arm = { L: [.15, .1], R: [1.1, .1] }; }
    if (t > wt('l24', 'neblina') - .3) { p.ry = FACE.mz; p.arm = { L: [.5, .15], R: [.1, -.1] }; }
    return p;
  }
  const a = s('irmao').t0, tK = wt('l26', 'bateu') - .3, stop = Math.min(t, tK);
  p.sit = 0; p.x = 1.12; p.z = -2.6 - (stop - a) * 1.4; p.ry = FACE.mz; p.move = t < tK ? 1 : 0; p.walk = t * 8 + 1; p.arm = { R: [.25, .55 + .08 * Math.sin(seg(t, L0('l28'), L0('l28') + .5) * Math.PI)], L: [.1, -.1] }; p.worry = 1; p.wide = t > tK ? 1 : 0;
  if (t > L0('l29') - .3) { p.head = [-.6, 0, 0]; p.ry = FACE.mz + .3; }
  return p;
}

// ---------------------------------------------------------------- shots: [t0, fn(t, u) → { p, l, fov }]; a cut at each t0
const v = (x, y, z) => new THREE.Vector3(x, y, z);
function kidHead(K) { const p = new THREE.Vector3(); K.neck.getWorldPosition(p); return p.add(v(0, .4, 0)); }
let SHOTS;
// a face close-up: camera in front of the kid's face, turned by yaw, at dist
function cu(K, dist = 1.9, yaw = .5, dy = .05, fov = 34) { dist *= 1.4; const h = kidHead(K), a = K.root.rotation.y + yaw; return { p: v(h.x + Math.sin(a) * dist, h.y + dy, h.z + Math.cos(a) * dist), l: h.clone().add(v(0, -.04, 0)), fov }; }
function buildShots() {
  const s = id => SC(id), w = wt;
  const D = DOORSTEP, HC = () => kidHead(caio), HL = () => kidHead(lia);
  SHOTS = [
    // hook
    [0, (t, u) => cu(caio, 1.9 - u * .4, 1.0, .02, 32)],
    [L0('l02') - .1, (t, u) => ({ p: v(D[0] + 2.8 - u * .5, 1.2, 1.4), l: v(-5.4, 1.0, -.1), fov: 40 })],
    [w('l02', 'Aquela') - .1, (t, u) => cu(caio, 1.6 - u * .25, 1.15, 0, 32)],
    // acorda
    [s('acorda').t0, (t, u) => ({ p: v(3 - u * 1.5, 9 - u * 4, 9 - u * 2), l: v(-3.5, .6, -1), fov: 48 })],
    [w('l03', 'descalço') - .35, (t, u) => ({ p: v(D[0] + 1.0, .32, .9), l: v(D[0], .25, 0), fov: 40 })],
    [w('l03', 'Só') - .2, (t, u) => ({ p: v(2.4, 1.6, 6.5 - u * 1.5), l: v(-6, 2.0 + u * .2, -1.5), fov: 46 - u * 10 })],
    [L0('l04') - .1, (t, u) => { const c = caio.root.position; return { p: v(1.4, 1.7, 4.2), l: v(c.x, .6, c.z), fov: 50 }; }],
    // corre
    [s('corre').t0, (t, u) => { const c = caio.root.position; return { p: v(c.x + .4, .9, c.z - 2.6), l: v(c.x, .75, c.z), fov: 46 }; }],
    [w('l05', 'fôlego') - .4, (t, u) => { const c = caio.root.position; return { p: v(c.x + 2.0, .9, c.z - 2.4), l: v(c.x, .55, c.z), fov: 42 }; }],
    [L0('l06') - .1, (t, u) => ({ p: v(.5 - u * 1.2, 1.4, 3.8 - u * .6), l: v(-4.6, 1.0, .1), fov: 46 })],
    [L0('l07') - .1, (t, u) => ({ p: v(-3.9, 1.1, -2.6), l: v(-5.2, .95, .3), fov: 44 - u * 6 })],
    // ciclo
    [s('ciclo').t0, (t, u) => ({ p: v(-4.2, 1.0, -7.9), l: v(-5.25, .85, -6.0), fov: 40 })],
    [w('l08', 'terceira') - .4, (t, u) => ({ p: v(-1.5, 1.4, -4.5 + u), l: v(-4.8, .9, -5.8), fov: 48 })],
    [w('l09', 'reparou') - .2, (t, u) => ({ p: v(-5.0, 1.15, -4.6), l: v(CURB[0], .55 + u * .1, CURB[1]), fov: 40 - u * 18 })],
    // menina
    [s('menina').t0, (t, u) => { const h = HC(); return { p: v(3.9, .95, -1.0), l: h.add(v(0, -.15, 0)), fov: 40 }; }],
    [L0('l11') - .05, (t, u) => cu(lia, 1.9, -.55, .15, 34)],
    [w('l12', 'olhou') - .1, (t, u) => { const k = eio(clamp((u - .25) * 1.6)); return { p: v(-4.1, 1.0 - k * .4, -5.4), l: v(-5.33, .95 - k * .45, -6.0), fov: 30 }; }],
    // umbral
    [s('umbral').t0, (t, u) => cu(caio, 1.8, .5, .05, 34)],
    [L0('l14') - .05, (t, u) => ({ p: v(0, 2.2 + u * 3, 8 + u * 2), l: v(0, 1.4, -14), fov: 52 })],
    [w('l14', 'Eu') - .1, (t, u) => cu(lia, 1.9, -.4, .1, 34)],
    // lembra
    [s('lembra').t0, (t, u) => ({ p: v(1.5, 1.6, 4.2), l: v(-3.8, .9, -.2), fov: 48 })],
    [w('l15', 'ficou') - .3, (t, u) => ({ p: v(D[0] + .3, 1.15, 1.5 - u * .4), l: v(-5.4, 1.1, 0), fov: 40 })],
    [L0('l16') - .05, (t, u) => cu(caio, 1.8 - .5 * seg(t, w('l16', 'irmão') - .2, w('l16', 'irmão') + .3), 1.35, 0, 32)],
    // flash
    [s('flash').t0, (t, u) => { const c = caio.root.position; const sh = Math.sin(t * 31) * .02; return { p: v(200.3 + sh, 1.3 + sh, c.z + 2.3), l: v(200, .9, c.z - 1.5), fov: 52 }; }],
    [L0('l18') - .3, (t, u) => ({ p: v(203.0, 1.55, .25), l: v(200, 1.44, .2), fov: 34 })],
    [L1('l18') - .3, (t, u) => cu(caio, 1.5, .6, 0, 32)],
    // maçaneta
    [s('macaneta').t0, (t, u) => ({ p: v(-4.6, 1.0, -1.7), l: v(-5.4, .8, -.3), fov: 38 })],
    [w('l19', 'viu') - .2, (t, u) => ({ p: v(-5.2, 1.3, 1.0), l: v(CURB[0], .7, CURB[1]), fov: 40 })],
    [L0('l20') - .05, (t, u) => cu(lia, 2.0, -.35, .05, 34)],
    [L0('l21') - .1, (t, u) => ({ p: v(-4.6, 1.0, -1.7), l: v(-5.4, .8, -.3), fov: 32 })],
    // nome
    [s('nome').t0, (t, u) => ({ p: v(.9, 1.3, 2.0), l: v(1.6, .7, -2.4), fov: 44 })],
    [L0('l23') - .05, (t, u) => cu(lia, 1.8, -.5, 0, 34)],
    [w('l24', 'estendeu') - .2, (t, u) => ({ p: v(2.0, 1.5, 4.2), l: v(1.4, .6, -2.5), fov: 44 })],
    [w('l24', 'apagou') - 1.0, (t, u) => ({ p: v(2.2, 1.8, 3.2), l: v(-6, 1.8, -.5), fov: 46 })],
    [w('l24', 'neblina') - .3, (t, u) => ({ p: v(.9, 1.1 + u * .4, 1.2), l: v(0, 1.4, -40), fov: 46 - u * 6 })],
    [L0('l25') - .1, (t, u) => ({ p: v(0, 1.4, -26 - u * 4), l: v(0, 1.3, -42), fov: 40 })],
    // irmão
    [s('irmao').t0, (t, u) => { const c = caio.root.position; return { p: v(.9, 1.2, c.z + 3.2), l: v(.9, .8, c.z - 6), fov: 46 }; }],
    [L0('l27') - .1, (t, u) => ({ p: v(.2, 1.3, -37.5 + u * .8), l: v(0, 1.2, -42), fov: 40 })],
    [L0('l28') - .1, (t, u) => { const c = caio.root.position; return { p: v(.94, .8, c.z + 1.9), l: v(.94, .5, c.z), fov: 34 }; }],
    [L0('l29') - .1, (t, u) => cu(lia, 1.7 - u * .3, 0, 0, 34)],
    [L1('l29') + .05, (t, u) => ({ p: v(.45, 1.1, -40.6), l: v(.42, 1.2, -41.9), fov: 34 })],
    // cta: the far door in the fog
    [s('cta').t0, (t, u) => ({ p: v(0, 1.4, -33 + u * 2), l: v(0, 1.4, -42), fov: 44 })],
  ];
}
function shotAt(t) { let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1][0]) i++; const a = SHOTS[i][0], b = i < SHOTS.length - 1 ? SHOTS[i + 1][0] : DUR; return { i, ...SHOTS[i][1](t, clamp((t - a) / (b - a))), t0: a }; }

// ---------------------------------------------------------------- world state over time
function worldAt(t) {
  const s = id => SC(id);
  // fog: thick; it drops when Lia stands up; in the corridor it turns to smoke
  const drop = seg(t, wt('l24', 'neblina') - .3, L1('l24') + .2);
  let dens = lerp(.075, .022, eio(drop)), col = FOGC.clone();
  const inFlash = t >= s('flash').t0 && t < L1('l18') - .3;
  if (inFlash) { dens = .045; col = new THREE.Color('#5a3122'); }
  if (t >= s('cta').t0) dens = .045;
  scene.fog.density = dens; scene.fog.color.copy(col); scene.background.copy(col);
  // the house light: on until "apagou"
  const off = t > wt('l24', 'apagou') - .1 ? 1 : 0, flick = t > wt('l24', 'apagou') - .5 && !off ? (Math.sin(t * 60) > 0 ? 1 : .3) : 1;
  const on = (1 - off) * flick;
  Wd.warm.intensity = 9 * on; Wd.lamp.material.color.set(on > .5 ? '#ffd79a' : '#3a3a48');
  for (const m of Wd.caioHouse.userData.lit || []) m.material.color.set(on > .5 ? '#ffc879' : '#243049');
  Wd.door.children[Wd.door.children.length - 1].material.color.set(on > .5 ? '#ffc879' : '#222533');
  Wd.cold.intensity = 7 * drop;
  // knocks on the far door
  const tK = wt('l26', 'bateu') - .25; Wd.fdoor.position.x = (t > tK && t < tK + .9) ? Math.sin((t - tK) * 40) * .02 * (1 - (t - tK) / .9) : 0;
  // the far knob starts to turn just before the dry cut
  Wd.fknob.rotation.z = -.6 * eio(seg(t, L1('l29') + .35, L1('l29') + 1.0));
  // the fresh scratch is drawn during "riscou a parede com uma pedra"
  const sc = seg(t, wt('l08', 'riscou') - .1, wt('l08', 'pedra', 0, true)); Wd.scratches[0].scale.z = Math.max(.001, t < s('ciclo').t0 ? 0 : sc);
  // Caio's stone follows his right hand while he holds it
  if (t > s('ciclo').t0 && t < wt('l08', 'terceira') - .4) { const hp = new THREE.Vector3(); caio.arms[1].userData.hand.getWorldPosition(hp); Wd.stone.position.copy(hp); Wd.stone.visible = true; } else Wd.stone.visible = false;
  // mist drifts
  for (const m of Wd.mist) { const [x, z, r] = m.userData.v; m.position.x = x + Math.sin(t * .15 + r * 6) * 1.5; m.material.opacity = .22 * (1 - .7 * drop); }
  // the corridor: fire flicker, smoke rolling
  Wd.fire.intensity = 14 + Math.sin(t * 23) * 3 + Math.sin(t * 7.3) * 4;
  for (const m of Wd.smoke) { const [x, y, z, r] = m.userData.v; m.position.set(x + Math.sin(t * .8 + r * 9) * .4, y + Math.sin(t * .5 + r) * .2, z + ((t * .6 + r * 3) % 3)); }
  // the hands in the memory: grip, then slip apart
  const h0 = L0('l18') - .3, slip = eio(seg(t, wt('l18', 'escapando') - .2, wt('l18', 'escapando') + .9));
  handC.position.set(-.05, 1.42, .55 - .25 * slip); handC.rotation.set(-.2, 0, .1);
  handB.position.set(.05, 1.46, -.05 - 1.6 * slip - .1 * Math.sin(t * 3)); handB.rotation.set(.2, Math.PI, -.1 + .3 * slip);
  handC.visible = handB.visible = t > h0 - .5; Wd.fwall.visible = !(t > h0 && t < L1('l18') - .3);
}

// ---------------------------------------------------------------- overlay: identity, captions, cards
let AV, TX = [];
function note(id, text, x0, y0, x1, y1, pass) { TX.push({ id, text, x0, y0, x1, y1, ...(pass ? { pass: true } : {}) }); }
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function brand() {
  const y = 128; g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 4;
  g.fillStyle = 'rgba(24,20,38,.78)'; rr(150, y - 44, 790, 88, 44); g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = '#e6c27a'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#f6e7c4'; g.font = '600 46px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HISTÓRIAS E CRENÇAS', 560, y + 2);
  note('brand', 'HISTÓRIAS E CRENÇAS', 330, y - 24, 790, y + 24);
  const cx = 128, cy = y, r = 84; g.fillStyle = '#e6c27a'; g.beginPath(); g.arc(cx, cy, r + 8, 0, Math.PI * 2); g.fill();
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip(); if (AV) g.drawImage(AV, 25, 18, 360, 360, cx - r, cy - r, 2 * r, 2 * r); g.restore();
  g.strokeStyle = '#1a1726'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); g.restore();
}
const WHO = { nar: '#ffffff', caio: '#9cc8ff', lia: '#ffe07a', porta: '#ffb8a8', irmao: '#bfeaff' };
function wrap(str, font, maxW) { g.font = font; if (g.measureText(str).width <= maxW) return [str]; const ws = str.split(' '); let bi = 1, bd = 1e9;
  for (let i = 1; i < ws.length; i++) { const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), d = Math.abs(g.measureText(a).width - g.measureText(b).width) + (ws[i - 1].length <= 2 ? 90 : 0); if (d < bd) { bd = d; bi = i; } } return [ws.slice(0, bi).join(' '), ws.slice(bi).join(' ')]; }
function caption(t) {
  const c = TL.cues.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const who = (LINES.find(l => l.id === c.line) || {}).who || 'nar', font = '600 50px Fredoka', u = clamp((t - c.t0) / .1), vv = clamp((c.t1 - t) / .08);
  const L = wrap(c.text, font, 900); g.save(); g.globalAlpha = Math.min(u, vv); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  const y0 = 1600 - (L.length - 1) * 33;
  L.forEach((l, i) => { const y = y0 + i * 66; g.lineWidth = 12; g.lineJoin = 'round'; g.strokeStyle = 'rgba(14,12,24,.92)'; g.strokeText(l, 540, y); g.fillStyle = WHO[who]; g.fillText(l, 540, y); });
  g.restore();
}
function card(id, text, t, t0, t1, y, o = {}) {
  const u = clamp((t - t0) / .22), vv = clamp((t1 - t) / .18); if (u <= 0 || vv <= 0) return;
  const k = back(u) * (o.k || 1), px = o.px || 96; g.save(); g.translate(540, y); g.rotate((o.rot || -3) * Math.PI / 180); g.scale(k, k); g.globalAlpha = vv;
  g.font = `${px}px "Lilita One"`; const tw = g.measureText(text).width, w = tw + 80, h = px * 1.35;
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = o.bg || '#f4d35e'; rr(-w / 2, -h / 2, w, h, 26); g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 6; g.strokeStyle = '#1a1726'; g.stroke(); g.fillStyle = o.fg || '#1a1726'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4);
  g.restore(); if (u >= 1 && vv >= 1) note(id, text, 540 - tw / 2, y - px / 2, 540 + tw / 2, y + px / 2);
}
function glowTitle(t, t0, t1) {   // UMBRAL, written in the fog
  const u = clamp((t - t0) / .8), vv = clamp((t1 - t) / .4); if (u <= 0 || vv <= 0) return;
  g.save(); g.globalAlpha = Math.min(u, vv); g.font = '150px "Lilita One"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#bfe0ff'; g.shadowBlur = 40; g.fillStyle = '#e9f3ff'; const sp = 18, word = 'UMBRAL';
  const ws = [...word].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (word.length - 1); let x = 540 - tot / 2;
  [...word].forEach((c, i) => { g.fillText(c, x + ws[i] / 2, 520 + Math.sin(t * 2 + i) * 6); x += ws[i] + sp; });
  g.restore(); if (u >= 1 && vv >= 1) note('umbral', 'UMBRAL', 540 - tot / 2, 440, 540 + tot / 2, 600);
}
function cta(t) {
  const a = SC('cta').t0; if (t < a) return;
  g.save(); g.fillStyle = `rgba(10,10,20,${.35 * clamp((t - a) / .5)})`; g.fillRect(0, 0, W, H); g.restore();
  card('q', 'VOCÊ ABRIRIA A PORTA?', t, wt('l30', 'Você') - .1, DUR + 1, 560, { px: 70, bg: '#f6efe0', rot: -2 });
  card('abre', 'ABRE', t, wt('l30', 'ABRE') - .15, DUR + 1, 820, { px: 120, bg: '#5fd08a', rot: -5 });
  card('espera', 'ESPERA', t, wt('l30', 'ESPERA') - .15, DUR + 1, 1030, { px: 120, bg: '#ff7a6b', rot: 4 });
  card('parte2', 'O VOTO DECIDE A PARTE 2', t, wt('l30', 'voto') - .2, DUR + 1, 1260, { px: 56, bg: '#f4d35e', rot: -1 });
  const k = clamp((t - (wt('l30', 'Comenta') - .1)) / .25); if (k > 0) { g.save(); g.globalAlpha = k; g.font = '600 52px Fredoka'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.lineWidth = 10; g.strokeStyle = 'rgba(14,12,24,.9)';
    const b = Math.sin(t * 7) * 8; g.strokeText('comenta aqui embaixo ↓', 540, 1400 + b); g.fillText('comenta aqui embaixo ↓', 540, 1400 + b); g.restore(); if (k >= 1) note('comenta', 'comenta aqui embaixo', 300, 1370, 780, 1430); }
}
function overlay(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); TX = [];
  // a flash of white into and out of the memory; the dry cut to black before the knob turns
  const fIn = SC('flash').t0, fOut = L1('l18') - .3;
  const wf = Math.max(1 - clamp((t - fIn) / .35), 0) * (t >= fIn ? 1 : 0) + Math.max(1 - clamp((t - fOut) / .35), 0) * (t >= fOut ? 1 : 0);
  if (wf > 0) { g.fillStyle = `rgba(255,240,225,${wf})`; g.fillRect(0, 0, W, H); }
  const cut = L1('l29') + .95; if (t >= cut && t < SC('cta').t0) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  // vignette
  const vg = g.createRadialGradient(540, 900, 500, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,5,15,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  card('v2', '2ª VOLTA', t, wt('l08', 'segunda') - .2, wt('l08', 'terceira') - .5, 470);
  card('v3', '3ª VOLTA', t, wt('l08', 'terceira') - .2, L0('l09') - .1, 470, { rot: 3 });
  card('v7', '7 VEZES', t, wt('l11', 'sete') - .2, L1('l11') + 1.4, 470, { bg: '#ff7a6b' });
  glowTitle(t, wt('l14', 'Umbral') - .35, L1('l14') + .45);
  cta(t); brand(); caption(t);
}

// ---------------------------------------------------------------- render
function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  caio.pose(caioPose(t)); lia.pose(liaPose(t)); worldAt(t);
  scene.updateMatrixWorld(true);
  const sh = shotAt(t); if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); sh.p = v(c[0], c[1], c[2]); sh.l = v(c[3], c[4], c[5]); sh.fov = c[6] || 50; } camera.position.copy(sh.p); camera.lookAt(sh.l); camera.fov = sh.fov; camera.updateProjectionMatrix();
  moon.position.set(camera.position.x + 6, 12, camera.position.z + 8); moon.target.position.set(camera.position.x, 0, camera.position.z - 4);
  renderer.render(scene, camera); overlay(t);
}
function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const l of LINES) E(L0(l.id), 'vo', { id: l.id, who: l.who });
  for (let i = 1; i < SHOTS.length; i++) E(SHOTS[i][0], 'cut');
  const w = wt;
  E(w('l02', 'congelou') - .1, 'heart'); E(w('l04', 'passos') - .3, 'steps', { d: 1.0, soft: 1 }); E(w('l04', 'correndo') - .2, 'run', { d: 2.2 });
  E(SC('corre').t0, 'run', { d: w('l05', 'fôlego') - .4 - SC('corre').t0 }); E(w('l05', 'fôlego') - .4, 'pant', { d: 2.4 }); E(L0('l06') - .1, 'sting');
  E(w('l08', 'segunda') - .2, 'pop'); E(w('l08', 'riscou') - .1, 'scratch', { d: w('l08', 'pedra', 0, true) - w('l08', 'riscou') + .1 }); E(w('l08', 'terceira') - .2, 'pop'); E(w('l08', 'terceira') - .4, 'run', { d: 1.3 });
  E(w('l09', 'reparou') - .2, 'chime'); E(w('l11', 'sete') - .2, 'pop'); E(w('l12', 'outros') - .3, 'sting');
  E(w('l14', 'Umbral') - .2, 'whoosh'); E(SC('lembra').t0, 'steps', { d: 1.6, soft: 1 }); E(w('l16', 'irmão') - .1, 'heart');
  E(SC('flash').t0, 'flash'); E(SC('flash').t0, 'fire', { d: L0('l18') + 2.2 - SC('flash').t0 }); E(w('l18', 'escapando') - .2, 'slip'); E(L1('l18') - .3, 'flash');
  E(SC('macaneta').t0 + .2, 'knob'); E(w('l21', 'soltou') - .1, 'knob'); E(SC('nome').t0 - .3, 'steps', { d: 1.2, soft: 1 });
  E(w('l24', 'apagou') - .5, 'flicker'); E(w('l24', 'apagou') - .1, 'off'); E(w('l24', 'neblina') - .3, 'fogdrop', { d: L1('l24') - w('l24', 'neblina') + .5 });
  E(L0('l25') - .1, 'chime'); E(SC('irmao').t0, 'steps', { d: w('l26', 'bateu') - .3 - SC('irmao').t0, soft: 1 }); E(w('l26', 'bateu') - .25, 'knock');
  E(L0('l28') - .1, 'heart'); E(L1('l29') + .35, 'knob'); E(L1('l29') + .95, 'cutblack');
  for (const [word, n] of [['ABRE', 0], ['ESPERA', 0], ['voto', 0]]) E(w('l30', word, n) - .15, 'pop'); E(w('l30', 'Você') - .1, 'pop');
  return ev.sort((a, b) => a.t - b.t);
}

(async () => {
  TL = await (await fetch('timeline.json')).json(); ENV = await (await fetch('env.json')).json(); LINES = await (await fetch('lines.json')).json(); DUR = TL.dur;
  await Promise.all(['600 50px Fredoka', '96px "Lilita One"'].map(f => document.fonts.load(f, 'AÃÉÍÓÇáãéíóç0123456789ª↓')));
  const av = new Image(); av.src = 'brand/avatar.jpg'; await av.decode().catch(() => {}); AV = av.naturalWidth ? av : null;
  buildShots();
  window.DUR = DUR; window.render = render; window.EV = events();
  window.TEXTS = t => { render(t); return TX.map(o => ({ ...o })); };
  render(Q.get('t') ? +Q.get('t') : 1); window.READY = true;
})();
