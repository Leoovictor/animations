// Umbral — the 3D toon world: a foggy street of the Umbral, Caio's lit house, a wall, a curb, the far door, the smoke corridor; two round kids.
// Toon look: MeshToonMaterial with a 3-step ramp + an inverted-hull outline on everything that matters.
import * as THREE from 'three';

export const RAMP = (() => { const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const MATS = new Map();
export function toon(col, o = {}) { const k = col + JSON.stringify(o); if (!MATS.has(k)) MATS.set(k, new THREE.MeshToonMaterial({ color: col, gradientMap: RAMP, ...o })); return MATS.get(k); }
export function flat(col, o = {}) { return new THREE.MeshBasicMaterial({ color: col, ...o }); }
const OUT = new Map();
export const INK = '#1a1726';
function outlineMat(w) {
  if (OUT.has(w)) return OUT.get(w);
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, fog: true });
  m.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${w.toFixed(4)};`); };
  OUT.set(w, m); return m;
}
// a mesh with its outline (inverted hull)
export function M(geo, mat, w = .02, cast = true) {
  const g = new THREE.Group(), m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; g.add(m);
  if (w > 0) { const o = new THREE.Mesh(geo, outlineMat(w)); g.add(o); }
  g.userData.mesh = m; return g;
}
const sph = (r, ws = 28, hs = 20) => new THREE.SphereGeometry(r, ws, hs);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 16);
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

// ---------------------------------------------------------------- a kid: big round head, dot eyes, line mouth, stubby limbs
export function makeKid(o) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const skin = toon(o.skin), shirt = toon(o.shirt), pants = toon(o.pants), hair = toon(o.hair), black = flat('#15121c');
  // legs (pivot at the hip), bare feet
  const legs = {};
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); at(p, s * .1, .34, 0); body.add(p);
    p.add(at(M(cap(.075, .16), o.dress ? skin : pants), 0, -.13, 0)); p.add(at(M(sph(.085), skin), 0, -.29, .04));
    legs[s] = p;
  }
  // torso (shirt) or dress
  const torso = new THREE.Group(); at(torso, 0, .34, 0); body.add(torso);
  if (o.dress) torso.add(at(M(new THREE.CylinderGeometry(.17, .3, .4, 24), shirt), 0, .17, 0));
  else { torso.add(at(M(cap(.2, .14), shirt), 0, .2, 0)); torso.add(at(M(new THREE.CylinderGeometry(.205, .21, .12, 24), pants), 0, .04, 0)); }
  // arms (pivot at the shoulder)
  const arms = {};
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); at(p, s * .2, .32, 0); torso.add(p);
    p.add(at(M(cap(.06, .18), o.sleeveless ? skin : shirt), 0, -.12, 0)); const hand = at(M(sph(.075), skin), 0, -.27, 0); p.add(hand);
    arms[s] = p; p.userData.hand = hand;
  }
  // head (pivot at the neck)
  const neck = new THREE.Group(); at(neck, 0, .56, 0); torso.add(neck);
  const head = at(M(sph(.42, 40, 30), skin, .025), 0, .4, 0); head.scale.set(1, .94, .96); neck.add(head);
  const face = new THREE.Group(); at(face, 0, .4, 0); neck.add(face);
  const eyes = {}; for (const s of [-1, 1]) { const e = new THREE.Mesh(sph(.05, 16, 12), black); at(e, s * .145, .03, .385); e.scale.set(1, 1.25, .5); face.add(e); const hl = new THREE.Mesh(sph(.014, 8, 6), flat('#ffffff')); at(hl, .016, .025, .03); e.add(hl); eyes[s] = e; }
  const brows = {}; for (const s of [-1, 1]) { const b = new THREE.Mesh(box(.1, .022, .02), black); at(b, s * .145, .15, .37); face.add(b); brows[s] = b; }
  const mouth = new THREE.Mesh(sph(.06, 20, 12), flat('#3a1820')); at(mouth, 0, -.15, .392); mouth.scale.set(1, .18, .35); face.add(mouth);
  const blush = []; for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(.045, 16), flat(o.blush || '#f29a8c', { transparent: true, opacity: .45 })); at(b, s * .25, -.06, .35); b.lookAt(s * 2, -.3, 3); face.add(b); blush.push(b); }
  const tears = {}; for (const s of [-1, 1]) { const t = new THREE.Mesh(sph(.022, 10, 8), flat('#bfe6ff')); at(t, s * .145, -.04, .39); t.visible = false; face.add(t); tears[s] = t; }
  // hair
  const hg = new THREE.Group(); at(hg, 0, .4, 0); neck.add(hg);
  const capG = new THREE.SphereGeometry(.445, 40, 20, 0, Math.PI * 2, 0, Math.PI * (o.hairCover || .36));
  const hc = M(capG, hair, .022); hc.rotation.x = -.35; hg.add(hc);
  if (o.tuft) { const t = M(new THREE.ConeGeometry(.08, .2, 12), hair, .015); at(t, .05, .45, .05); t.rotation.z = -.5; hg.add(t); }
  if (o.buns) for (const s of [-1, 1]) hg.add(at(M(sph(.13), hair, .02), s * .38, .18, -.08));
  if (o.bangs) { const b = M(new THREE.SphereGeometry(.45, 30, 10, -1.2, 2.4, .5, .5), hair, .015); b.rotation.x = -.1; hg.add(b); }
  if (o.adult) { for (const s of [-1, 1]) { legs[s].scale.y = 1.9; } torso.scale.set(1.05, 1.35, 1.05); torso.position.y = .34 * 1.9; legs[-1].position.y = legs[1].position.y = .34 * 1.9; }
  if (o.longHair) { const lh = M(new THREE.SphereGeometry(.46, 32, 20, Math.PI * 1.05, Math.PI * .9, .2, Math.PI * .6), hair, .02); hg.add(lh); }
  if (o.shirtProp) { const sp = new THREE.Group(); at(sp, 0, .25, .24); torso.add(sp); const tm = toon(o.shirtProp);
    sp.add(M(box(.34, .3, .05), tm, .012)); for (const s of [-1, 1]) { const sl = M(box(.14, .1, .05), tm, .01); at(sl, s * .2, .1, 0); sl.rotation.z = s * -.5; sp.add(sl); } }
  root.traverse(c => { if (c.isMesh) c.frustumCulled = false; }); root.scale.setScalar(o.scale || .7);
  const K = { root, body, torso, neck, legs, arms, eyes, brows, mouth, tears, face };
  K.pose = p => posKid(K, p); return K;
}
// pose: { x, z, y, ry, walk (phase rad), run 0..1, move 0..1, sit 0..1, arm: {L:[fwd, out], R:[fwd, out]}, head: [yaw, pitch, roll], blink 0..1, wide 0..1,
//         worry 0..1, talk 0..1, smile -1..1, tear 0..1, pant 0..1, lean, crouch }
function posKid(K, p) {
  const mv = p.move || 0, run = p.run || 0, ph = p.walk || 0, sit = p.sit || 0, swing = (.55 + .5 * run) * mv;
  K.root.position.set(p.x || 0, (p.y || 0), p.z || 0); K.root.rotation.y = p.ry || 0;
  const bob = Math.abs(Math.sin(ph)) * (.04 + .06 * run) * mv + Math.sin((p.tb || 0) * 9) * .015 * (p.pant || 0);
  K.body.position.y = bob - sit * .2 - (p.crouch || 0) * .12; K.body.rotation.x = (.08 + .25 * run) * mv + (p.lean || 0) + (p.pant || 0) * .35;
  for (const s of [-1, 1]) {
    K.legs[s].rotation.x = -Math.sin(ph) * s * swing * .9 - sit * 1.45; K.legs[s].rotation.z = 0;
    const a = p.arm && p.arm[s < 0 ? 'L' : 'R'];
    K.arms[s].rotation.x = a ? -a[0] : Math.sin(ph) * s * swing * 1.1 - sit * .5;
    K.arms[s].rotation.z = s * (a ? (a[1] || 0) : .12 + .2 * run * mv);
  }
  const h = p.head || [0, 0, 0]; K.neck.rotation.set(h[1] || 0, h[0] || 0, h[2] || 0);
  const bl = 1 - (p.blink || 0), wd = 1 + .35 * (p.wide || 0);
  for (const s of [-1, 1]) { K.eyes[s].scale.set(wd, 1.25 * wd * Math.max(.08, bl), .5); K.brows[s].rotation.z = s * -.45 * (p.worry || 0) + s * .3 * (p.angry || 0); K.brows[s].position.y = .15 + .03 * (p.wide || 0) + .015 * (p.worry || 0); }
  const tk = clamp(p.talk || 0, 0, 1), sm = p.smile || 0;
  K.mouth.scale.set(1 + .2 * sm - .15 * tk, .16 + .9 * tk + .1 * Math.max(0, -sm) * 0, .35); K.mouth.position.y = -.15 + .01 * sm;
  for (const s of [-1, 1]) { K.tears[s].visible = (p.tear || 0) > 0; K.tears[s].position.y = -.04 - .1 * (p.tear || 0); }
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- big hands for close-ups
export function makeHand(skin, k = 1) {
  const g = new THREE.Group(), m = toon(skin);
  g.add(M(new THREE.SphereGeometry(.22, 24, 18), m, .012)); g.children[0].scale.set(1, .5, 1.1);
  for (let i = 0; i < 4; i++) { const f = M(cap(.05, .14), m, .01); at(f, -.13 + i * .087, 0, .26); f.rotation.x = Math.PI / 2; g.add(f); }
  const th = M(cap(.055, .12), m, .01); at(th, .2, 0, .06); th.rotation.set(Math.PI / 2, 0, -.9); g.add(th);
  g.scale.setScalar(k); return g;
}

// ---------------------------------------------------------------- the street
const HOUSE_COLS = [['#6b6886', '#3d3450'], ['#5d6b84', '#38394f'], ['#76697c', '#463a4e'], ['#62707a', '#3a3e4c'], ['#6f6680', '#40354a']];
function house(w, h, d, wall, roof, windows) {   // front face is +x... built facing +z, then rotated by the caller
  const g = new THREE.Group();
  g.add(at(M(box(w, h, d), toon(wall), .03), 0, h / 2, 0));
  const tri = new THREE.Shape(); tri.moveTo(-w / 2 - .25, 0); tri.lineTo(w / 2 + .25, 0); tri.lineTo(0, h * .55); tri.closePath();
  const rg = new THREE.ExtrudeGeometry(tri, { depth: d + .4, bevelEnabled: false }); rg.translate(0, 0, -(d + .4) / 2);
  g.add(at(M(rg, toon(roof), .03), 0, h, 0));
  g.add(at(M(box(.35, .9, .35), toon('#4a4256'), .02), w * .25, h + h * .45, -d * .2));
  for (const [x, y, lit] of windows) { const win = new THREE.Mesh(box(.7, .8, .06), lit ? flat('#ffc879') : toon('#243049')); at(win, x, y, d / 2 + .02); g.add(win); const fr = M(box(.84, .94, .04), toon('#3a3346'), 0); at(fr, x, y, d / 2 + .005); g.add(fr); g.userData[lit ? 'lit' : 'dark'] = (g.userData[lit ? 'lit' : 'dark'] || []).concat(win); }
  return g;
}
export function buildWorld(scene) {
  const W = {};
  // ground: road, sidewalks, curbs
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 140), toon('#3a3d52')); road.rotation.x = -Math.PI / 2; at(road, 0, 0, -40); road.receiveShadow = true; scene.add(road);
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 140), toon('#4f536a')); sw.rotation.x = -Math.PI / 2; at(sw, s * 4.2, .16, -40); sw.receiveShadow = true; scene.add(sw);
    const cb = M(box(.25, .16, 140), toon('#666a82'), .015, false); at(cb, s * 3.05, .08, -40); scene.add(cb);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 140), toon('#2c2c3e')); back.rotation.x = -Math.PI / 2; at(back, s * 25, .15, -40); scene.add(back);
  }
  // cobble hints on the road
  const cob = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .02, .3), toon('#44485e'), 500); const r = mulberry(5), mtx = new THREE.Matrix4();
  for (let i = 0; i < 500; i++) { mtx.makeTranslation((r() - .5) * 5.6, .01, 8 - r() * 80); cob.setMatrixAt(i, mtx); } scene.add(cob);
  // houses on both sides; Caio's house left at z = 0, its door facing +x
  W.houses = [];
  const rr = mulberry(11);
  for (const s of [-1, 1]) for (let i = -2; i < 14; i++) {
    const z = -i * 6.2, isCaio = s < 0 && i === 0, isWall = s < 0 && i === 1;
    if (isWall) continue;
    const [wall, roof] = isCaio ? ['#8a6e68', '#5b3b3c'] : HOUSE_COLS[Math.floor(rr() * HOUSE_COLS.length)];
    const h = 3 + rr() * .9, wd = 5.2;
    const hs = house(wd, h, 5, wall, roof, [[-1.4, 1.6, isCaio], [1.4, 1.6, isCaio], [-1.4, h - .5 + .2, false], [1.4, h - .5 + .2, isCaio]]);
    hs.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2; at(hs, s * 8.1, .15, z); scene.add(hs); W.houses.push(hs);
    if (isCaio) W.caioHouse = hs;
  }
  // Caio's door (on the house's +z face, which faces the street) with a knob and a small porch lamp
  const door = new THREE.Group(); at(door, -5.58, .15, 0); door.rotation.y = Math.PI / 2; scene.add(door);
  door.add(at(M(box(1.1, 2.1, .12), toon('#5a3a2a'), .025), 0, 1.05, 0));
  for (const [y, h] of [[1.55, .7], [.6, .7]]) door.add(at(M(box(.8, h, .03), toon('#6b4632'), 0, false), 0, y, .07));
  const knob = at(M(sph(.065), toon('#e0b453'), .012), .38, .74, .12); door.add(knob);
  door.add(at(new THREE.Mesh(box(.9, .12, .04), flat('#ffc879')), 0, 2.2, .02));   // light under the transom
  W.door = door; W.knob = knob;
  const lamp = at(new THREE.Mesh(sph(.12), flat('#ffd79a')), -5.4, 2.7, .9); scene.add(lamp); W.lamp = lamp;
  W.warm = new THREE.PointLight('#ffb36b', 9, 10, 1.4); at(W.warm, -4.4, 2.3, 0); scene.add(W.warm);
  // the wall (between the houses), and its scratches: one fresh, six old ones under it
  const wall = M(box(.5, 2.2, 6), toon('#6f6b78'), .03); at(wall, -5.6, 1.25, -6.2); scene.add(wall);
  const cap2 = M(box(.7, .2, 6.2), toon('#5b5766'), .02); at(cap2, -5.6, 2.42, -6.2); scene.add(cap2);
  const bricks = new THREE.InstancedMesh(box(.02, .22, .6), toon('#5f5b6a'), 60); for (let i = 0; i < 60; i++) { mtx.makeTranslation(-5.34, .4 + (i % 8) * .26, -8.9 + Math.floor(i / 8) * .75 + (i % 2) * .35); bricks.setMatrixAt(i, mtx); } scene.add(bricks);
  W.scratches = [];
  for (let i = 0; i < 7; i++) {
    const sc = new THREE.Mesh(box(.02, .03, .5), flat('#e9e4f2')); const y = i === 0 ? .95 : .82 - i * .085;
    at(sc, -5.33, y, -6.05 + (i % 2) * .05); sc.scale.z = .7; sc.rotation.x = -.18 + (i % 3) * .07; scene.add(sc); W.scratches.push(sc);
  }
  // the far door at the end of the street (hidden by fog until the fog drops): a narrow house facing the street, cold light
  const far = house(5.5, 3.8, 4, '#56617a', '#323547', [[-1.6, 2.6, false], [1.6, 2.6, false]]); at(far, 0, .15, -44); scene.add(far); W.farHouse = far;
  const fframe = new THREE.Group(); at(fframe, 0, .15, -41.9); scene.add(fframe);
  const fdoor = new THREE.Group(); at(fdoor, -.6, 0, 0); fframe.add(fdoor); W.fhinge = fdoor;
  fdoor.add(at(M(box(1.2, 2.3, .14), toon('#3b3f57'), .03), .6, 1.15, 0));
  const glow = new THREE.Mesh(box(1.2, 2.3, .02), flat('#ffd9a0')); at(glow, 0, 1.15, -.12); fframe.add(glow); W.fglow = glow;
  const fknob = new THREE.Group(); at(fknob, 1.02, .9, .1); fdoor.add(fknob); fknob.add(at(M(box(.22, .05, .06), toon('#c9d6e6'), .012), .08, 0, .04)); fknob.add(M(sph(.05), toon('#c9d6e6'), .01));
  fframe.add(at(new THREE.Mesh(box(1.0, .05, .05), flat('#bfeaff')), 0, .03, .1));   // a line of cold light under it
  W.fdoor = fframe; W.fknob = fknob;
  W.cold = new THREE.PointLight('#9fdcff', 0, 9, 1.4); at(W.cold, 0, 2.2, -40.6); scene.add(W.cold);
  // street lamps, all dead (dark glass), for silhouettes in the fog
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const pz = -11 - i * 9 + (s > 0 ? 6 : 0); const p = M(new THREE.CylinderGeometry(.06, .08, 3.6, 10), toon('#2d2b3a'), .015); at(p, s * 3.5, 1.95, pz); scene.add(p); const hd = M(box(.4, .3, .4), toon('#2d2b3a'), .015); at(hd, s * 3.3, 3.8, pz); scene.add(hd); }
  // a stone (Caio's), a small rock in the gutter
  W.stone = M(new THREE.DodecahedronGeometry(.08), toon('#8b8794'), .012); scene.add(W.stone);
  // low mist cards drifting along the street
  W.mist = []; const mt = mistTex();
  for (let i = 0; i < 46; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, color: '#aab4d0', transparent: true, opacity: .22, depthWrite: false, fog: true })); const z = 8 - (i / 46) * 60, x = (rr() - .5) * 12; s.scale.set(6 + rr() * 5, 1.6 + rr() * 1.2, 1); at(s, x, .5 + rr() * .6, z); s.userData.v = [x, z, rr()]; scene.add(s); W.mist.push(s); }
  // the flashback corridor: far away from the street (x = 200)
  W.flash = new THREE.Group(); at(W.flash, 200, 0, 0); scene.add(W.flash);
  const fw = toon('#5a3b3b'), ff = toon('#3c2a2c');
  W.flash.add(at(M(box(3, .2, 16), ff, 0), 0, 0, -6)); for (const s of [-1, 1]) { const wl = at(M(box(.3, 3.2, 16), fw, .02), s * 1.5, 1.6, -6); W.flash.add(wl); if (s > 0) W.fwall = wl; } W.flash.add(at(M(box(3, .2, 16), ff, 0), 0, 3.2, -6));
  for (let i = 0; i < 4; i++) W.flash.add(at(M(box(.1, 2.1, 1), toon('#3b2420'), .02), -1.35, 1.05, -2 - i * 3.5));
  W.fire = new THREE.PointLight('#ff7a2e', 14, 14, 1.2); at(W.fire, 0, 2, -8); W.flash.add(W.fire);
  W.smoke = []; for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, color: '#463b40', transparent: true, opacity: .55, depthWrite: false })); s.scale.set(3 + rr() * 2, 2 + rr() * 1.5, 1); at(s, (rr() - .5) * 2.4, 1.6 + rr() * 1.6, -1 - rr() * 12); s.userData.v = [s.position.x, s.position.y, s.position.z, rr()]; W.flash.add(s); W.smoke.push(s); }
  return W;
}
// ---------------------------------------------------------------- the kitchen of Caio's house (x = -200): table, phone, clock, the window to the backyard
export function buildKitchen(scene) {
  const K = { root: new THREE.Group() }; at(K.root, -200, 0, 0); scene.add(K.root); const R = K.root;
  // floor tiles (each its own mesh: they fall away under Lia)
  K.tiles = []; for (let i = 0; i < 10; i++) for (let j = 0; j < 9; j++) { const tm = new THREE.Mesh(box(.6, .1, .6), toon((i + j) % 2 ? '#d8d2c2' : '#7f8aa6')); at(tm, -2.7 + i * .6, -.05, -2.7 + j * .6); tm.receiveShadow = true; tm.userData.home = tm.position.clone(); R.add(tm); K.tiles.push(tm); }
  const wallM = toon('#9a8f86'), wallD = toon('#857a72');
  // back wall with the window opening (x -.8..8, y .9..2.2)
  R.add(at(M(box(6, .55, .2), wallM, .02), 0, .275, -3)); R.add(at(M(box(6, 1.25, .2), wallM, .02), 0, 2.575, -3));
  R.add(at(M(box(2.2, 1.4, .2), wallM, .02), -1.9, 1.25, -3)); R.add(at(M(box(2.2, 1.4, .2), wallM, .02), 1.9, 1.25, -3));
  R.add(at(M(box(1.7, .1, .3), toon('#e8e2d6'), .015), 0, .53, -2.92));
  K.panes = []; for (const s of [-1, 1]) { const h = new THREE.Group(); at(h, s * .8, 1.25, -3.0); R.add(h);
    const gl = new THREE.Mesh(box(.66, 1.24, .02), new THREE.MeshBasicMaterial({ color: '#a9c6e6', transparent: true, opacity: .28 })); at(gl, -s * .4, 0, .02); h.add(gl);
    const fr2 = new THREE.Group(); for (const [w, hh, x, y] of [[.8, .08, 0, .66], [.8, .08, 0, -.66], [.08, 1.4, .36, 0], [.08, 1.4, -.36, 0]]) fr2.add(at(M(box(w, hh, .06), toon('#e8e2d6'), .012), x, y, 0)); at(fr2, -s * .4, 0, 0); h.add(fr2);
    K.panes.push(h); }
  for (const s of [-1, 1]) R.add(at(M(box(.2, 3.2, 6), wallD, .02), s * 3, 1.6, 0));
  // the doorway on the right wall (we came in through it): a gap with fog behind
  R.children[R.children.length - 1].visible = false;
  R.add(at(M(box(.2, 3.2, 3.6), wallD, .02), 3, 1.6, -1.2)); R.add(at(M(box(.2, 3.2, 1.2), wallD, .02), 3, 1.6, 2.4)); R.add(at(M(box(.2, .9, 1.2), wallD, .02), 3, 2.75, 1.2));
  // cabinets and a fridge on the left wall, a hanging bulb
  R.add(at(M(box(.7, .9, 2.4), toon('#6e7f9a'), .02), -2.55, .45, -1.4)); R.add(at(M(box(.75, .08, 2.45), toon('#d6cfc0'), .015), -2.55, .94, -1.4));
  R.add(at(M(box(.8, 1.9, .8), toon('#c9ccd6'), .02), -2.5, .95, 1.4));
  K.bulb = at(new THREE.Mesh(sph(.1), flat('#fff1c8')), .3, 2.6, -.2); R.add(K.bulb); R.add(at(M(new THREE.CylinderGeometry(.01, .01, .6, 6), toon('#222'), 0), .3, 2.95, -.2));
  K.light = new THREE.PointLight('#ffe2b0', 7, 9, 1.4); at(K.light, .3, 2.4, -.2); R.add(K.light);
  // the clock (left wall): hands set by the film
  const ck = new THREE.Group(); at(ck, -2.88, 2.05, -.3); ck.rotation.y = Math.PI / 2; R.add(ck);
  ck.add(M(new THREE.CylinderGeometry(.32, .32, .06, 32).rotateX(Math.PI / 2), toon('#f2ede2'), .02));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ck.add(at(new THREE.Mesh(box(.03, .07, .01), flat('#222')), Math.sin(a) * .26, Math.cos(a) * .26, .04)); }
  K.hour = new THREE.Group(); K.hour.add(at(new THREE.Mesh(box(.035, .17, .01), flat('#1a1726')), 0, .08, 0)); at(K.hour, 0, 0, .05); ck.add(K.hour);
  K.min = new THREE.Group(); K.min.add(at(new THREE.Mesh(box(.022, .25, .01), flat('#1a1726')), 0, .12, 0)); at(K.min, 0, 0, .055); ck.add(K.min);
  K.clock = ck;
  // table and the phone
  R.add(at(M(box(1.6, .08, 1.0), toon('#8a5a3e'), .02), .4, .78, .4)); for (const [x, z] of [[-.3, 0], [1.1, 0], [-.3, .8], [1.1, .8]]) R.add(at(M(box(.08, .78, .08), toon('#6b4430'), .01), x, .39, z));
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 512; K.phoneCanvas = pc; K.phoneTex = new THREE.CanvasTexture(pc); K.phoneTex.colorSpace = THREE.SRGBColorSpace;
  const ph = new THREE.Group(); at(ph, .5, .83, .4); ph.rotation.y = -.25; R.add(ph);
  ph.add(M(box(.2, .02, .38), toon('#1d1d24'), .008)); const scr = new THREE.Mesh(new THREE.PlaneGeometry(.18, .36), new THREE.MeshBasicMaterial({ map: K.phoneTex })); scr.rotation.x = -Math.PI / 2; at(scr, 0, .012, 0); ph.add(scr); K.phone = ph;
  // the backyard behind the window: grass, a fence, the night
  R.add(at(new THREE.Mesh(box(12, .1, 8), toon('#2f4a3a')), 0, -.05, -7.1)); for (let i = 0; i < 14; i++) R.add(at(M(box(.12, 1.2, .08), toon('#4a4038'), .012), -4 + i * .6, .6, -8.6));
  K.out = new THREE.PointLight('#9fb4e6', 4, 7, 1.4); at(K.out, 0, 2.2, -4.5); R.add(K.out);
  return K;
}
export function drawPhone(K, time, play) {
  const g = K.phoneCanvas.getContext('2d'); g.fillStyle = '#10131c'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#e8eefc'; g.font = '600 96px Fredoka'; g.textAlign = 'center'; g.fillText(time, 128, 150);
  g.fillStyle = '#2a3350'; g.beginPath(); g.roundRect(18, 250, 220, 110, 24); g.fill();
  g.fillStyle = '#7fd6a0'; g.beginPath(); g.arc(62, 305, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = '#10131c'; g.beginPath(); g.moveTo(54, 291); g.lineTo(54, 319); g.lineTo(76, 305); g.fill();
  for (let i = 0; i < 16; i++) { const h = 8 + Math.abs(Math.sin(i * 1.7 + play * 9)) * (play > 0 ? 34 : 10); g.fillStyle = '#bfe0ff'; g.fillRect(100 + i * 8.5, 305 - h / 2, 5, h); }
  g.fillStyle = '#c9d3ea'; g.font = '500 30px Fredoka'; g.fillText('Irmão', 128, 410);
  K.phoneTex.needsUpdate = true;
}
function mistTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; }
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
