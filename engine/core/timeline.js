// timeline.json helpers (the format written by each project's tools/timeline.py): wt / L0 / L1 / S0 / S1 with the Panteões semantics.
import { norm } from './math.js';
export function makeTimeline(TL) {
  const wt = (lid, word, n = 0, end = false) => { const q = norm(word); let k = 0;
    for (const w of TL.words[lid]) if (norm(w[0]) === q || norm(w[0]).startsWith(q)) { if (k++ === n) return end ? w[2] : w[1]; }
    throw new Error(`wt ${lid} ${word}`); };
  return { TL, dur: TL.dur, wt, L0: id => TL.lines[id].t0, L1: id => TL.lines[id].t1, S0: id => TL.scenes[id].t0, S1: id => TL.scenes[id].t1,
    sceneAt: (t, order) => order.find(k => t >= TL.scenes[k].t0 && t < TL.scenes[k].t1) || order[order.length - 1] };
}
