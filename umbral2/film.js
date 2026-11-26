// Umbral — parte 2: the door opens on the kitchen of Caio's house. Same engine as part 1 (world.js), new set (buildKitchen).
import * as THREE from 'three';
import { buildWorld, buildKitchen, drawPhone, makeKid, toon, M } from './world.js';

const W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(+(Q.get('pr') || 1.5)); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), g = ov.getContext('2d');
const scene = new THREE.Scene(), FOGC = new THREE.Color('#4b5574'), KFOG = new THREE.Color('#2c3146');
scene.fog = new THREE.FogExp2(FOGC.clone(), .075); scene.background = FOGC.clone();
const camera = new THREE.PerspectiveCamera(50, W / H, .05, 300);
const hemi = new THREE.HemisphereLight('#a7b6e0', '#2a2638', 1.6); scene.add(hemi);
const moon = new THREE.DirectionalLight('#c3ccff', 1.3); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 }); moon.shadow.bias = -.0008; scene.add(moon, moon.target);
const Wd = buildWorld(scene), KT = buildKitchen(scene), KX = -200;
const caio = makeKid({ skin: '#f1c7a5', shirt: '#4f7fc4', pants: '#5b627c', hair: '#5a3a26', tuft: true, hairCover: .34 }); scene.add(caio.root);
const lia = makeKid({ skin: '#e2ad88', shirt: '#e6bf47', pants: '#e6bf47', hair: '#2a1f2a', buns: true, dress: true, sleeveless: true, hairCover: .4, blush: '#ef8a7a' }); scene.add(lia.root);
const bro = makeKid({ skin: '#f3cfae', shirt: '#c0453a', pants: '#4b4f66', hair: '#5a3a26', tuft: true, hairCover: .36, scale: .6 }); scene.add(bro.root);
const mom = makeKid({ skin: '#eec2a0', shirt: '#7b5c8e', pants: '#7b5c8e', hair: '#4a2e22', dress: true, adult: true, longHair: true, hairCover: .45, shirtProp: '#4f7fc4', scale: .82 }); scene.add(mom.root);
const liaMom = makeKid({ skin: '#2a2836', shirt: '#2a2836', pants: '#2a2836', hair: '#1c1a24', dress: true, adult: true, longHair: true, hairCover: .45, scale: .82, blush: '#2a2836' }); scene.add(liaMom.root);

// ---------------------------------------------------------------- timing helpers
let TL, ENV, DUR, LINES;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u, seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u), eo = u => 1 - (1 - u) * (1 - u);
const back = u => { const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const norm = s => s.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
function wt(lid, word, n = 0, end = false) { const q = norm(word); let k = 0; for (const w of TL.words[lid]) if (norm(w[0]).startsWith(q)) { if (k++ === n) return end ? w[2] : w[1]; } throw new Error(`wt ${lid} ${word}`); }
const L0 = id => TL.lines[id].t0, L1 = id => TL.lines[id].t1, SC = id => TL.scenes[id];
function talk(who, t) { for (const l of LINES) if (l.who === who) { const a = L0(l.id), b = L1(l.id); if (t >= a && t < b) { const e = ENV[l.id], i = Math.floor((t - a) * 30); return e[Math.min(i, e.length - 1)] || 0; } } return 0; }
const blink = (t, off) => { const u = ((t + off) % 3.3); return u < .12 ? Math.sin(u / .12 * Math.PI) : 0; };
const FACE = { mx: -Math.PI / 2, px: Math.PI / 2, mz: Math.PI, pz: 0 };
const AWAY = { x: 400, z: 0 };

// ---------------------------------------------------------------- places in the kitchen (world coords)
const DOORIN = [KX + 2.6, 1.2], TABLE = [KX + .5, 1.3], WIN = [KX + 0, -2.45], LIASIDE = [KX + .62, -2.3], BROW = [KX + 0, -3.38], MOMP = [KX - .55, -4.5];
function walkTo(p, t, t0, t1, a, b, run) { const u = seg(t, t0, t1); p.x = lerp(a[0], b[0], eio(u)); p.z = lerp(a[1], b[1], eio(u)); if (u > 0 && u < 1) { p.move = 1; p.run = run ? 1 : 0; p.walk = t * (run ? 13 : 9); p.ry = Math.atan2(b[0] - a[0], b[1] - a[1]); } return u; }

function caioPose(t) {
  const p = { x: TABLE[0], z: TABLE[1], y: 0, ry: FACE.mz, blink: blink(t, 0), talk: talk('caio', t) * .9, tb: t, worry: .7 };
  const s = id => SC(id);
  if (t < s('cozinha').t0) {   // the street: pushing the far door open
    p.x = .35; p.z = -40.7 + .4 * eio(seg(t, .3, 1.6)) * -1; p.ry = FACE.mz; p.arm = { R: [1.45, .1] }; p.wide = 1; p.worry = 1;
    if (t > L0('l02')) { p.x = TABLE[0]; p.z = TABLE[1]; p.arm = null; p.head = [0, .45, 0]; }
    return p;
  }
  if (t < s('audio').t0) {   // comes in through the doorway, looks around: the clock, the phone
    const u = walkTo(p, t, s('cozinha').t0 + .3, wt('l04', 'cozinha') + .3, [KX + 3.4, 1.2], TABLE);
    if (u >= 1) { p.ry = FACE.mz; p.head = t > wt('l04', 'relógio') - .3 && t < wt('l04', 'mesa') - .3 ? [1.2, -.15, 0] : [0, .45, 0]; }
    p.wide = .6;
    return p;
  }
  if (t < s('quintal').t0) {   // listens to the recording; plays it again; understands
    p.head = [0, .45, 0]; const tp = wt('l06', 'play') - .3;
    if (t > tp - .3 && t < tp + .5) p.arm = { L: [1.1 - .3 * Math.sin(seg(t, tp - .1, tp + .3) * Math.PI), -.2] };
    if (t > L0('l08')) { p.head = [0, .2, 0]; p.worry = 1; p.tear = seg(t, wt('l08', 'saído') - 1, wt('l08', 'saído') + .5); }
    return p;
  }
  if (t < s('janela').t0) {   // "Caio?" from outside: turns, calls back
    p.head = [0, .1, 0]; p.wide = 1; p.ry = lerp(FACE.mz, FACE.mz - .5, eio(seg(t, L0('l09'), L0('l09') + .5)));
    if (t > wt('l10', 'chamou') - .2 && t < wt('l10', 'chamou') + .7) p.talk = .7;
    return p;
  }
  if (t < s('nome').t1) {   // runs to the window, knocks; Lia joins him
    walkTo(p, t, L0('l11'), L0('l11') + 1.1, TABLE, WIN, true);
    if (t >= L0('l11') + 1.1) { p.ry = FACE.mz; p.x = WIN[0]; p.z = WIN[1]; p.head = [0, .05, 0]; p.worry = 1; p.wide = .5;
      const tk = wt('l12', 'bateu') - .2; if (t > tk && t < tk + 1.3) p.arm = { R: [2.0 + .15 * Math.sin((t - tk) * 22), .1] };
      if (t > L0('l15') + 1.4) { p.arm = { L: [.4, -.7] }; p.head = [-.35, .05, 0]; }
      if (t > L0('l16') - .2) { p.head = [0, 0, 0]; p.ry = FACE.px - .5; p.arm = { R: [.4, .3] }; }
    }
    return p;
  }
  // the choice: reaches for his brother's hand; turns to Lia; looks at the hand
  p.x = WIN[0]; p.z = WIN[1]; p.ry = FACE.mz; p.worry = 1; p.head = [0, .1, 0];
  const tr = wt('l23', 'pegar') - .3, tLet = wt('l23', 'soltar') - .2;
  p.arm = { L: t < tLet ? [.4, -.7] : [.1, -.1], R: t > tr ? [lerp(.2, 1.45, eo(seg(t, tr, tr + .6))), .05] : [.2, .1] };
  if (t > tLet + .1 && t < SC('mae').t1 - 1.2) { p.ry = .92; p.head = [0, 0, 0]; p.arm = { L: [.1, -.1], R: [.2, .1] }; }
  if (t > L0('l26') + .5) p.wide = 1;
  if (t > SC('mae').t1 - 1.2) { p.ry = FACE.mz; p.head = [0, .15, 0]; }
  return p;
}
function liaPose(t) {
  const p = { x: AWAY.x, z: 0, y: 0, ry: FACE.mz, blink: blink(t, 1.3), talk: talk('lia', t), tb: t + 2, worry: .7 };
  const s = id => SC(id);
  // a flash of the street: back on the curb, for one second
  const curb0 = wt('l26', 'segundo') - .3, curb1 = wt('l26', 'acordado') + .1;
  if (t > curb0 && t < curb1) { p.x = 2.75; p.z = -2.6; p.ry = FACE.mx; p.sit = 1; p.arm = { L: [.9, .25], R: [.9, -.25] }; p.head = [0, -.15, 0]; return p; }
  if (t < s('lia').t0) { p.x = KX + 2.9; p.z = 1.2; p.ry = FACE.mx; if (t < s('janela').t0 || t > s('janela').t1) p.x = AWAY.x; return p; }   // waits in the doorway
  if (t < s('escolha').t0 + (wt('l23', 'soltar') - s('escolha').t0) + .2) {
    const u = walkTo(p, t, L0('l15'), L0('l15') + 2.0, [KX + 2.9, 1.2], LIASIDE);
    if (u >= 1) { p.ry = FACE.mz; p.arm = { R: [.4, .7] }; p.head = [.3, .05, 0];
      if (t > L0('l16') - .2 && t < s('escolha').t0) { p.ry = FACE.mx + .5; p.head = [0, 0, 0]; p.arm = { L: [.4, -.3] }; } }
    return p;
  }
  // lets go, steps back ("Vai"), tries to come closer: the floor goes under her
  const tLet = wt('l23', 'soltar') - .2, tTry = L0('l26') - .1, fall = seg(t, wt('l26', 'desapareceu') - .2, wt('l26', 'pés') + .2);
  p.ry = -1.75; p.head = [0, 0, 0]; p.arm = { L: [.1, .1], R: [.1, -.1] };
  walkTo(p, t, tLet + .2, tLet + 1.2, LIASIDE, [KX + 1.5, -1.3]);
  if (t > tTry) { walkTo(p, t, tTry, tTry + 1.0, [KX + 1.5, -1.3], [KX + 1.2, -1.75]); p.arm = { R: [.9, .1] }; p.y = -.6 * eio(fall); p.wide = fall > 0 ? 1 : 0; }
  if (t > curb1) { p.x = KX + 2.4; p.z = .2; p.y = 0; p.ry = FACE.mx + .4; p.head = [-.3, 0, 0]; p.arm = null; p.wide = .4; }
  if (t > L0('l28') + .3) { p.ry = FACE.px + .6; p.head = [.3, 0, 0]; p.worry = 1; }   // turns toward the doorway: the voice
  if (t > L0('l29') - .3 && t < L1('l29') + .3) { p.ry = FACE.mx + .7; p.head = [-.2, 0, 0]; }
  if (t > L1('l29') + .4) { p.ry = FACE.px; walkTo(p, t, L1('l29') + .5, L1('l29') + 2.2, [KX + 2.4, .2], [KX + 3.0, 1.0]); }   // the first step toward the fog
  return p;
}
function broPose(t) {
  const p = { x: BROW[0], z: BROW[1], y: 0, ry: FACE.pz, blink: blink(t, .7), talk: talk('irmao', t) * .7, tb: t + 1, worry: 1, tear: .7, head: [0, .3, 0] };
  if (t < SC('janela').t0 - .2) { p.x = AWAY.x + 5; return p; }
  if (t > wt('l13', 'encostou') - .2) { p.z = BROW[1] + .16 * eio(seg(t, wt('l13', 'encostou') - .2, wt('l13', 'testa') + .3)); p.head = [0, .1, 0]; }
  if (t > L0('l22')) { p.z = BROW[1] + .1; p.head = [0, .1, 0]; const th = wt('l22', 'estendeu') - .2; if (t > th) p.arm = { R: [lerp(.1, 1.55, eo(seg(t, th, th + .7))), 0] }; }
  return p;
}
function momPose(t) {
  const p = { x: MOMP[0], z: MOMP[1], y: 0, ry: FACE.pz + .2, blink: blink(t, 2.1), worry: 1, head: [0, .45, 0], arm: { L: [1.1, .5], R: [1.1, -.5] } };
  if (t < SC('janela').t0 - .2) p.x = AWAY.x + 10;
  return p;
}
function liaMomPose(t) { const p = { x: .3, z: -19, y: 0, ry: FACE.pz, arm: { L: [.1, .1], R: [.1, -.1] } }; if (t < L0('l27') - .2 || t > L1('l28') + .3) p.x = AWAY.x + 20; return p; }

// ---------------------------------------------------------------- shots
const v = (x, y, z) => new THREE.Vector3(x, y, z);
function kidHead(K) { const p = new THREE.Vector3(); K.neck.getWorldPosition(p); return p.add(v(0, .4 * K.root.scale.y / .7, 0)); }
function cu(K, dist = 1.9, yaw = .5, dy = .05, fov = 34) { dist *= 1.4; const h = kidHead(K), a = K.root.rotation.y + yaw; return { p: v(h.x + Math.sin(a) * dist, h.y + dy, h.z + Math.cos(a) * dist), l: h.clone().add(v(0, -.04, 0)), fov }; }
let SHOTS;
function buildShots() {
  const s = id => SC(id), w = wt;
  SHOTS = [
    // hook: the far door opens
    [0, (t, u) => ({ p: v(1.3, 1.7, -37.9 + u * .4), l: v(-.1, 1.05, -42), fov: 40 })],
    [L0('l01') + .9, (t, u) => ({ p: v(.4, 1.3, -38.6), l: v(0, 1.1, -42), fov: 42 })],
    [L0('l02') - .1, (t, u) => ({ p: v(KX + .62, 1.55, 1.15), l: v(KX + .5, .83, .4), fov: 30 - u * 6 })],
    // cozinha
    [s('cozinha').t0, (t, u) => ({ p: v(KX - 1.4, 1.7, 3.6), l: v(KX + 2.2, 1.0, .6), fov: 48 })],
    [w('l04', 'cozinha') - .2, (t, u) => ({ p: v(KX + 1.8, 1.9, 4.2 - u), l: v(KX - .2, 1.0, -1.5), fov: 50 })],
    [w('l04', 'relógio') - .2, (t, u) => ({ p: v(KX - .1, 1.9, .2), l: v(KX - 2.88, 2.05, -.3), fov: 30 - u * 6 })],
    [w('l04', 'mesa') - .25, (t, u) => ({ p: v(KX + 1.1, 1.6, 1.6), l: v(KX + .5, .83, .4), fov: 34 })],
    // audio
    [s('audio').t0, (t, u) => ({ p: v(KX + .6, 1.5, 1.05), l: v(KX + .5, .84, .4), fov: 30 })],
    [L0('l06') - .1, (t, u) => ({ p: v(KX + 1.9, 1.25, 1.1), l: v(KX + .5, .85, .7), fov: 40 })],
    [L0('l08') - .1, (t, u) => cu(caio, 1.8 - u * .3, .45, .3, 32)],
    // quintal
    [s('quintal').t0, (t, u) => ({ p: v(KX + 1.3, 1.25, 2.9), l: v(KX + .2, 1.0, -2.8), fov: 46 })],
    [L0('l10') - .1, (t, u) => cu(caio, 1.8, .9, 0, 32)],
    // janela
    [s('janela').t0, (t, u) => ({ p: v(KX + 1.5, 1.4, 2.6), l: v(KX + .1, .9, -2.4), fov: 48 })],
    [w('l11', 'Viu') - .2, (t, u) => ({ p: v(KX + 1.15, 1.05, -1.35), l: kidHead(bro).add(v(0, -.12, 0)), fov: 36 - u * 3 })],
    [w('l11', 'Atrás') - .2, (t, u) => ({ p: v(KX + .9, 1.4, -.5), l: v(KX - .3, 1.15, -4.0), fov: 40 })],
    [L0('l12') - .1, (t, u) => ({ p: v(KX + 1.9, 1.2, -1.2), l: v(KX - .1, 1.05, -2.9), fov: 42 })],
    [L0('l13') - .1, (t, u) => ({ p: v(KX + 1.15, 1.0, -1.4 - u * .15), l: kidHead(bro).add(v(0, -.12, 0)), fov: 32 })],
    // lia
    [s('lia').t0, (t, u) => ({ p: v(KX + 2.4, 1.6, 3.2), l: v(KX + 1.3, .7, -.8), fov: 48 })],
    [L0('l16') - .1, (t, u) => cu(lia, 1.8, .6, .05, 34)],
    [L0('l17') - .1, (t, u) => cu(caio, 1.8, -.6, .05, 34)],
    [L0('l18') - .1, (t, u) => cu(lia, 1.6, .6, .05, 32)],
    // nome
    [s('nome').t0, (t, u) => cu(caio, 1.8, -.6, .05, 34)],
    [L0('l21') - .1, (t, u) => cu(lia, 1.8 - u * .3, .6, .05, 34)],
    [L1('l21') + .2, (t, u) => ({ p: v(KX - .1, 1.9, .2), l: v(KX - 2.88, 2.05, -.3), fov: 26 })],
    // escolha
    [s('escolha').t0, (t, u) => ({ p: v(KX - 1.3, 1.3, -.9), l: v(KX + .1, 1.1, -3.0), fov: 42 })],
    [L0('l23') - .1, (t, u) => ({ p: v(KX + .3, 2.3, -1.2), l: v(KX + .3, .5, -2.4), fov: 34 })],
    [L0('l24') - .1, (t, u) => ({ p: v(KX + .9, 1.4, 1.5), l: v(KX + .95, .8, -1.85), fov: 48 })],
    [L0('l25') - .1, (t, u) => ({ p: v(KX + .5, 1.25, .9), l: kidHead(caio).add(v(.2, -.15, 0)), fov: 30 })],
    // some
    [s('some').t0, (t, u) => ({ p: v(KX + .3, 2.4, 1.6), l: v(KX + 1.2, .3, -1.6), fov: 44 })],
    [wt('l26', 'segundo') - .3, (t, u) => ({ p: v(.2, 1.1, -1.3), l: v(2.75, .5, -2.6), fov: 38 - u * 6 })],
    [wt('l26', 'acordado') + .1, (t, u) => ({ p: v(KX - .6, 1.4, 1.8), l: v(KX + 1.6, .8, -.6), fov: 46 })],
    // mãe
    [s('mae').t0, (t, u) => ({ p: v(.4, 1.2, -6 - u * 2), l: v(.3, 1.2, -19), fov: 40 })],
    [L0('l29') - .1, (t, u) => cu(lia, 1.7, -.2, .05, 33)],
    [L1('l29') + .3, (t, u) => ({ p: v(KX + 1.4, 1.2, -1.0), l: v(KX - .1, 1.05, -3.1), fov: 40 })],
    [L1('l29') + .9, (t, u) => ({ p: v(KX - 1.2, 1.5, 2.6), l: v(KX + 1.8, .8, .2), fov: 46 })],
    // cta: the window with the hand, darker
    [s('cta').t0, (t, u) => ({ p: v(KX + .2, 1.2, .6 - u), l: v(KX, 1.1, -3.0), fov: 44 })],
  ];
}
function shotAt(t) { let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1][0]) i++; const a = SHOTS[i][0], b = i < SHOTS.length - 1 ? SHOTS[i + 1][0] : DUR; return { i, ...SHOTS[i][1](t, clamp((t - a) / (b - a))), t0: a }; }

// ---------------------------------------------------------------- world state
let phoneKey = '';
function worldAt(t, inKitchen) {
  // fog: the street's, or a thin dark haze in the kitchen
  if (inKitchen) { scene.fog.color.copy(KFOG); scene.background.copy(KFOG); scene.fog.density = .03; }
  else { scene.fog.color.copy(FOGC); scene.background.copy(FOGC); scene.fog.density = t >= SC('mae').t0 && t < SC('mae').t1 ? .05 : .03; }
  // the far door in the hook: the knob turns, the door swings in, warm light behind it
  Wd.fknob.rotation.z = -.6 * eio(seg(t, 0, .4)); Wd.fhinge.rotation.y = 1.5 * eio(seg(t, .45, 2.0)); Wd.fglow.visible = t > .45;
  Wd.cold.intensity = 6;
  // the clock: 3:17, then 3:18 in the pause
  const tick = t > L1('l21') + .9 ? 1 : 0, mins = 17 + tick;
  KT.min.rotation.z = -mins / 60 * Math.PI * 2; KT.hour.rotation.z = -(3 + mins / 60) / 12 * Math.PI * 2;
  const playing = (t > L0('l01') && t < L1('l01')) || (t > L0('l05') && t < L1('l05')) || (t > L0('l07') && t < L1('l07'));
  const key = `${mins}-${playing ? Math.floor(t * 12) : 0}`; if (key !== phoneKey) { drawPhone(KT, `3:${mins}`, playing ? t : 0); phoneKey = key; }
  // the hanging bulb breathes; it dips at the shocks
  KT.light.intensity = 7 * (1 - .5 * (t > L0('l26') && t < L0('l26') + 3 ? Math.abs(Math.sin(t * 20)) : 0));
  // the window opens by itself
  const wo = eio(seg(t, L0('l22') + .1, L0('l22') + 1.6)); KT.panes[0].rotation.y = -1.4 * wo; KT.panes[1].rotation.y = 1.4 * wo;
  // the floor under Lia falls away (and stays gone)
  const f0 = wt('l26', 'desapareceu') - .25, cx = KX + 1.2 - KX, cz = -1.75;
  for (const tm of KT.tiles) { const h = tm.userData.home, d = Math.hypot(h.x - cx, h.z - cz); const u = seg(t, f0 + d * .25, f0 + d * .25 + .9);
    if (d < 1.35) { tm.position.set(h.x, h.y - 6 * u * u, h.z); tm.rotation.set(u * 2.1, 0, u * 1.3); tm.visible = u < 1; } else { tm.position.copy(h); tm.rotation.set(0, 0, 0); tm.visible = true; } }
  for (const m of Wd.mist) { const [x, z, r] = m.userData.v; m.position.x = x + Math.sin(t * .15 + r * 6) * 1.5; }
}

// ---------------------------------------------------------------- overlay
let AV, TX = [];
function note(id, text, x0, y0, x1, y1) { TX.push({ id, text, x0, y0, x1, y1 }); }
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function brand() {
  const y = 128; g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 4;
  g.fillStyle = 'rgba(24,20,38,.78)'; rr(150, y - 44, 790, 88, 44); g.fill(); g.shadowColor = 'transparent'; g.strokeStyle = '#e6c27a'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#f6e7c4'; g.font = '600 46px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HISTÓRIAS E CRENÇAS', 560, y + 2); note('brand', 'HISTÓRIAS E CRENÇAS', 330, y - 24, 790, y + 24);
  const cx = 128, cy = y, r = 84; g.fillStyle = '#e6c27a'; g.beginPath(); g.arc(cx, cy, r + 8, 0, Math.PI * 2); g.fill();
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip(); if (AV) g.drawImage(AV, 25, 18, 360, 360, cx - r, cy - r, 2 * r, 2 * r); g.restore();
  g.strokeStyle = '#1a1726'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); g.restore();
}
const WHO = { nar: '#ffffff', caio: '#9cc8ff', lia: '#ffe07a', fone: '#bfeaff', irmao: '#ffb8a8', maelia: '#d9b8ff' };
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
function overlay(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); TX = [];
  // a white blink for the street flash; the dry cut to black before the vote
  const c0 = wt('l26', 'segundo') - .3, c1 = wt('l26', 'acordado') + .1;
  const wf = Math.max(0, 1 - Math.abs(t - c0) / .25) + Math.max(0, 1 - Math.abs(t - c1) / .25); if (wf > 0) { g.fillStyle = `rgba(230,240,255,${Math.min(1, wf)})`; g.fillRect(0, 0, W, H); }
  if (t >= SC('mae').t1 - .25 && t < SC('cta').t0) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  const vg = g.createRadialGradient(540, 900, 500, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,5,15,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  card('parte2', 'PARTE 2', t, .35, 3.0, 470, { px: 84, bg: '#f6efe0' });
  card('votou', 'VOCÊS VOTARAM: ABRE', t, L0('l03') - .1, wt('l04', 'Do') + .9, 470, { px: 70, bg: '#5fd08a' });
  card('h317', '3h17', t, wt('l04', '3h17') - .25, wt('l04', 'mesa') - .3, 470, { px: 110, bg: '#f6efe0' });
  card('h318', '3h18', t, L1('l21') + .85, L0('l22') + 1.2, 470, { px: 130, bg: '#ff7a6b', rot: 3 });
  if (t >= SC('cta').t0) {
    g.save(); g.fillStyle = `rgba(10,10,20,${.45 * clamp((t - SC('cta').t0) / .5)})`; g.fillRect(0, 0, W, H); g.restore();
    card('q', 'ESPERA O IRMÃO OU VAI COM A LIA?', t, L0('l30') - .1, DUR + 1, 560, { px: 54, bg: '#f6efe0', rot: -2 });
    card('irmao', 'IRMÃO', t, wt('l30', 'IRMÃO') - .15, DUR + 1, 820, { px: 120, bg: '#ff8a6b', rot: -5 });
    card('lia', 'LIA', t, wt('l30', 'LIA') - .15, DUR + 1, 1030, { px: 120, bg: '#ffe07a', rot: 4 });
    card('parte3', 'O VOTO DECIDE A PARTE 3', t, wt('l30', 'voto') - .2, DUR + 1, 1260, { px: 56, bg: '#9cc8ff', rot: -1 });
    const k = clamp((t - (wt('l30', 'Comenta') - .1)) / .25); if (k > 0) { g.save(); g.globalAlpha = k; g.font = '600 52px Fredoka'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.lineWidth = 10; g.strokeStyle = 'rgba(14,12,24,.9)';
      const b = Math.sin(t * 7) * 8; g.strokeText('comenta aqui embaixo ↓', 540, 1400 + b); g.fillText('comenta aqui embaixo ↓', 540, 1400 + b); g.restore(); if (k >= 1) note('comenta', 'comenta aqui embaixo', 300, 1370, 780, 1430); }
  }
  brand(); caption(t);
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  caio.pose(caioPose(t)); lia.pose(liaPose(t)); bro.pose(broPose(t)); mom.pose(momPose(t)); liaMom.pose(liaMomPose(t));
  scene.updateMatrixWorld(true);
  const sh = shotAt(t); if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); sh.p = v(c[0], c[1], c[2]); sh.l = v(c[3], c[4], c[5]); sh.fov = c[6] || 50; }
  const inKitchen = sh.p.x < -100; worldAt(t, inKitchen);
  camera.position.copy(sh.p); camera.lookAt(sh.l); camera.fov = sh.fov; camera.updateProjectionMatrix();
  moon.position.set(camera.position.x + 6, 12, camera.position.z + 8); moon.target.position.set(camera.position.x, 0, camera.position.z - 4);
  hemi.intensity = inKitchen ? 1.1 : 1.6;
  renderer.render(scene, camera); overlay(t);
}
function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o }), w = wt;
  for (const l of LINES) E(L0(l.id), 'vo', { id: l.id, who: l.who });
  E(0, 'knob'); E(.45, 'creakdoor'); E(.35, 'pop'); E(L0('l03') - .1, 'pop'); E(s0('cozinha') + .3, 'steps', { d: w('l04', 'cozinha') - s0('cozinha') }); E(w('l04', '3h17') - .25, 'tick', { d: 3 }); E(w('l04', '3h17') - .25, 'pop');
  E(w('l06', 'play') - .2, 'tap'); E(L0('l09') - .2, 'heart'); E(L0('l11'), 'run', { d: 1.1 });
  E(w('l12', 'bateu') - .2, 'glassknock'); E(L0('l15'), 'steps', { d: 2.0, soft: 1 });
  E(L1('l21') + .85, 'clocktick'); E(L1('l21') + .85, 'pop'); E(L0('l22') + .1, 'windowcreak'); E(w('l23', 'soltar') - .2, 'heart');
  E(w('l26', 'desapareceu') - .25, 'fall', { d: 1.6 }); E(w('l26', 'segundo') - .3, 'flash'); E(w('l26', 'acordado') + .1, 'flash');
  E(L0('l27') - .1, 'whoosh'); E(L1('l29') + .5, 'steps', { d: 1.5, soft: 1 }); E(SC('mae').t1 - .25, 'cutblack');
  for (const word of ['IRMÃO', 'LIA', 'voto']) E(w('l30', word) - .15, 'pop'); E(L0('l30') - .1, 'pop');
  return ev.sort((a, b) => a.t - b.t);
}
const s0 = id => SC(id).t0;
(async () => {
  TL = await (await fetch('timeline.json')).json(); ENV = await (await fetch('env.json')).json(); LINES = await (await fetch('lines.json')).json(); DUR = TL.dur;
  await Promise.all(['600 50px Fredoka', '500 30px Fredoka', '96px "Lilita One"'].map(f => document.fonts.load(f, 'AÃÉÍÓÇáãéíóç0123456789ª↓:')));
  const av = new Image(); av.src = 'brand/avatar.jpg'; await av.decode().catch(() => {}); AV = av.naturalWidth ? av : null;
  buildShots();
  window.DUR = DUR; window.render = render; window.EV = events();
  window.TEXTS = t => { render(t); return TX.map(o => ({ ...o })); };
  render(Q.get('t') ? +Q.get('t') : 1); window.READY = true;
})();
