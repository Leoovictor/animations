"""One timeline drives everything: scenes snapped to the 100 BPM grid, voice lines placed inside them,
word times from Whisper (voices/words.json), caption cues. Writes timeline.json (read by the page, the score and the mix)
and cisma.srt.  Run: <LIB>/.venv/bin/python tools/timeline.py"""
import json, os, math, re, sys, unicodedata
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = 60 / 100
lines = {L['id']: L for L in json.load(open(os.path.join(D, 'lines.json'), encoding='utf-8'))}
dur = json.load(open(os.path.join(D, 'voices', 'dur.json')))
try: words = json.load(open(os.path.join(D, 'voices', 'words.json'), encoding='utf-8'))
except FileNotFoundError: words = {}

# (scene id, [(line, gap before it)], tail after the last line, min length in beats)
PLAN = [
    ('hook',     [('l01', .45), ('l02', .5), ('l03', .45)], .9, 0),
    ('mapa',     [('l04', .4), ('l05', .45)], 1.0, 0),
    ('quem',     [('l06', .35)], 1.3, 0),
    ('filioque', [('l07', .35), ('l08', .45)], .7, 0),
    ('pao',      [('l09', .35)], 1.0, 0),
    ('bula',     [('l10', .4), ('l11', .4)], 1.0, 0),
    ('morto',    [('l12', .3)], 1.3, 0),
    ('lento',    [('l13', .4)], .6, 0),
    ('s1204',    [('l14', .5), ('l15', .45)], 1.0, 0),
    ('s1965',    [('l16', .5)], .8, 0),
    ('hoje',     [('l17', .4)], .7, 0),
    ('ret',      [('l18', .4)], .35, 0),
]
snap = lambda t: math.ceil(t / B - 1e-6) * B
scenes, L, t = {}, {}, 0.0
for sid, ls, tail, minb in PLAN:
    t0 = t; cur = t0
    for lid, gap in ls:
        cur += gap; L[lid] = dict(t0=round(cur, 3), t1=round(cur + dur[lid], 3), text=lines[lid]['text']); cur += dur[lid]
    end = max(cur + tail, t0 + minb * B)
    t1 = snap(end) if sid != 'ret' else end
    scenes[sid] = dict(t0=round(t0, 4), t1=round(t1, 4), beat0=round(t0 / B))
    t = t1
DURATION = round(t, 3)

def norm(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if c.isalnum())
# word table per line: [word, abs t0, abs t1]; Whisper's words are mapped back onto the script's words by position
W = {}
import difflib
for lid, l in L.items():
    sw = l['text'].split(); ww = words.get(lid) or []
    times = [None] * len(sw)
    if ww:
        a = [norm(w) for w in sw]; b = [norm(w[0]) for w in ww]
        for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
            for k in range(blk.size): times[blk.a + k] = (max(0, ww[blk.b + k][1]), max(0, ww[blk.b + k][2]))
    d = l['t1'] - l['t0']; n = len(l['text']); pos = 0; est = []
    for w in sw:
        k = l['text'].index(w, pos); est.append((d * k / n, d * (k + len(w)) / n)); pos = k + len(w)
    # unmatched words: interpolate between matched neighbours (fallback: character position)
    for i in range(len(sw)):
        if times[i] is None:
            pi = next((j for j in range(i - 1, -1, -1) if times[j]), None); ni = next((j for j in range(i + 1, len(sw)) if times[j]), None)
            if pi is not None and ni is not None:
                f = (i - pi) / (ni - pi); a0 = times[pi][1] + (times[ni][0] - times[pi][1]) * f; times[i] = (a0, a0 + .15)
            else: times[i] = est[i]
    W[lid] = [[w, round(l['t0'] + times[i][0], 3), round(l['t0'] + times[i][1], 3)] for i, w in enumerate(sw)]

# caption cues: split at sentence ends (and at a comma when the piece is long); one card at a time
cues = []
for lid in sorted(L):
    ws = W[lid]; pieces, cur = [], []
    for i, w in enumerate(ws):
        cur.append(i)
        txt = ' '.join(ws[k][0] for k in cur)
        if re.search(r'[.!?…]$', w[0]) or (w[0].endswith(',') and len(txt) > 34): pieces.append(cur); cur = []
    if cur: pieces.append(cur)
    # merge pieces that are too short to read
    merged = []
    for p in pieces:
        if merged and (ws[merged[-1][-1]][2] - ws[merged[-1][0]][1] < 1.2 or len(' '.join(ws[k][0] for k in p)) < 12) and len(' '.join(ws[k][0] for k in merged[-1] + p)) <= 70:
            merged[-1] = merged[-1] + p
        else: merged.append(p)
    final = []
    txt = lambda q: ' '.join(ws[k][0] for k in q)
    def cut(p):   # a piece longer than two caption lines splits at the word boundary nearest its middle, again if needed
        if len(txt(p)) <= 60 or len(p) < 2: return [p]
        best = min(range(1, len(p)), key=lambda i: abs(len(txt(p[:i])) - len(txt(p[i:]))) - (6 if ws[p[i - 1]][0][-1] in ',;:' else 0) + (9 if len(ws[p[i - 1]][0]) <= 3 else 0))
        return cut(p[:best]) + cut(p[best:])
    for p in merged: final += cut(p)
    merged = final
    for p in merged: cues.append(dict(line=lid, t0=ws[p[0]][1] - .08, t1=ws[p[-1]][2], text=' '.join(ws[k][0] for k in p)))
cues.sort(key=lambda c: c['t0'])
for i, c in enumerate(cues):
    nxt = cues[i + 1]['t0'] if i + 1 < len(cues) else DURATION
    c['t1'] = min(nxt - .04, max(c['t1'] + .6, c['t0'] + 1.8))
    c['t0'], c['t1'] = round(c['t0'], 3), round(c['t1'], 3)

json.dump(dict(B=B, dur=DURATION, scenes=scenes, lines=L, words=W, cues=cues), open(os.path.join(D, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
srt_all = [dict(t0=c['t0'], t1=c['t1'], text=c['text']) for c in cues]
srt_all.sort(key=lambda c: c['t0'])
json.dump(srt_all, open(os.path.join(D, 'out', 'srt_cues.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('DUR', DURATION, '\n' + '\n'.join(f"{k:7s} {v['t0']:7.2f} → {v['t1']:7.2f}" for k, v in scenes.items()))
short = [c for c in cues if c['t1'] - c['t0'] < 1.8]
print('cues', len(cues), 'short', short)
