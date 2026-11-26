// node --test engine/tests   (no browser needed: the maths and the rig are DOM-free)
import test from 'node:test'; import assert from 'node:assert/strict';
import { K, rnd, rng, EASE, clamp, seg } from '../core/math.js';
import { makeTimeline } from '../core/timeline.js';
import { Rig, ik2, mul, inv, ap, I } from '../characters/rig.js';
import { shakeAt } from '../camera/camera.js';
import { TEST_RIG } from './fixtures.mjs';
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('easing endpoints and keyframes', () => {
  for (const [k, f] of Object.entries(EASE)) { near(f(0), 0, 1e-9); near(f(1), 1, 1e-9); }
  const keys = [[0, 0], [1, 10], [2, 10, 'lin'], [3, 0, 'o']];
  near(K(-1, keys), 0); near(K(.5, keys), 5); near(K(1.5, keys), 10); near(K(9, keys), 0); near(clamp(2), 1); near(seg(1.5, 1, 2), .5);
});
test('noise is a pure function of its inputs', () => {
  const a = [...Array(50)].map((_, i) => rnd(i, 3)), b = [...Array(50)].map((_, i) => rnd(49 - i, 3)).reverse();
  assert.deepEqual(a, b); assert.ok(a.every(v => v >= 0 && v < 1));
  const r1 = rng(7), r2 = rng(7); assert.equal(r1(), r2());
});
test('timeline helpers', () => {
  const TL = { dur: 10, lines: { s01: { t0: 1, t1: 3 } }, scenes: { a: { t0: 0, t1: 5 }, b: { t0: 5, t1: 10 } }, words: { s01: [['Zeus,', 1.1, 1.4], ['olhou', 1.5, 1.9], ['Zeus', 2.0, 2.2]] } };
  const tl = makeTimeline(TL); near(tl.wt('s01', 'zeus'), 1.1); near(tl.wt('s01', 'Zeus', 1), 2.0); near(tl.wt('s01', 'olhou', 0, true), 1.9);
  assert.equal(tl.sceneAt(7, ['a', 'b']), 'b'); assert.throws(() => tl.wt('s01', 'Thor'));
});
test('matrices invert', () => { const M = [.8, .6, -.6, .8, 30, -12], P = ap(mul(M, inv(M)), [5, 7]); near(P[0], 5, 1e-9); near(P[1], 7, 1e-9); });
test('FK: rest pose places each pivot at parent pivot + position', () => {
  const rig = new Rig(TEST_RIG), F = rig.compute({ root: { x: 100, y: 200 } });
  near(F.W.torso[4], 100); near(F.W.torso[5], 190); near(F.W.forearmR[4], 110); near(F.W.forearmR[5], 200 - 10 - 165 + 110);
});
test('FK: rotating a parent carries its children', () => {
  const rig = new Rig(TEST_RIG), F = rig.compute({ root: { x: 0, y: 0 }, angles: { upperArmR: 60 } });   // +60° turns the forearm offset (0,110)
  near(F.W.forearmR[4] - F.W.upperArmR[4], -110 * Math.sin(Math.PI / 3), 1e-6); near(F.W.forearmR[5] - F.W.upperArmR[5], 110 * Math.cos(Math.PI / 3), 1e-6);
});
test('limits clamp the joint angle', () => {
  const rig = new Rig(TEST_RIG); near(rig.angle({ angles: { torso: 80 } }, 'torso'), 25); near(rig.angle({ angles: { shinR: -40 } }, 'shinR'), 0); near(rig.angle({ angles: { forearmR: 30 } }, 'forearmR'), 0);
});
test('IK reaches a reachable target within 1 px (both facings)', () => {
  const rig = new Rig(TEST_RIG);
  for (const flip of [false, true]) for (const tgt of [[180, -60], [140, -300], [60, -360]]) {   // inside the 210 px reach from the shoulder at (10,−175) and inside the joint limits
    const pose = { root: { x: 0, y: 0, flip, scale: 1 }, angles: {} }, target = [flip ? -tgt[0] : tgt[0], tgt[1]];
    const s = rig.solve(pose, 'upperArmR', 'forearmR', 'handR', target, 0);
    assert.ok(s.error < 1, `flip=${flip} target=${target} error=${s.error.toFixed(2)}`);
  }
});
test('IK respects limits when the target needs a forbidden bend', () => {
  const rig = new Rig(TEST_RIG), s = rig.solve({ root: {} }, 'thighR', 'shinR', 'footR', [0, 60], 1);
  assert.ok(s.angles.shinR >= 0 && s.angles.shinR <= 150);
});
test('knees fold backwards, elbows forwards (anatomy of the test rig, facing right)', () => {
  const rig = new Rig(TEST_RIG), base = { root: { x: 0, y: 0 } };
  const leg = rig.solve(base, 'thighR', 'shinR', 'footR', [40, 230], 0), F = rig.compute({ ...base, angles: leg.angles });
  const hip = [F.W.thighR[4], F.W.thighR[5]], knee = [F.W.shinR[4], F.W.shinR[5]], foot = rig.socket('footR', { ...base, angles: leg.angles }, F);
  const kneeSide = (foot[0] - hip[0]) * (knee[1] - hip[1]) - (foot[1] - hip[1]) * (knee[0] - hip[0]);   // y points down: < 0 means the knee is in front (+x) of the hip→foot line
  assert.ok(leg.error < 1 && kneeSide < 0, `knee should point forward (side=${kneeSide.toFixed(1)})`);
});
test('mirroring keeps draw order and mirrors positions', () => {
  const rig = new Rig(TEST_RIG), a = rig.compute({ root: { x: 0, y: 0 }, angles: { upperArmR: -40 } }), b = rig.compute({ root: { x: 0, y: 0, flip: true }, angles: { upperArmR: -40 } });
  near(b.W.forearmR[4], -a.W.forearmR[4]); near(b.W.forearmR[5], a.W.forearmR[5]); assert.equal(rig.order.at(-1), 'head');
});
test('pose evaluation is order-independent (determinism)', () => {
  const rig = new Rig(TEST_RIG), pose = t => ({ root: { x: t * 10, y: 0 }, angles: { thighR: 30 * Math.sin(t), shinR: -40 - 30 * Math.cos(t) } });
  const fwd = [0, 1, 2, 3].map(t => JSON.stringify(rig.compute(pose(t)).W)), rev = [3, 2, 1, 0].map(t => JSON.stringify(rig.compute(pose(t)).W)).reverse();
  assert.deepEqual(fwd, rev);
});
test('shake decays and is silent outside impacts', () => {
  const IMP = [{ t: 1, a: 30 }]; assert.deepEqual(shakeAt(.5, IMP), [0, 0]); assert.deepEqual(shakeAt(2, IMP), [0, 0]);
  const s = shakeAt(1.05, IMP); assert.ok(Math.hypot(...s) > 1);
});
test('a target outside the joint limits is reported, never solved by breaking a limit', () => {
  const rig = new Rig(TEST_RIG), s = rig.solve({ root: {} }, 'upperArmR', 'forearmR', 'handR', [-40, -150], 0);   // behind the chest: the elbow would have to fold backwards
  assert.ok(s.error > 1); assert.ok(s.angles.upperArmR >= -170 && s.angles.upperArmR <= 80 && s.angles.forearmR >= -150 && s.angles.forearmR <= 0);
});
test('ik2 reports unreachable targets', () => { assert.equal(ik2([0, 0], [500, 0], 100, 100).reached, false); assert.equal(ik2([0, 0], [150, 0], 100, 100).reached, true); });
