"""Prepare background layers: key out the chroma background by DISTANCE to its colour (foliage that is merely green stays),
crop to the useful band, upscale 2×. Usage: <LIB>/.venv/bin/python tools/key_layer.py assets/backgrounds/forest
Reads layers.json: { name: { "key": true|false, "crop": [y0, y1] (fractions), "trim": true } } and <name>.png; writes layers/<name>.png."""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
D = os.path.abspath(sys.argv[1]); META = {}; cfg = json.load(open(os.path.join(D, 'layers.json'))); os.makedirs(os.path.join(D, 'layers'), exist_ok=True)
for name, c in cfg.items():
    if name.startswith('_'): continue
    im = Image.open(os.path.join(D, name + '.png')).convert('RGB'); a = np.asarray(im).astype(np.float32); h, w = a.shape[:2]
    alpha = np.ones((h, w), np.float32)
    if c.get('key'):
        corners = np.concatenate([a[:8, :8].reshape(-1, 3), a[:8, -8:].reshape(-1, 3), a[-8:, :8].reshape(-1, 3), a[-8:, -8:].reshape(-1, 3)])
        bg = np.array(c['bg'], np.float32) if c.get('bg') is not None else np.median(a[:6].reshape(-1, 3), 0) if c.get('bgRow') else np.median(corners, 0)   # bgRow: the plain sky across the top rows
        dist = np.sqrt(((a - bg) ** 2).sum(2)); lo, hi = c.get('tol', [38, 80]); t = np.clip((dist - lo) / (hi - lo), 0, 1); alpha = t * t * (3 - 2 * t)
        solid = ndi.binary_opening(alpha > .5, iterations=1); alpha = np.where(ndi.binary_dilation(solid, iterations=2), alpha, 0)
        spill = np.clip(1 - alpha, 0, 1)[..., None]; a = a * (1 - spill * .6) + a.mean(2, keepdims=True) * spill * .6   # pull the green fringe toward grey
        print(name, 'background', bg.round(), 'kept', round(float((alpha > .5).mean()) * 100, 1), '%')
    y0, y1 = [int(f * h) for f in c.get('crop', [0, 1])]
    out = Image.fromarray(np.dstack([a, alpha * 255]).clip(0, 255).astype(np.uint8)).crop((0, y0, w, y1))
    if c.get('trim'): bb = out.getbbox(); out = out.crop((0, bb[1], w, bb[3]))
    if c.get('pathLine'):   # first row (from the top) where most columns are the path's warm earth: the walking line
        b = np.asarray(out).astype(int); r, g, bb = b[..., 0], b[..., 1], b[..., 2]; earth = (r > 170) & (g > 110) & (g < 200) & (bb < 130) & (r - bb > 80)
        rows = np.where(earth.mean(1) > .5)[0]; META[name] = {'pathLine': round(float(rows[0]) / out.height, 4)} if len(rows) else {}
        print(name, 'path line at', META.get(name))
    out = out.resize((out.width * 2, out.height * 2), Image.LANCZOS); out.save(os.path.join(D, 'layers', name + '.png'), optimize=True)
    print(name, '→', out.size)
json.dump(META, open(os.path.join(D, 'layers', 'meta.json'), 'w'), indent=1)
