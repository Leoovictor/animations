// 2D camera with parallax depth, ported from the Panteões film.js (cam / apply / screen / bg / shake / flash) with the same maths,
// plus layers(): several painted planes, each at its own depth. Pure per frame: call begin(t) first, nothing carries over.
export function createCamera(g, W = 1080, H = 1920) {
  let CAM = { z: 1, x: W / 2, y: H / 2, r: 0 }, SH = [0, 0], IMP = [];
  const cx = W / 2, cy = H / 2;
  const api = {
    get state() { return { ...CAM, shake: [...SH] }; },
    impacts(list) { IMP = list; },                       // [{t, a (shake px), f (flash 0..1), c ('r,g,b')}]
    begin(t) { SH = shakeAt(t, IMP); },
    cam(z = 1, x = cx, y = cy, r = 0) { CAM = { z, x, y, r }; api.apply(1); },
    apply(depth = 1) {                                   // depth 0 = fixed to the screen, 1 = the characters' plane, >1 = in front
      const z = 1 + (CAM.z - 1) * depth, x = cx + (CAM.x - cx) * depth, y = cy + (CAM.y - cy) * depth;
      g.setTransform(1, 0, 0, 1, 0, 0); g.translate(cx + SH[0] * depth, cy + SH[1] * depth); g.rotate(CAM.r * depth); g.scale(z, z); g.translate(-x, -y);
    },
    screen() { g.setTransform(1, 0, 0, 1, 0, 0); },
    bg(im, depth = .35, o = {}) {                        // one painting, cover-fitted with margin (the Panteões bg())
      api.apply(depth); const s = (o.s || 1.12) * Math.max(W / im.width, H / im.height), w = im.width * s, h = im.height * s;
      g.drawImage(im, cx - w / 2 + (o.dx || 0), cy - h / 2 + (o.dy || 0), w, h);
      if (o.dark) { g.fillStyle = `rgba(${o.darkc || '20,18,50'},${o.dark})`; g.fillRect(cx - w / 2, cy - h / 2, w, h); }
      api.apply(1);
    },
    // planes far → near: { img, depth, x?, y? (where the image's anchor sits in world px), w? (world width), anchor? [ax, ay] (0..1 of the image), alpha? }
    layers(list) {
      for (const L of list) {
        api.apply(L.depth); const k = (L.w || W) / L.img.width, w = L.img.width * k, h = L.img.height * k, [ax, ay] = L.anchor || [.5, 1];
        const prev = g.globalAlpha; if (L.alpha != null) g.globalAlpha = L.alpha;
        g.drawImage(L.img, (L.x ?? cx) - ax * w, (L.y ?? H) - ay * h, w, h); g.globalAlpha = prev;
      }
      api.apply(1);
    },
    flash(t) { flashAt(g, t, IMP); },
  };
  return api;
}
export function shakeAt(t, IMP) { let x = 0, y = 0; for (const e of IMP) { const d = t - e.t; if (d < 0 || d > .6 || !e.a) continue; const k = e.a * Math.exp(-d * 7); x += Math.sin(d * 83 + e.t) * k; y += Math.cos(d * 71 + e.t * 3) * k; } return [x, y]; }
export function flashAt(g, t, IMP) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (const e of IMP) { const d = t - e.t; if (e.f && d >= 0 && d < .35) { g.fillStyle = `rgba(${e.c || '255,255,255'},${e.f * (1 - d / .35) ** 2})`; g.fillRect(0, 0, g.canvas.width, g.canvas.height); } }
  g.restore();
}
