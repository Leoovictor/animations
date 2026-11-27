// Character animator: clips on a timeline, layered by priority and blended in/out, legs driven by IK foot targets.
// Pure: poseAt(t) depends only on t and the clips added with play(); frames can be evaluated in any order (Opuscar renders out of order).
//
// Stage frame: the character's own units (rig image px), origin on the ground under the hips at the start, x forward, y down (ground = 0).
// World = the stage frame placed at { x, y (ground line), scale, flip } given to draw().
//
//   const zeus = new Character(rig, images, { legs: ['legN', 'legF'] });
//   zeus.play({ action: 'walk', start: 0, duration: 3, speed: 1 });
//   zeus.play({ action: 'castLightning', start: 6, duration: 2.5, intensity: .8 });
//   zeus.draw(ctx, t, { x: 300, y: 1500, scale: .5 });
import { clamp, EASE } from '../core/math.js';
import { CLIPS } from './clips.js';
const wrap180 = d => ((d + 180) % 360 + 360) % 360 - 180;

export class Character {
  constructor(rig, images, o = {}) {
    this.rig = rig; this.images = images; this.clips = []; this.o = o;
    const C = rig.m.chains || {}, keys = (o.legs || ['legN', 'legF']).filter(k => C[k]); this.legs = keys.map(k => C[k]);
    // legs with an ankle: the chain ends at the ankle, and soles[leg] = [foot bone, sole socket]; the foot is kept flat on the ground
    this.soles = keys.map(k => rig.m.soles?.[k] || null);
    // rest geometry, measured once from the manifest at angle 0: hip height and the ground contact points (soles) in the stage frame
    const F = rig.compute({ root: { x: 0, y: 0, scale: 1 } });
    this.feet0 = this.legs.map(([, , s], i) => rig.socket(this.soles[i] ? this.soles[i][1] : s, { root: { x: 0, y: 0, scale: 1 } }, F));
    this.hipH = Math.max(...this.feet0.map(p => p[1]));
    this.feet0 = this.feet0.map(p => [p[0], p[1] - this.hipH]);                         // feet relative to the ground point under the hips (y ≈ 0)
    this.legLen = Math.max(...this.legs.map(([th, sh, s]) => { const b = rig.byId[sh], so = rig.sockets[s]; return Math.hypot(...b.position) + Math.hypot(so.at[0] - b.pivot[0], so.at[1] - b.pivot[1]); }));
    this.reach = this.legs.map(([th, sh, s]) => { const b = rig.byId[sh], so = rig.sockets[s]; return Math.hypot(...b.position) + Math.hypot(so.at[0] - b.pivot[0], so.at[1] - b.pivot[1]); });
    this.crouch = (o.crouch ?? .05) * this.legLen;
    // which IK bend puts the knee forward for this rig (decided once, so the knee never flips between frames)
    this.bend = this.legs.map(([th, sh, s], i) => {
      const tgt = [this.feet0[i][0], this.feet0[i][1] + this.hipH - .12 * this.legLen], pose = { root: { x: 0, y: 0, scale: 1 } };
      let best = 1, bestScore = Infinity;
      for (const b of [1, -1]) { const r = rig.solve(pose, th, sh, s, tgt, b), FF = rig.compute({ ...pose, angles: r.angles });
        const hip = [FF.W[th][4], FF.W[th][5]], knee = [FF.W[sh][4], FF.W[sh][5]], ft = rig.socket(s, { ...pose, angles: r.angles }, FF);
        const side = (ft[0] - hip[0]) * (knee[1] - hip[1]) - (ft[1] - hip[1]) * (knee[0] - hip[0]);   // < 0: knee in front (y down)
        const score = r.error + (side < 0 ? 0 : 1e6); if (score < bestScore) { bestScore = score; best = b; } }
      return best;
    });
  }
  play(c) { if (!CLIPS[c.action]) throw new Error('unknown action ' + c.action); this.clips.push({ priority: CLIPS[c.action].priority ?? 1, blendIn: .15, blendOut: .15, intensity: 1, speed: 1, ...c }); return this; }
  weight(c, t) { const end = c.start + c.duration; if (t < c.start || t > end + (c.hold ? 1e9 : c.blendOut)) return 0;
    const a = c.blendIn > 0 ? clamp((t - c.start) / c.blendIn) : 1, b = c.hold || c.blendOut <= 0 ? 1 : clamp((end + c.blendOut - t) / c.blendOut); return EASE.io(Math.min(a, b)); }
  // the layered result before IK: angles, feet (stage frame), body offset, images
  sample(t) {
    const out = { angles: {}, feet: this.feet0.map(p => [...p]), dy: 0, dx: 0, lean: 0, images: {}, travel: 0 };
    const ctx = { ch: this, legLen: this.legLen, hipH: this.hipH, feet0: this.feet0 };
    for (const c of this.clips) if (CLIPS[c.action].travel) out.travel += CLIPS[c.action].travel(clamp(t - c.start, 0, c.duration), c, ctx);
    out.feet = out.feet.map(([x, y]) => [x + out.travel, y]);
    const active = this.clips.map(c => ({ c, w: this.weight(c, t) })).filter(o => o.w > 0).sort((a, b) => a.c.priority - b.c.priority || a.c.start - b.c.start);
    for (const { c, w } of active) {
      let prior = 0; for (const d of this.clips) if (d !== c && CLIPS[d.action].travel && d.start < c.start) prior += CLIPS[d.action].travel(clamp(c.start - d.start, 0, d.duration), d, ctx);
      const tau = t - c.start, u = clamp(tau / c.duration), r = CLIPS[c.action].pose(u, tau, c, { ...ctx, prior }, out) || {};
      for (const [k, v] of Object.entries(r.angles || {})) { const cur = out.angles[k] ?? 0; out.angles[k] = cur + wrap180(v - cur) * w; }   // blend along the shortest way round
      if (r.feet) r.feet.forEach((p, i) => { if (p) out.feet[i] = [out.feet[i][0] + (p[0] - out.feet[i][0]) * w, out.feet[i][1] + (p[1] - out.feet[i][1]) * w]; });
      for (const k of ['dy', 'dx']) if (r[k] != null) out[k] += (r[k] - out[k]) * w;
      if (r.images) for (const [k, v] of Object.entries(r.images)) if (w >= .5) out.images[k] = v;
    }
    return out;
  }
  poseAt(t, place = {}) {
    const s = this.sample(t), lag = this.sample(t - .09);                                 // follow-through: the head trails the torso a little
    if ('torso' in s.angles || 'torso' in lag.angles) s.angles.head = (s.angles.head ?? 0) + .45 * ((lag.angles.torso ?? 0) - (s.angles.torso ?? 0));
    const sc = place.scale ?? 1, sg = place.flip ? -1 : 1, X = p => [(place.x ?? 0) + sg * sc * p[0], (place.y ?? 0) + sc * p[1]];
    const hips = X([s.travel + s.dx, -this.hipH + s.dy + this.crouch]);                // knees always a little soft (crouch), so a hop never over-stretches a leg
    const pose = { root: { x: hips[0], y: hips[1], scale: sc, flip: place.flip }, angles: { ...s.angles }, images: { ...s.images } };
    const feetW = s.feet.map(X), F0 = this.rig.compute(pose);
    this.legs.forEach(([th, sh, so], i) => {   // a target beyond reach lifts the foot along the hip→foot line instead of dragging it
      const hip = [F0.W[th][4], F0.W[th][5]], f = feetW[i];
      let tgt = feetW[i]; const sole = this.soles[i];
      if (sole) { const fb = this.rig.byId[sole[0]], at = this.rig.sockets[sole[1]].at, k = fb.scale ?? 1;   // the ankle sits above the sole of a flat foot
        tgt = [f[0] + (place.flip ? -1 : 1) * sc * k * (fb.pivot[0] - at[0]), f[1] + sc * k * (fb.pivot[1] - at[1])]; }
      const d = Math.hypot(tgt[0] - hip[0], tgt[1] - hip[1]), max = .985 * this.reach[i] * sc;   // out of reach: the foot lifts, never drags
      if (d > max) { const lift = [hip[0] + (tgt[0] - hip[0]) * max / d - tgt[0], hip[1] + (tgt[1] - hip[1]) * max / d - tgt[1]]; tgt = [tgt[0] + lift[0], tgt[1] + lift[1]]; feetW[i] = [f[0] + lift[0], f[1] + lift[1]]; }
      Object.assign(pose.angles, this.rig.solve(pose, th, sh, so, tgt, this.bend[i]).angles);
      if (sole) pose.angles[sole[0]] = -((pose.angles[th] ?? 0) + (pose.angles[sh] ?? 0)) + (s.angles[sole[0]] ?? 0);   // foot flat (+ any tilt a clip asks for)
    });
    pose.feet = feetW; pose.stage = s; return pose;
  }
  socket(name, t, place) { return this.rig.socket(name, this.poseAt(t, place)); }
  draw(g, t, place = {}) {
    const pose = this.poseAt(t, place);
    if (place.shadow !== false) {   // contact shadows: darker and tighter when the foot is on the ground
      g.save();   // in the caller's (camera) frame, like the character
      for (const f of pose.feet) { const lift = clamp(((place.y ?? 0) - f[1]) / (60 * (place.scale ?? 1))), r = 70 * (place.scale ?? 1) * (1 - .3 * lift);
        g.fillStyle = `rgba(0,0,0,${.28 * (1 - .7 * lift)})`; g.beginPath(); g.ellipse(f[0], place.y ?? 0, r, r * .22, 0, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    this.rig.draw(g, pose, this.images); return pose;
  }
}
