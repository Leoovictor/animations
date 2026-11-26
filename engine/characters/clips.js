// Movement clips. Each clip: pose(u, tau, c, ctx) → { angles, feet, dy, dx, images }, with u = 0..1 over the clip, tau = seconds since start.
// Angles (deg, side view facing right): + swings a hanging bone backwards; on the torso and head + leans forward. Layers blend along the
// shortest way round, so 228 and −132 are the same arm position (up and forward).
// Bones by role: torso, head, upperArmN/forearmN (near arm), upperArmF/forearmF (far arm). Legs are IK: clips move the feet, not the knees.
// pose() also gets ctx.prior (distance already walked before this clip) and cur (the layers below it). Feet and dy are in the stage frame (rig px, y down, ground = 0). Everything is a function of its arguments: no state.
import { clamp, lerp, K, EASE } from '../core/math.js';
const face = (ctx, name) => name && ctx.ch.rig.m.variants?.head?.[name];
const hand = (ctx, name) => name && ctx.ch.rig.m.variants?.forearmN?.[name];
const img = (ctx, o) => { const r = {}; if (face(ctx, o.face)) r.head = face(ctx, o.face); if (hand(ctx, o.hand)) r.forearmN = hand(ctx, o.hand); return r; };

// walk geometry shared by pose() and travel(): stride S per step, cycle period P (two steps), body speed v
const walkGeo = (c, ctx) => { const S = .32 * ctx.legLen * (c.stride || 1), P = .9 / (c.speed || 1); return { S, P, v: 2 * S / P }; };

export const CLIPS = {
  // breathing and a little weight shift; always the base layer
  idle: { priority: 0, pose(u, tau, c) {
    const t = tau + c.start, b = Math.sin(t * Math.PI * 2 / 3.2), s = Math.sin(t * Math.PI * 2 / 3.2 + .8);
    return { angles: { torso: 1.4 * b, head: -1 * s, upperArmN: 5 + 2.5 * s, forearmN: -10 - 3 * b, upperArmF: -4 - 2 * s, forearmF: -10 }, dy: 1.5 * b };
  } },

  // contact → down → passing → up: each foot is planted on a fixed ground point for its whole stance, then swings in an arc to the next one
  walk: { priority: 1,
    travel(tau, c, ctx) { return walkGeo(c, ctx).v * tau; },
    pose(u, tau, c, ctx) {
      const { S, P } = walkGeo(c, ctx), T = Math.min(tau, c.duration), ph = (T / P) % 1, k = c.intensity, h = .16 * ctx.legLen * (c.lift || 1);
      const feet = ctx.feet0.map(([x0, y0], i) => {
        const off = i ? .5 : 0, f = T / P + off, n = Math.floor(f), psi = f - n, X = m => ctx.prior + x0 + 2 * S * (m - off + .25);
        if (psi < .5) return [X(n), y0];                                                   // stance: nailed to the ground
        const s = (psi - .5) / .5; return [lerp(X(n), X(n + 1), EASE.io(s)), y0 - h * Math.sin(Math.PI * s)];   // swing: an arc forward
      });
      const sw = Math.cos(ph * Math.PI * 2);
      return { feet, dy: .035 * ctx.legLen + .022 * ctx.legLen * Math.cos(ph * Math.PI * 4),   // lowest at each contact, highest at passing
        angles: { torso: 5 * k, head: -3, upperArmN: 24 * k * sw, forearmN: -22 - 10 * k * Math.max(0, -sw), upperArmF: -24 * k * sw, forearmF: -22 - 10 * k * Math.max(0, sw) } };
    } },

  // the head tips back to look up, the torso follows a little
  lookUp: { priority: 2, pose(u, tau, c, ctx) {
    const e = EASE.o3(clamp(tau / .45)) * c.intensity;
    return { angles: { head: -26 * e, torso: -6 * e }, images: img(ctx, c) };
  } },

  // a start: everything jumps back, then settles with a small overshoot
  surprised: { priority: 3, pose(u, tau, c, ctx) {
    const k = c.intensity, j = K(tau, [[0, 0], [.17, 1, 'o'], [.4, .82, 'io'], [.65, .9, 'io']]);
    return { angles: { head: -16 * j * k, torso: -9 * j * k, upperArmN: -38 * j * k, forearmN: -70 * j * k, upperArmF: -30 * j * k, forearmF: -60 * j * k },
      dy: K(tau, [[0, 0], [.1, -.06 * ctx.legLen, 'o'], [.25, .02 * ctx.legLen, 'i'], [.4, 0]]), images: img(ctx, { face: 'surprised', ...c }) };
  } },

  // wind-up before the strike: sink, lean back, throw the near arm behind
  anticipation: { priority: 2, pose(u, tau, c, ctx) {
    const e = EASE.io(clamp(tau / (c.duration * .8))) * c.intensity;
    return { angles: { torso: -8 * e, head: -6 * e, upperArmN: 150 * e, forearmN: -40 * e, upperArmF: -30 * e, forearmF: -45 * e },   // arm thrown back and up behind the shoulder
      dy: .12 * ctx.legLen * e, images: img(ctx, { face: 'shout', hand: 'open', ...c }) };
  } },

  // the strike: a fast snap of the near arm up and forward, body follows, then holds while the bolt runs
  castLightning: { priority: 3, pose(u, tau, c, ctx) {
    const k = c.intensity, snap = K(tau, [[0, 0], [.12, 1.08, 'o'], [.28, 1, 'io']]);
    return { angles: { upperArmN: lerp(150, 228, snap), forearmN: lerp(-40, -4, snap), torso: lerp(-8, 10 * k, snap), head: lerp(-6, -14, snap), upperArmF: lerp(-30, 30, snap), forearmF: -40 },   // over the top, ending up and forward, clear of the big head
      dy: lerp(.12, .05, snap) * ctx.legLen, images: img(ctx, { face: 'shout', hand: 'open', ...c }) };
  } },

  // the kick of the blast: thrown back a step, arm drops, then recovers balance with an overshoot
  recoil: { priority: 4, pose(u, tau, c, ctx, cur) {
    const k = c.intensity, back = K(tau, [[0, 0], [.14, 1, 'o'], [.45, .25, 'io'], [.8, -.08, 'io'], [1.1, 0, 'io']]);
    const step = K(tau, [[0, 0], [.18, 1, 'o'], [1.1, 1]]) * .22 * ctx.legLen * k;
    const feet = cur.feet.map(([x0, y0], i) => { const lag = i ? .06 : 0, s = K(tau - lag, [[0, 0], [.2, 1, 'o']]); return [x0 - step * s, y0 - .08 * ctx.legLen * Math.sin(Math.PI * clamp((tau - lag) / .2))]; });   // both feet hop back one after the other
    return { feet, dx: -step, dy: .05 * ctx.legLen * back,
      angles: { torso: -22 * back * k, head: -10 * back * k, upperArmN: lerp(-132, 15, EASE.io(clamp(tau / .75))), forearmN: lerp(-4, -30, EASE.io(clamp(tau / .75))), upperArmF: 40 * back * k, forearmF: -50 * back },
      images: img(ctx, { face: 'surprised', ...c }) };
  } },
};
