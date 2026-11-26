// The pilot's acting (12 s), shared by the clip gallery and engine/tests/animator.test.mjs.
// 0–3 walk in · 3–6 stops, looks up, surprise · 6–9 wind-up, energy gathers · 9–12 strike, recoil, recovers.
export const PILOT_CLIPS = [
  { action: 'idle', start: 0, duration: 12, blendIn: 0, hold: true },
  { action: 'walk', start: 0, duration: 2.7, blendIn: .2, blendOut: .3 },
  { action: 'lookUp', start: 3.1, duration: 2.9, blendOut: .3 },
  { action: 'surprised', start: 3.5, duration: 2.4, blendIn: .1, blendOut: .3 },
  { action: 'anticipation', start: 6.0, duration: 3.0, blendIn: .25, blendOut: .1 },
  { action: 'castLightning', start: 9.0, duration: .7, blendIn: .04, blendOut: .1 },
  { action: 'recoil', start: 9.6, duration: 1.6, blendIn: .12, blendOut: .5 },
];
export function act(character, clips = PILOT_CLIPS) { for (const c of clips) character.play({ ...c }); return character; }
