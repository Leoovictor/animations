// Articulated character rig: a manifest of bones (image, parent, pivot, position, z, limits), forward kinematics,
// two-bone IK (the analytic solver from cisma/lib.js ik()), sockets and mirroring.
// Pure: compute(pose) depends only on the manifest and the pose, never on the previous frame (Opuscar renders out of order).
//
// Manifest (assets/characters/<name>/rig.json):
//   bones:   [{ id, parent|null, image, pivot:[px,py] (rotation point, image px), position:[x,y] (this pivot in the parent's frame,
//              i.e. relative to the parent's pivot, parent image px), z, limits:[minDeg,maxDeg]?, rest:deg? }]   parents before children
//   sockets: { name: { bone, at:[px,py] (image px of that bone) } }
// Pose: { root: { x, y, scale, flip, angle }, angles: { boneId: deg }, images: { boneId: imageKey }? }
// Mirroring: flip scales the whole character by −1 in x. The draw order (z) does not change: a mirrored side view keeps its
// near arm in front, exactly like a mirrored drawing.

// ---------------------------------------------------------------- 2D affine matrices [a, b, c, d, e, f] (canvas order)
export const I = [1, 0, 0, 1, 0, 0];
export const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
export const T = (x, y) => [1, 0, 0, 1, x, y];
export const R = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; };
export const S = (x, y = x) => [x, 0, 0, y, 0, 0];
export const ap = (M, [x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
export function inv(M) { const [a, b, c, d, e, f] = M, det = a * d - b * c; return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]; }
const D2R = Math.PI / 180;
const wrap = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a === -180 ? 180 : a; };
const clampDeg = (a, lim) => lim ? Math.max(lim[0], Math.min(lim[1], a)) : a;

// the Cisma two-bone solver: from S, reach Tg with segments L1, L2; bend ±1 picks the elbow side
export function ik2(Sp, Tg, L1, L2, bend = 1) {
  const len = Math.hypot(Tg[0] - Sp[0], Tg[1] - Sp[1]), d = Math.max(Math.abs(L1 - L2) + 1e-6, Math.min(len, L1 + L2 - 1e-6)), a = Math.atan2(Tg[1] - Sp[1], Tg[0] - Sp[0]);
  const th = a + bend * Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const E = [Sp[0] + L1 * Math.cos(th), Sp[1] + L1 * Math.sin(th)], H = [Sp[0] + d * Math.cos(a), Sp[1] + d * Math.sin(a)];
  return { E, H, ua: th, fa: Math.atan2(H[1] - E[1], H[0] - E[0]), reached: len <= L1 + L2 };
}

export class Rig {
  constructor(manifest) {
    this.m = manifest; this.bones = manifest.bones; this.byId = {};
    this.bones.forEach((b, i) => {
      if (this.byId[b.id]) throw new Error('duplicate bone ' + b.id);
      if (b.parent && !this.byId[b.parent]) throw new Error(`bone ${b.id}: parent ${b.parent} must come first`);
      this.byId[b.id] = { ...b, i };
    });
    this.order = [...this.bones].map((b, i) => ({ id: b.id, z: b.z ?? 0, i })).sort((a, b) => a.z - b.z || a.i - b.i).map(o => o.id);
    this.sockets = manifest.sockets || {};
  }
  angle(pose, id) { const b = this.byId[id]; return clampDeg(pose.angles?.[id] ?? b.rest ?? 0, b.limits); }
  root(pose) { const r = pose.root || {}, s = r.scale ?? 1; return mul(mul(T(r.x || 0, r.y || 0), R((r.angle || 0) * D2R)), S(s * (r.flip ? -1 : 1), s)); }
  // character-space matrices (image px, no root transform) and world matrices
  compute(pose) {
    const C = {}, Wm = {}, Rm = this.root(pose);
    for (const b of this.bones) { const local = mul(T(b.position[0], b.position[1]), R(this.angle(pose, b.id) * D2R)); C[b.id] = b.parent ? mul(C[b.parent], local) : local; Wm[b.id] = mul(Rm, C[b.id]); }
    return { C, W: Wm, root: Rm };
  }
  socket(name, pose, frame) {
    const s = this.sockets[name]; if (!s) throw new Error('no socket ' + name); const b = this.byId[s.bone], F = frame || this.compute(pose);
    return ap(F.W[s.bone], [s.at[0] - b.pivot[0], s.at[1] - b.pivot[1]]);
  }
  // solve a two-bone chain so socket `end` reaches the world point `target`; returns { angles: {upper, lower}, reached, error }
  solve(pose, upper, lower, end, target, bend = 1) {
    if (bend === 0) { const A = this.solve(pose, upper, lower, end, target, 1), B = this.solve(pose, upper, lower, end, target, -1); return A.error <= B.error ? A : B; }   // auto: the elbow side the limits allow
    const U = this.byId[upper], L = this.byId[lower], so = this.sockets[end];
    if (L.parent !== upper || so.bone !== lower) throw new Error(`IK chain ${upper}→${lower}→${end} is not a parent chain`);
    const F = this.compute(pose), tc = ap(inv(F.root), target);
    const Pm = U.parent ? F.C[U.parent] : I, pa = Math.atan2(Pm[1], Pm[0]), Sp = [F.C[upper][4], F.C[upper][5]];
    const v1 = L.position, v2 = [so.at[0] - L.pivot[0], so.at[1] - L.pivot[1]];
    const L1 = Math.hypot(...v1), L2 = Math.hypot(...v2), a1 = Math.atan2(v1[1], v1[0]), a2 = Math.atan2(v2[1], v2[0]);
    const k = ik2(Sp, tc, L1, L2, bend);
    const au = clampDeg(wrap((k.ua - pa - a1) / D2R), U.limits), al = clampDeg(wrap((k.fa - pa - au * D2R - a2) / D2R), L.limits);
    const angles = { ...pose.angles, [upper]: au, [lower]: al }, p = this.socket(end, { ...pose, angles });
    return { angles: { [upper]: au, [lower]: al }, reached: k.reached, error: Math.hypot(p[0] - target[0], p[1] - target[1]) };
  }
  // draw every bone image at its world matrix, in z order. images: { key: HTMLImageElement|Canvas }
  draw(g, pose, images, o = {}) {
    const F = this.compute(pose); g.save();
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    for (const id of this.order) {
      const b = this.byId[id], key = pose.images?.[id] ?? b.image; if (!key) continue; const im = images[key]; if (!im) throw new Error(`rig ${id}: image ${key} not loaded`);
      const M = o.base ? mul(o.base, F.W[id]) : F.W[id]; g.setTransform(...M); g.drawImage(im, -b.pivot[0], -b.pivot[1]);
    }
    g.restore(); return F;
  }
  // debug overlay for the rig viewer: bones, pivots, sockets, limit arcs
  debug(g, pose, o = {}) {
    const F = this.compute(pose), Wp = id => [F.W[id][4], F.W[id][5]]; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.lineWidth = 3;
    for (const b of this.bones) {
      const p = Wp(b.id);
      if (b.parent) { const q = Wp(b.parent); g.strokeStyle = 'rgba(0,220,255,.9)'; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(p[0], p[1]); g.stroke(); }
      if (b.limits && o.limits !== false) {   // the allowed range, drawn around the joint in the parent's frame
        const Pm = b.parent ? F.W[b.parent] : F.root, pa = Math.atan2(Pm[1], Pm[0]), sgn = Math.sign(Pm[0] * Pm[3] - Pm[1] * Pm[2]), r = 34;
        g.strokeStyle = 'rgba(255,200,0,.8)'; g.beginPath(); const a0 = pa + sgn * b.limits[0] * D2R + Math.PI / 2 * sgn, a1 = pa + sgn * b.limits[1] * D2R + Math.PI / 2 * sgn;
        g.arc(p[0], p[1], r, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
      }
      g.fillStyle = '#ff2bd6'; g.beginPath(); g.arc(p[0], p[1], 7, 0, Math.PI * 2); g.fill();
      if (o.labels !== false) { g.fillStyle = '#fff'; g.font = '20px sans-serif'; g.fillText(b.id, p[0] + 10, p[1] - 8); }
    }
    for (const n of Object.keys(this.sockets)) { const p = this.socket(n, pose, F); g.strokeStyle = '#7dff7d'; g.beginPath(); g.moveTo(p[0] - 10, p[1]); g.lineTo(p[0] + 10, p[1]); g.moveTo(p[0], p[1] - 10); g.lineTo(p[0], p[1] + 10); g.stroke(); }
    g.restore(); return F;
  }
}
