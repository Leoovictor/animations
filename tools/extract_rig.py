"""Cut a character's puppet sheets into pieces and read their joint markers.
Usage: <LIB>/.venv/bin/python tools/extract_rig.py assets/characters/<name>
Reads  sheets/pieces.json (names in reading order, scale, darken) and sheets/<sheet>.png (green #00B140 background).
Markers drawn on the pieces: MAGENTA = the piece's own pivot, CYAN = attachment points for children. They are measured, then erased
(filled from the nearest piece pixels) so they never show in a frame.
piece_scale resizes single pieces. Attach points are listed top→bottom, then left→right.
Writes parts/<piece>.png, parts/pieces.json {piece: {w, h, pivot:[x,y], attach:[[x,y],...]}} and parts/<sheet>_debug.jpg.
Exit 1 if a sheet's piece count differs from its name list, or a piece has no magenta pivot."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
D = os.path.abspath(sys.argv[1]); SH = os.path.join(D, 'sheets'); OUT = os.path.join(D, 'parts'); os.makedirs(OUT, exist_ok=True)
cfg = json.load(open(os.path.join(SH, 'pieces.json'))); UP = 2
def key(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; d = g - np.maximum(r, b)
    t = np.clip((d - 26) / 44.0, 0, 1); alpha = 1 - t * t * (3 - 2 * t)
    spill = np.clip((d - 2) / 30.0, 0, 1); g2 = g - spill * np.maximum(d - 2, 0)
    return np.dstack([r, g2, b]), alpha
def blobs(mask, min_px):
    lab, n = ndi.label(mask); out = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        m = lab[sl] == i + 1
        if m.sum() >= min_px: cy, cx = ndi.center_of_mass(m); out.append([sl[1].start + cx, sl[0].start + cy])
    return out
pieces, bad = {}, []
for sheet, c in cfg.items():
    if sheet.startswith('_'): continue
    img = Image.open(os.path.join(SH, sheet + '.png')).convert('RGB'); img = img.resize((img.width * UP, img.height * UP), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32); rgb, alpha = key(a)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r > 190) & (b > 190) & (g < 110); cya = (g > 190) & (b > 190) & (r < 110)
    solid = ndi.binary_opening(alpha > .5, iterations=2) | mag | cya
    lab, n = ndi.label(ndi.binary_dilation(solid, iterations=10))
    comps = [(sl, i + 1) for i, sl in enumerate(ndi.find_objects(lab)) if (lab[sl] == i + 1).sum() > 20000]
    # reading order: rows by vertical centre (a new row when a piece starts below the previous row's middle), then x
    comps.sort(key=lambda o: (o[0][0].start + o[0][0].stop) / 2); rows = []
    for o in comps:
        if rows and (o[0][0].start + o[0][0].stop) / 2 < np.mean([(p[0][0].start + p[0][0].stop) / 2 for p in rows[-1]]) + 0.35 * (o[0][0].stop - o[0][0].start): rows[-1].append(o)
        else: rows.append([o])
    comps = [o for row in rows for o in sorted(row, key=lambda o: o[0][1].start)]
    names = c['names']
    if len(comps) != len(names): bad.append(f'{sheet}: found {len(comps)} pieces, names list has {len(names)}'); continue
    dbg = Image.fromarray(a.astype(np.uint8)).resize((img.width // UP, img.height // UP)); dr = ImageDraw.Draw(dbg); sc0 = c.get('scale', 1.0)
    for (sl, lid), name in zip(comps, names):
        ys, xs = sl; pad = 12; y0, y1 = max(ys.start - pad, 0), min(ys.stop + pad, a.shape[0]); x0, x1 = max(xs.start - pad, 0), min(xs.stop + pad, a.shape[1])
        sc = c.get('piece_scale', {}).get(name, sc0)
        own = ndi.binary_dilation(lab[y0:y1, x0:x1] == lid, iterations=2)
        cm, cc = mag[y0:y1, x0:x1] & own, cya[y0:y1, x0:x1] & own
        piv, att = blobs(cm, 30), blobs(cc, 30)
        if not piv and c.get('markers', True) and name != 'side_ref': bad.append(f'{sheet}/{name}: no magenta pivot'); continue
        if not piv: piv = [[(xs.stop - xs.start) / 2 + pad, ys.stop - ys.start + pad]]   # unmarked reference figure: bottom centre
        crgb = rgb[y0:y1, x0:x1].copy(); ca = alpha[y0:y1, x0:x1] * own
        # erase markers and the dark ring the generator draws around them: a disc ~1.9× the dot's radius, filled from the nearest piece pixel outside it
        mk = np.zeros_like(cm)
        for m in (cm, cc):
            lb, nb = ndi.label(m)
            for j, sl2 in enumerate(ndi.find_objects(lb)):
                if (lb[sl2] == j + 1).sum() < 30: continue
                cy, cx = ndi.center_of_mass(lb == j + 1); rad = np.sqrt((lb == j + 1).sum() / np.pi) * 1.9 + 4
                yy, xx = np.ogrid[:mk.shape[0], :mk.shape[1]]; mk |= (yy - cy) ** 2 + (xx - cx) ** 2 <= rad * rad
        mk &= ca > .2
        sil = ndi.binary_fill_holes((ca > .5) | cm | cc)                                      # the piece's own silhouette, markers included
        # smooth fill (normalized convolution) from the piece's own light pixels around the dot: never from the dark outline, so no wedges or stains
        lum = crgb @ np.array([.299, .587, .114]); keep = (~mk) & (ca > .9) & (lum > 70)
        fill = np.zeros_like(crgb); got = np.zeros(mk.shape, bool)
        for sig in (4, 8, 16, 32, 64):
            wsum = ndi.gaussian_filter(keep.astype(np.float32), sig)
            est = np.dstack([ndi.gaussian_filter(crgb[..., k] * keep, sig) for k in range(3)]) / np.maximum(wsum, 1e-6)[..., None]
            new = mk & ~got & (wsum > .02); fill[new] = est[new]; got |= new
        crgb[mk] = fill[mk]
        ca = np.where(mk & (cm | cc), 1.0, np.where(mk & ~sil, 0.0, ca))                       # opaque only where a dot was; nothing new outside the outline
        tr = c.get('trim', {}).get(name)
        if tr:                                                                                 # cut a joint cap off (pivot unchanged)
            hh, ww = ca.shape
            if isinstance(tr, dict):
                if 'rect' in tr: x0r, y0r, x1r, y1r = tr['rect']; ca[int(y0r * hh):int(y1r * hh), int(x0r * ww):int(x1r * ww)] = 0
                tr = [tr.get('top'), tr.get('bottom')]
            if tr[0] is not None: ca[:int(tr[0] * hh)] = 0
            if tr[1] is not None: ca[int(tr[1] * hh):] = 0
        outs = [name] + [k for k, v in c.get('copies', {}).items() if v == name]          # a piece and its copies (the far limbs)
        for nm in outs:
            rgb_ = crgb * (.8 if nm in c.get('darken', []) else 1)
            im = Image.fromarray(np.dstack([rgb_, ca * 255]).clip(0, 255).astype(np.uint8))
            if sc != 1.0: im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
            im.save(os.path.join(OUT, nm + '.png'), optimize=True)
        P = lambda p: [round(p[0] * sc, 1), round(p[1] * sc, 1)]
        for nm in outs: pieces[nm] = { 'sheet': sheet, 'w': im.width, 'h': im.height, 'pivot': P(piv[0]), 'attach': sorted([P(q) for q in att], key=lambda q: (round(q[1] / 40), q[0])), 'pivots_found': len(piv) }
        dr.rectangle([x0 // UP, y0 // UP, x1 // UP, y1 // UP], outline=(255, 0, 0), width=3); dr.text((x0 // UP + 6, y0 // UP + 4), name, fill=(255, 255, 255))
        for q in piv: dr.ellipse([ (x0 + q[0]) / UP - 9, (y0 + q[1]) / UP - 9, (x0 + q[0]) / UP + 9, (y0 + q[1]) / UP + 9], outline=(255, 255, 255), width=3)
    dbg.save(os.path.join(OUT, sheet + '_debug.jpg'), quality=80)
json.dump(pieces, open(os.path.join(OUT, 'pieces.json'), 'w'), indent=1)
for k, v in pieces.items(): print(f"{k:16s} {v['w']:4d}×{v['h']:<4d} pivot {v['pivot']} attach {v['attach']}" + ('  (!) several pivots' if v['pivots_found'] > 1 else ''))
if bad: print('\n'.join('ERROR ' + b for b in bad)); sys.exit(1)
