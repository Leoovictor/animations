"""Builds data/med.json: every land polygon of Natural Earth 1:50m (world-atlas 2.0.2, public domain) clipped to
the Mediterranean box, merged as one list of rings [lon, lat] (2 decimals), lightly simplified. python3 tools/med_map.py"""
import json, pathlib, urllib.request
SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "med.json"
BOX = (-14.0, 24.0, 50.0, 60.0)
def clip(pts, x0, y0, x1, y1):
    def cut(pts, inside, inter):
        out = []
        for i, p in enumerate(pts):
            q = pts[i - 1]
            if inside(p):
                if not inside(q): out.append(inter(q, p))
                out.append(p)
            elif inside(q): out.append(inter(q, p))
        return out
    ax = lambda x: (lambda a, b: [x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])])
    ay = lambda y: (lambda a, b: [a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y])
    for inside, inter in ((lambda p: p[0] >= x0, ax(x0)), (lambda p: p[0] <= x1, ax(x1)), (lambda p: p[1] >= y0, ay(y0)), (lambda p: p[1] <= y1, ay(y1))):
        if not pts: break
        pts = cut(pts, inside, inter)
    return pts if len(pts) >= 3 else None
def dp(pts, eps):
    if len(pts) < 4: return pts
    a, b = pts[0], pts[-1]; dmax, k = 0, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]; dx, dy = b[0] - a[0], b[1] - a[1]; L = (dx * dx + dy * dy) ** .5 or 1e-9
        d = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L
        if d > dmax: dmax, k = d, i
    if dmax > eps: return dp(pts[:k + 1], eps)[:-1] + dp(pts[k:], eps)
    return [a, b]
topo = json.load(urllib.request.urlopen(SRC))
(sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
arcs = []
for a in topo["arcs"]:
    x = y = 0; pts = []
    for dx, dy in a: x += dx; y += dy; pts.append([x * sx + tx, y * sy + ty])
    arcs.append(pts)
def ring(ix):
    pts = []
    for i in ix:
        a = arcs[~i][::-1] if i < 0 else arcs[i]
        pts += a[1:] if pts else a
    return pts
rings = []
for g in topo["objects"]["countries"]["geometries"]:
    polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"] if g["type"] == "MultiPolygon" else []
    for p in polys:
        r = ring(p[0])
        xs = [q[0] for q in r]; ys = [q[1] for q in r]
        if max(xs) < BOX[0] or min(xs) > BOX[2] or max(ys) < BOX[1] or min(ys) > BOX[3]: continue
        c = clip(r[:-1], *BOX)
        if not c: continue
        m = len(c) // 2; c = dp(c[:m + 1], 0.03)[:-1] + dp(c[m:] + c[:1], 0.03)
        if len(c) < 4: continue
        area = abs(sum(c[i][0] * c[i + 1][1] - c[i + 1][0] * c[i][1] for i in range(len(c) - 1))) / 2
        if area < 0.02: continue
        rings.append([[round(x, 2), round(y, 2)] for x, y in c])
OUT.write_text(json.dumps(rings, separators=(",", ":")))
print(len(rings), "rings", sum(map(len, rings)), "points", OUT.stat().st_size // 1024, "KB")
