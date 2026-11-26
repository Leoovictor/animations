"""One timeline drives everything: scenes snapped to the 120 BPM grid (0.5 s), voice lines inside them, word times
from Whisper (voices/words.json) mapped back onto the script's words, and caption blocks of 2–5 words.
Writes timeline.json (page, score, mix) and out/srt_cues.json.  Run: <LIB>/.venv/bin/python tools/timeline.py"""
import json, os, math, re, difflib, unicodedata
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = .5
lines = {L['id']: L for L in json.load(open(os.path.join(D, 'lines.json'), encoding='utf-8'))}
dur = json.load(open(os.path.join(D, 'voices', 'dur.json')))
words = json.load(open(os.path.join(D, 'voices', 'words.json'), encoding='utf-8'))
# (scene, [(line, gap before)], tail after the last line)
PLAN = [
 ('hook',    [('s01', .35)], .9),
 ('olimpo',  [('s02', .3)], .5),
 ('trav',    [('s03', .3)], .6),
 ('mundo',   [('s04', .3)], .8),
 ('trovao',  [('s05', .3)], 1.0),
 ('xango',   [('s06', .5)], .9),
 ('confr',   [('s07a', .3), ('s07b', .25)], .7),
 ('resp',    [('s08a', .4), ('s08b', .55)], 1.3),
 ('demo',    [('s09', .3)], 1.1),
 ('conseq',  [('s10', .3)], 1.1),
 ('ogum',    [('s11', .3)], .8),
 ('iansa',   [('s12a', .3), ('s12b', .3)], .9),
 ('percebe', [('s13', .3)], 1.1),
 ('ameaca',  [('s14', 1.0)], 1.3),
 ('oxala',   [('s15', .5)], .6),
 ('revel',   [('s16a', .3), ('s16b', .9)], .9),
 ('publico', [('s17', .3)], .6),
 ('mec',     [('s18', .3)], 1.6),
 ('opA',     [('s19', .3)], .5),
 ('opB',     [('s20', .3)], .6),
 ('cta',     [('s21a', .3), ('s21b', .45), ('s21c', .15)], 1.7),
]
snap = lambda t: math.ceil(t / B - 1e-6) * B
scenes, L, t = {}, {}, 0.0
for sid, ls, tail in PLAN:
    t0 = cur = t
    for lid, gap in ls:
        cur += gap; L[lid] = dict(t0=round(cur, 3), t1=round(cur + dur[lid], 3), text=lines[lid]['text']); cur += dur[lid]
    t1 = snap(cur + tail) if sid != 'cta' else round(cur + tail, 3)
    scenes[sid] = dict(t0=round(t0, 3), t1=round(t1, 3)); t = t1
DURATION = round(t, 3)
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if c.isalnum())
W = {}
for lid, l in L.items():
    sw = l['text'].split(); ww = words.get(lid) or []; times = [None] * len(sw)
    a = [norm(w) for w in sw]; b = [norm(w[0]) for w in ww]
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size): times[blk.a + k] = (max(0, ww[blk.b + k][1]), max(0, ww[blk.b + k][2]))
    # whisper misspells names (Shango, Algum…): same word count around them → take the time by position
    for i in range(len(sw)):
        if times[i] is None and len(ww) == len(sw): times[i] = (max(0, ww[i][1]), max(0, ww[i][2]))
    d = l['t1'] - l['t0']
    for i in range(len(sw)):
        if times[i] is None:
            pi = next((j for j in range(i - 1, -1, -1) if times[j]), None); ni = next((j for j in range(i + 1, len(sw)) if times[j]), None)
            s0 = times[pi][1] if pi is not None else 0; s1 = times[ni][0] if ni is not None else d
            run = [j for j in range(pi + 1 if pi is not None else 0, ni if ni is not None else len(sw))]
            k = run.index(i); step = (s1 - s0) / len(run); times[i] = (s0 + k * step, s0 + (k + 1) * step)
    W[lid] = [[w, round(l['t0'] + times[i][0], 3), round(l['t0'] + times[i][1], 3)] for i, w in enumerate(sw)]
# caption blocks: phrases (split after punctuation), each cut into balanced pieces of 2–5 words, ≤ ~22 characters
cues = []
for lid in L:
    ws = W[lid]; phrases, cur = [], []
    for i, w in enumerate(ws):
        cur.append(i)
        if re.search(r'[.!?…:,”]$', w[0]): phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    merged = []   # a one-word phrase sticks to its neighbour
    for p in phrases:
        if merged and (len(p) == 1 or len(merged[-1]) == 1) and len(' '.join(ws[k][0] for k in merged[-1] + p)) <= 26: merged[-1] = merged[-1] + p
        else: merged.append(p)
    for p in merged:
        n = len(' '.join(ws[k][0] for k in p)); k = max(1, math.ceil(n / 22), math.ceil(len(p) / 5))
        k = min(k, max(1, len(p) // 2))
        best = None
        import itertools
        for cuts in itertools.combinations(range(1, len(p)), k - 1):
            parts = [p[a:b] for a, b in zip((0,) + cuts, cuts + (len(p),))]
            if any(len(q) > 5 for q in parts): continue
            lens = [len(' '.join(ws[j][0] for j in q)) for q in parts]
            sc = max(lens) + 6 * sum(len(q) == 1 for q in parts) + 3 * sum(len(ws[q[-1]][0]) <= 2 for q in parts[:-1])
            if best is None or sc < best[0]: best = (sc, parts)
        for q in best[1]: cues.append(dict(line=lid, words=[ws[j] for j in q]))
for i, c in enumerate(cues):
    c['t0'] = round(c['words'][0][1] - .06, 3); nxt = cues[i + 1]['words'][0][1] - .06 if i + 1 < len(cues) else DURATION
    c['t1'] = round(min(nxt, c['words'][-1][2] + .45), 3); c['text'] = ' '.join(w[0] for w in c['words'])
json.dump(dict(B=B, dur=DURATION, scenes=scenes, lines=L, words=W, cues=cues), open(os.path.join(D, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
json.dump([dict(t0=c['t0'], t1=c['t1'], text=c['text'].replace('“', '').replace('”', '')) for c in cues], open(os.path.join(D, 'out', 'srt_cues.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('DUR', DURATION); print('\n'.join(f"{k:8s} {v['t0']:7.2f} → {v['t1']:7.2f}" for k, v in scenes.items()))
print('cues', len(cues), max(len(c['text']) for c in cues)); print(' | '.join(c['text'] for c in cues[:30]))
