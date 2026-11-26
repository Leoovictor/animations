"""Measure how far one rig bone sits from where the reference figure puts it.
Usage: <LIB>/.venv/bin/python tools/fit_rig.py <ref.jpg> <bone.jpg> [--view-scale 0.4]
Both images come from demos/rig-test (?ref=solo and ?only=<bone>): same placement, flat green background.
Searches scale (0.8–1.25) and shift (±240 px) that make the bone's pixels match the reference's colours inside the bone's silhouette.
Prints the best screen shift (px), the shift in rig units (÷ view scale, for rig_plan offsets) and the scale."""
import sys, numpy as np
from PIL import Image
args = sys.argv[1:]; vs = float(args[args.index('--view-scale') + 1]) if '--view-scale' in args else .4
def load(p, k): im = Image.open(p).convert('RGB'); im = im.resize((im.width // k, im.height // k), Image.BILINEAR); a = np.asarray(im).astype(np.float32); m = ~((a[..., 1] > 200) & (a[..., 0] < 90) & (a[..., 2] < 90)); return a, m
def fit(k, scales, shifts, ref_p, bone_p, center=(0, 0)):
    R, Rm = load(ref_p, k); B, Bm = load(bone_p, k); ys, xs = np.where(Bm); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cb = B[y0:y1, x0:x1]; cm = Bm[y0:y1, x0:x1]; cy, cx = (y0 + y1) / 2, (x0 + x1) / 2; best = (1e9, None)
    for s in scales:
        h, w = max(2, int(cm.shape[0] * s)), max(2, int(cm.shape[1] * s))
        bs = np.asarray(Image.fromarray(cb.astype(np.uint8)).resize((w, h), Image.BILINEAR)).astype(np.float32); ms = np.asarray(Image.fromarray(cm.astype(np.uint8) * 255).resize((w, h))) > 127
        for dy in shifts:
            for dx in shifts:
                ty, tx = int(round(cy + center[1] / k + dy - h / 2)), int(round(cx + center[0] / k + dx - w / 2))
                if ty < 0 or tx < 0 or ty + h > R.shape[0] or tx + w > R.shape[1]: continue
                rr, rm = R[ty:ty + h, tx:tx + w], Rm[ty:ty + h, tx:tx + w]
                err = (np.abs(rr - bs).sum(2) * ms).sum() / ms.sum() + 160 * ((~rm) & ms).sum() / ms.sum()   # colour error + penalty for landing on empty background
                if err < best[0]: best = (err, (s, (center[0] / k + dx) * k, (center[1] / k + dy) * k))
    return best
ref_p, bone_p = args[0], args[1]
e1, (s1, dx1, dy1) = fit(4, np.arange(.8, 1.26, .05), range(-60, 61, 2), ref_p, bone_p)
e2, (s2, dx2, dy2) = fit(2, np.arange(s1 - .04, s1 + .05, .01), range(-6, 7, 1), ref_p, bone_p, (dx1, dy1))
print(f"{bone_p.split('/')[-2]}: shift {dx2:+.0f}, {dy2:+.0f} px on screen = {dx2 / vs:+.0f}, {dy2 / vs:+.0f} rig px · scale ×{s2:.2f} · error {e2:.1f}")
