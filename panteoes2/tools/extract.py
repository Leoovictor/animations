"""Chroma-key every sheet in src/ (except bg_*) and cut each figure into parts/<sheet>_<n>.png (left to right).
Writes parts/index.json: {sheet_n: [w, h]} and parts/<sheet>_debug.jpg with numbers."""
import json, os, sys, glob
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(HERE, 'src'), os.path.join(HERE, 'parts')
UP = 2
def key(img):
    a = np.asarray(img).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)
    t = np.clip((d - 26) / 44.0, 0, 1); alpha = 1 - t * t * (3 - 2 * t)
    spill = np.clip((d - 2) / 30.0, 0, 1); g2 = g - spill * np.maximum(d - 2, 0)
    return np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8), alpha
idx = json.load(open(os.path.join(OUT, 'index.json'))) if os.path.exists(os.path.join(OUT, 'index.json')) else {}
names = sys.argv[1:] or [os.path.basename(p)[:-4] for p in sorted(glob.glob(os.path.join(SRC, '*.png'))) if not os.path.basename(p).startswith('bg_')]
for name in names:
    img = Image.open(os.path.join(SRC, name + '.png')).convert('RGB')
    img = img.resize((img.width * UP, img.height * UP), Image.LANCZOS)
    rgba, alpha = key(img)
    solid = ndi.binary_opening(alpha > 0.5, iterations=2)
    lab, n = ndi.label(ndi.binary_dilation(solid, iterations=12))
    objs = [(sl, i + 1) for i, sl in enumerate(ndi.find_objects(lab)) if (lab[sl] == i + 1).sum() > 30000]
    objs.sort(key=lambda o: o[0][1].start)
    dbg = Image.fromarray(rgba[..., :3]).resize((img.width // UP, img.height // UP)); dr = ImageDraw.Draw(dbg)
    for k, (sl, lid) in enumerate(objs):
        ys, xs = sl; pad = 8
        y0, y1 = max(ys.start - pad, 0), min(ys.stop + pad, rgba.shape[0]); x0, x1 = max(xs.start - pad, 0), min(xs.stop + pad, rgba.shape[1])
        crop = rgba[y0:y1, x0:x1].copy()
        m = ndi.binary_dilation(lab[y0:y1, x0:x1] == lid, iterations=2)
        crop[..., 3] = (crop[..., 3] * m).astype(np.uint8)
        Image.fromarray(crop).save(os.path.join(OUT, f'{name}_{k}.png'), optimize=True)
        idx[f'{name}_{k}'] = [x1 - x0, y1 - y0]
        dr.rectangle([x0 // UP, y0 // UP, x1 // UP, y1 // UP], outline=(255, 0, 0), width=3); dr.text((x0 // UP + 6, y0 // UP + 6), str(k), fill=(255, 0, 0))
    dbg.save(os.path.join(OUT, f'{name}_debug.jpg'), quality=70)
    print(name, len(objs))
json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w'), indent=0)
