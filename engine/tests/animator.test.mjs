// node --test engine/tests/animator.test.mjs — motion checks on the real Zeus rig (assets/characters/zeus/rig.json); no browser needed.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { Rig } from '../characters/rig.js'; import { Character } from '../characters/animator.js'; import { CLIPS } from '../characters/clips.js'; import { act } from '../../demos/clips/acting.js';
const RIGJ = JSON.parse(fs.readFileSync(new URL('../../assets/characters/zeus/rig.json', import.meta.url)));
const PLACE = { x: 200, y: 1500, scale: .4 }, FPS = 30;
export function pilot() { return act(new Character(new Rig(RIGJ), {})); }   // the pilot's acting: demos/clips/acting.js
const frames = (a, b) => { const r = []; for (let f = Math.round(a * FPS); f <= Math.round(b * FPS); f++) r.push(f / FPS); return r; };

test('every clip used by the pilot exists', () => { for (const k of ['idle', 'walk', 'lookUp', 'surprised', 'anticipation', 'castLightning', 'recoil']) assert.ok(CLIPS[k]); });
test('walk: a foot in stance stays nailed to the ground (< 2 px between frames)', () => {
  const c = pilot(), rig = c.rig, { S, P } = { S: .32 * c.legLen, P: .9 };
  let worst = 0;
  for (const [i, foot] of [[0, 'footN'], [1, 'footF']]) {
    let prev = null, prevKey = null;
    for (const t of frames(.25, 2.6)) {   // after the blend-in, before the blend-out
      const f = t / P + (i ? .5 : 0), n = Math.floor(f), psi = f - n, key = psi < .5 ? n : null;
      const p = rig.socket(foot, c.poseAt(t, PLACE));
      if (key !== null && key === prevKey) { const d = Math.hypot(p[0] - prev[0], p[1] - prev[1]); worst = Math.max(worst, d); }
      prev = p; prevKey = key;
    }
  }
  assert.ok(worst < 2, `planted foot moved ${worst.toFixed(2)} px`);
});
test('feet reach their IK targets over the whole pilot (< 2 px; a target out of reach is lifted, never dragged)', () => {
  const c = pilot(); let worst = 0, at = 0;
  for (const t of frames(0, 12)) { const pose = c.poseAt(t, PLACE); for (const [k, s] of [[0, 'footN'], [1, 'footF']]) { const p = c.rig.socket(s, pose), e = Math.hypot(p[0] - pose.feet[k][0], p[1] - pose.feet[k][1]); if (e > worst) { worst = e; at = t; } } }
  assert.ok(worst < 2, `foot off its target by ${worst.toFixed(2)} px at t=${at.toFixed(2)}`);
});
test('knees stay in front during the walk and the crouch', () => {
  const c = pilot();
  for (const t of [...frames(.3, 2.6), ...frames(7, 8.9)]) { const pose = c.poseAt(t, PLACE), F = c.rig.compute(pose);
    for (const [th, sh, s] of [['thighN', 'shinN', 'footN'], ['thighF', 'shinF', 'footF']]) {
      const hip = [F.W[th][4], F.W[th][5]], knee = [F.W[sh][4], F.W[sh][5]], ft = c.rig.socket(s, pose, F), side = (ft[0] - hip[0]) * (knee[1] - hip[1]) - (ft[1] - hip[1]) * (knee[0] - hip[0]);
      assert.ok(side <= 1e-6 * Math.abs(side) + 1, `knee behind at t=${t.toFixed(2)} (${th})`); } }
});
test('no pops: joints move less than 25° per frame outside the deliberate snap of the strike', () => {
  const c = pilot(); let prev = null, worst = 0, where = '';
  for (const t of frames(0, 12)) { const a = c.poseAt(t, PLACE).angles;
    if (prev && !(t > 9 && t < 9.3)) for (const k of Object.keys(a)) { const d = Math.abs(((a[k] - (prev[k] ?? a[k]) + 180) % 360 + 360) % 360 - 180); if (d > worst) { worst = d; where = `${k} at t=${t.toFixed(2)}`; } }
    prev = a; }
  assert.ok(worst < 25, `jump of ${worst.toFixed(1)}° (${where})`);
});
test('the character travels forward while walking and stays put afterwards', () => {
  const c = pilot(), x = t => c.poseAt(t, PLACE).root.x; assert.ok(x(2.7) - x(0) > 150); assert.ok(Math.abs(x(5) - x(3.5)) < 1);
});
test('poses are the same in any evaluation order', () => {
  const ts = [0, 1.37, 4.2, 9.05, 11.9], a = ts.map(t => JSON.stringify(pilot().poseAt(t, PLACE))), c = pilot(), b = [...ts].reverse().map(t => JSON.stringify(c.poseAt(t, PLACE))).reverse();
  assert.deepEqual(a, b);
});
test('the bolt socket rises above the head during the strike', () => {
  const c = pilot(), pose = c.poseAt(9.4, PLACE), hand = c.rig.socket('handN', pose), F = c.rig.compute(pose); assert.ok(hand[1] < F.W.head[5], 'hand should be above the neck');
});
