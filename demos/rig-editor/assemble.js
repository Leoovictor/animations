// rig_plan.json + parts/pieces.json → rig manifest. Same logic as tools/assemble_rig.py (keep them in step).
export function assemble(plan, P) {
  const pieceOf = Object.fromEntries(plan.bones.map(b => [b.id, b.piece]));
  const bones = plan.bones.map(b => {
    const pc = P[b.piece], out = { id: b.id, parent: b.parent, image: 'parts/' + b.piece + '.png', pivot: pc.pivot, z: b.z };
    if (b.parent == null) out.position = [0, 0];
    else { const pp = P[pieceOf[b.parent]], tgt = b.at === 'pivot' ? pp.pivot : pp.attach[b.at], off = b.offset || [0, 0]; out.position = [tgt[0] - pp.pivot[0] + off[0], tgt[1] - pp.pivot[1] + off[1]]; }
    if (b.limits) out.limits = b.limits; if ((b.scale ?? 1) !== 1) out.scale = b.scale; return out;
  });
  const sockets = Object.fromEntries(Object.entries(plan.sockets).map(([k, [bone, i]]) => [k, { bone, at: P[pieceOf[bone]].attach[i] }]));
  const variants = Object.fromEntries(Object.entries(plan.variants || {}).map(([bone, m]) => [bone, Object.fromEntries(Object.entries(m).map(([k, v]) => [k, 'parts/' + v + '.png']))]));
  return { view: plan.view, viewScale: plan.viewScale ?? 1, reference: plan.reference, bones, sockets, variants, chains: plan.chains || {} };
}
