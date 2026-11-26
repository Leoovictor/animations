"""Score, paper foley and voice for "O Grande Cisma" (Comic History Cartoon, vertical). Writes out/mix.wav.
Run: LIB=<library> <LIB>/.venv/bin/python audio.py   (needs events.json, timeline.json, voices/)
Music, 100 bpm in D: two accents that stay with the two Churches all film long —
  Rome = recorder over a soft organ (a chant-like tune in D dorian);
  Constantinople = solo violin over a held low drone (the "ison"), in D with E-flat and F-sharp.
The fights run on a pizzicato groove with bassoon, woodblock and xylophone stings; 1204 drops every comic sound:
gong, timpani and low strings. 1965 turns to D major (harp, strings, both tunes at once). The end lands back on the
opening's tremolo D so the loop joins."""
import os, sys, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf, soxr
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, bp, lp, hp, t_, norm, compress, whoosh, thump, click, creak, ding, brown
D = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(D, 'events.json'))); TL = json.load(open(os.path.join(D, 'timeline.json'), encoding='utf-8'))
DUR = float(EV['dur']); N = int(round(DUR * SR)); ev = EV['ev']; SC = TL['scenes']; B = 60 / 100
S.seed(7); rng = np.random.default_rng(7)
PAD = SR * 6
fx = np.zeros((N + PAD, 2), np.float32); vo = np.zeros((N + PAD, 2), np.float32)
score = []
def E(t, inst, p, d, v, pan=0, g=1.0): score.append((t, inst, p, d, v, pan, g))
sc = lambda k: (SC[k]['t0'], SC[k]['t1'])
words = TL['words']
def wt(lid, w, n=0):
    k = 0
    for x in words[lid]:
        if x[0].lower().strip('.,:;?!…').startswith(w.lower()):
            if k == n: return x[1]
            k += 1
    raise KeyError(w)

# ---------------------------------------------------------------- music pieces
CH = {'Dm': ['D2', 'A2', 'D4', 'F4', 'A4'], 'C': ['C2', 'G2', 'C4', 'E4', 'G4'], 'Bb': ['Bb1', 'F2', 'Bb3', 'D4', 'F4'], 'A': ['A1', 'E2', 'A3', 'C#4', 'E4'],
      'Gm': ['G1', 'D2', 'G3', 'Bb3', 'D4'], 'D': ['D2', 'A2', 'D4', 'F#4', 'A4'], 'G': ['G1', 'D2', 'G3', 'B3', 'D4'], 'F': ['F1', 'C2', 'F3', 'A3', 'C4']}
def groove(t0, t1, prog, v=.5, tamb=False, wood=True):
    """pizzicato bass on 1 and 3, a pizz chord on the off-beats, woodblock on 2 and 4; one chord a bar (4 beats)"""
    k = 0
    while t0 + k * B < t1 - .05:
        t = t0 + k * B; ch = CH[prog[(k // 4) % len(prog)]]; b = k % 4
        if b in (0, 2): E(t, 'contrabass_pizz', ch[0] if b == 0 else ch[1], .5, v * .9, -.05, .9)
        E(t + B / 2, 'violins_pizz', ch[3 + (k % 2)], .3, v * .55, .25, .5); E(t + B / 2, 'violas_pizz', ch[2], .3, v * .5, -.2, .45)
        if wood and b in (1, 3): E(t, 'woodblock', None, None, v * .45, .3, .35)
        if tamb and b in (1, 3): E(t + B / 2, 'tambourine', None, None, v * .4, -.3, .3)
        k += 1
def bassoon_line(t0, notes, v=.45, g=.5):
    for b, n, l in notes: E(t0 + b * B, 'bassoon_stac' if l <= .5 else 'bassoon', n, l * B * .9, v, -.15, g)
ROME = [(0, 'D5', 1), (1, 'E5', 1), (2, 'F5', 1), (3, 'G5', 1), (4, 'A5', 2), (6, 'G5', 1), (7, 'F5', 1), (8, 'E5', 2), (10, 'D5', 2)]
GREEK = [(0, 'D5', 1), (1, 'Eb5', .5), (1.5, 'F#5', 1.5), (3, 'G5', 1), (4, 'F#5', 1), (5, 'Eb5', 1), (6, 'D5', 2)]
def rome(t0, v=.4, g=.45, n=None):
    for b, p, l in (ROME if n is None else ROME[:n]): E(t0 + b * B, 'recorder', p, l * B * .95, v, -.3, g)
    E(t0, 'organ_soft', 'D3', 8 * B, .3, -.2, .25); E(t0, 'organ_soft', 'A3', 8 * B, .3, -.1, .2)
def greek(t0, v=.4, g=.42, n=None):
    for b, p, l in (GREEK if n is None else GREEK[:n]): E(t0 + b * B, 'violin', p, l * B * .95, v, .3, g)
    E(t0, 'cellos', 'D2', 8 * B, .35, .2, .3); E(t0, 'cellos', 'A2', 8 * B, .3, .25, .22)
def sting(t, up=True):   # a xylophone flourish
    for i, p in enumerate(['D5', 'F5', 'A5', 'D6'] if up else ['D6', 'A5', 'F5', 'D5']): E(t + i * .06, 'xylophone', p, .25, .45, .2, .35)

# hook: a held tremolo D (the loop point), the cut, then the groove
h0, h1 = sc('hook'); tsplit = wt('l01', 'meio') + .13
E(0, 'violins_trem', 'D4', tsplit, .3, .15, .35); E(0, 'violas', 'A3', tsplit, .25, -.15, .3)
E(tsplit, 'timpani', 'D2', 1.6, .8, 0, .7); E(tsplit, 'clash', None, None, .45, 0, .35); E(tsplit, 'tuba', 'D1', .8, .6, 0, .5); E(tsplit, 'trombone', 'D2', .8, .5, .1, .45)
groove(tsplit + .9, wt('l02', 'estranho') + .3, ['Dm', 'Dm', 'C', 'A'], .45)
E(wt('l02', 'excomunh') - .3, 'violins_trem', 'Eb4', 3.5, .22, .2, .3); E(wt('l02', 'morrido'), 'timpani', 'A1', 1.0, .6, 0, .5)
groove(wt('l03', 'Fica'), h1, ['Dm', 'Bb', 'C', 'A'], .45)
# mapa: one map (both tunes, softly), then each Church its own tune, drifting apart
m0, m1 = sc('mapa'); E(m0, 'harp', 'D3', 3, .45, -.2, .4); E(m0 + .3, 'harp', 'A3', 3, .4, 0, .35); E(m0 + .6, 'harp', 'F4', 3, .4, .2, .35)
rome(wt('l04', 'Ocidente') - .2); greek(wt('l04', 'Oriente') - .1)
groove(wt('l05', 'E') , m1, ['Dm', 'C', 'Bb', 'A'], .45)
bassoon_line(wt('l05', 'afastando') - .3, [(0, 'D3', 1), (1, 'C3', 1), (2, 'Bb2', 1), (3, 'A2', 2)])
# the three fights: bell, groove with tambourine, stings
for k in ['quem', 'filioque', 'pao']:
    a, b = sc(k); E(a + .1, 'tubular_bells', 'D5', 2.0, .55, 0, .4); E(a + .1, 'triangle', None, None, .5, .3, .3)
    groove(a + 1.2, b, ['Dm', 'Gm', 'C', 'A'] if k != 'filioque' else ['Dm', 'Bb', 'Gm', 'A'], .5, tamb=True)
rome(wt('l06', 'Roma') - .1, n=5); greek(wt('l06', 'Constantinopla') - .1, n=4)
sting(wt('l06', 'autoridade') - .3); sting(wt('l06', 'primeiro') - .1, up=False)
rome(wt('l07', 'Credo') - .2, v=.32, n=7); sting(wt('l07', 'Filioque') - .1); greek(wt('l08', 'No') - .1, n=4)
rome(wt('l09', 'Roma') - .05, n=4); greek(wt('l09', 'Constantinopla') - .05, n=4)
# bula: the envoys' march (snare, tuba), the slap, the counter-stamp
b0, b1 = sc('bula'); tsl = wt('l10', 'bula') - .05
k = 0
while b0 + .5 + k * B < tsl:
    t = b0 + .5 + k * B; E(t, 'snare', None, None, .3 if k % 2 else .4, .1, .35); E(t, 'tuba_stac', 'D2' if k % 4 < 2 else 'A1', .3, .5, -.1, .45) if k % 2 == 0 else None; k += 1
E(tsl, 'timpani', 'D2', 1.0, .7, 0, .55); greek(wt('l11', 'patriarca') - .2, v=.45)
groove(wt('l11', 'patriarca') - .2, b1, ['Gm', 'A', 'Dm', 'A'], .45, wood=False)
# morto: a sad, comic bassoon and one tolling bell
o0, o1 = sc('morto'); E(wt('l12', 'morrido') - .15, 'tubular_bells', 'D4', 4, .5, -.2, .35)
bassoon_line(o0 + .3, [(0, 'A3', 1), (1, 'G3', 1), (2, 'F3', 1), (3, 'E3', 1), (4, 'D3', 1), (5, 'C#3', 1), (6, 'D3', 3)], .5, .55)
for i in range(3): E(wt('l12', 'três') - .1 + i * .3, 'glockenspiel', ['A6', 'F6', 'D6'][i], .5, .35, .3, .25)
# lento: a clock, a slow line
l0, l1 = sc('lento'); k = 0
while l0 + k * B < l1 - .1: E(l0 + k * B, 'claves' if k % 2 else 'woodblock', None, None, .3, .2 * (-1) ** k, .3); k += 1
E(l0, 'cellos', 'D2', l1 - l0, .3, 0, .3); bassoon_line(l0 + 1.2, [(0, 'D3', 2), (2, 'E3', 2), (4, 'F3', 2), (6, 'E3', 4)], .4, .45)
# 1204: no comic sound
s0, s1 = sc('s1204'); tw = TL['lines']['l15']['t0']
E(s0 + .05, 'gong', None, None, .7, 0, .6); E(wt('l14', 'golpe') - .2, 'gran_cassa', None, None, .8, 0, .7)
for n, p in [('contrabass', 'D1'), ('cellos', 'D2'), ('cellos', 'A2'), ('violas', 'F3')]: E(s0, n, p, s1 - s0 - .3, .4, 0, .35)
for i in range(int((tw - s0) / (2 * B))): E(s0 + 1.2 + i * 2 * B, 'timpani', 'D2' if i % 2 == 0 else 'A1', .8, .45 + .1 * (i % 2), 0, .45)
for b, p, l in [(0, 'A4', 2), (2, 'Bb4', 1), (3, 'A4', 1), (4, 'G4', 1), (5, 'F4', 1), (6, 'E4', 2), (8, 'D4', 4)]: E(wt('l14', 'cruzados') - .2 + b * B, 'violin', p, l * B * .95, .42, .2, .45)
E(tw + .1, 'violins_trem', 'Eb5', 3.6, .25, -.2, .3); E(wt('l15', 'fechar') - .2, 'timpani', 'D2', 1.6, .6, 0, .5)
# 1965: D major, both tunes together
f0, f1 = sc('s1965'); E(f0 + .1, 'glockenspiel', 'A6', 2, .35, .3, .3)
for i in range(int((f1 - f0 - .5) / (B / 2))):
    E(f0 + .5 + i * B / 2, 'harp', ['D3', 'A3', 'D4', 'F#4', 'A4', 'F#4', 'D4', 'A3'][i % 8] if (i // 16) % 2 == 0 else ['G2', 'D3', 'G3', 'B3', 'D4', 'B3', 'G3', 'D3'][i % 8], 1.4, .35, -.2 + .05 * (i % 8), .35)
for n, p in [('violins', 'F#4'), ('violas', 'D4'), ('cellos', 'D3')]: E(f0 + .5, n, p, f1 - f0 - .8, .3, 0, .22)
tr = wt('l16', 'retiraram') - .1
for b, p, l in ROME: E(tr + b * B, 'recorder', p.replace('F5', 'F#5'), l * B * .95, .4, -.3, .42)
for b, p, l in [(0, 'A5', 2), (2, 'G5', 1), (3, 'F#5', 1), (4, 'E5', 2), (6, 'D5', 4)]: E(tr + b * B, 'violin', p, l * B * .95, .38, .3, .38)
E(wt('l16', '1054') + .3, 'tubular_bells', 'D5', 3, .5, 0, .35); E(wt('l16', '1054') + .3, 'glockenspiel', 'F#6', 2, .35, .3, .25)
# hoje: gentle groove; the differences end on an open chord
j0, j1 = sc('hoje'); groove(j0 + .3, j1, ['D', 'G', 'D', 'A'], .4, wood=False)
rome(wt('l17', 'católicos') - .1, v=.32, n=4); greek(wt('l17', 'ortodoxos') - .05, v=.32, n=4)
E(wt('l17', 'diferenças'), 'violins_trem', 'Eb5', 2.2, .22, .2, .25)
# ret: the comment sticker, rewind, and back to the opening tremolo D (the loop joins)
r0, r1 = sc('ret'); groove(r0, wt('l18', 'Porque') - .3, ['Dm', 'C', 'Bb', 'A'], .42)
E(wt('l18', 'Porque') - .3, 'violins_trem', 'D4', r1 - wt('l18', 'Porque') + .3, .3, .15, .35); E(wt('l18', 'Porque') - .3, 'violas', 'A3', r1 - wt('l18', 'Porque') + .3, .25, -.15, .3)

# ---------------------------------------------------------------- paper foley (synthesized)
def paper_slap(v=1.0, size=1.0):
    tt = t_(.45); crack = hp(rng.standard_normal(len(tt)), 1800) * np.exp(-tt / .006)
    body = bp(rng.standard_normal(len(tt)), 500, 4500) * np.exp(-tt / (.035 * size)); knock = np.sin(2 * np.pi * 95 * tt * (1 - .4 * tt)) * np.exp(-tt / (.06 * size))
    return norm(crack * .9 + body + knock * .8 * size) * v
def snip(v=1.0):
    tt = t_(.09); a = hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt / .002)
    ring = np.sin(2 * np.pi * 4300 * tt) * np.exp(-tt / .012) * .35 + np.sin(2 * np.pi * 6100 * tt) * np.exp(-tt / .008) * .2
    return norm(a + np.roll(a, int(.018 * SR)) * .6 + ring) * v
def crinkle(d, v=1.0, density=.004):
    n = int(d * SR); x = (rng.random(n) < density) * rng.standard_normal(n) * 3; x = bp(x, 1500, 7500) + bp(rng.standard_normal(n), 800, 3000) * .08
    return x * np.sin(np.pi * np.arange(n) / n) ** .6 * v
def rip(d, v=1.0):
    n = int(d * SR); tt = np.arange(n) / SR; x = (rng.random(n) < .02 + .2 * (tt / d)) * rng.standard_normal(n) * 2
    x = bp(x, 900, 7000) + bp(rng.standard_normal(n), 1200, 4000) * .25
    return norm(x * np.minimum(1, tt / .02) * np.minimum(1, (d - tt) / .04)) * v
def slide_whistle(d, f0, f1, v=1.0):
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d); ph = np.cumsum(f) / SR * 2 * np.pi
    return (np.sin(ph) + .25 * np.sin(2 * ph)) * np.minimum(1, tt / .02) * np.minimum(1, (d - tt) / .04) * v
def puff(v=1.0): tt = t_(.32); return norm(bp(rng.standard_normal(len(tt)), 400, 2600) * (tt / .03).clip(0, 1) * np.exp(-tt / .09)) * v
def page_slide(d, v=1.0): n = int(d * SR); return lp(bp(rng.standard_normal(n), 300, 3000) * np.sin(np.pi * np.arange(n) / n) ** 2, 4000) * v
def joint(v=1.0, pitch=1.0): return lp(click(pitch=pitch, v=1.0), 5000) * v
def fire(d, v=1.0):
    n = int(d * SR); x = lp(brown(d + .1)[:n], 400) * .6 + (rng.random(n) < .003) * rng.standard_normal(n) * 2
    x = bp(x, 80, 5000); return norm(x * np.minimum(1, np.arange(n) / (SR * .8)) * np.minimum(1, (n - np.arange(n)) / (SR * .8))) * v
for e in ev:
    t, k = e['t'], e['type']
    if k == 'vo':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = soxr.resample(y, sr, SR, quality='HQ'); y = compress(norm(hp(y, 80), .9), thr=.25, ratio=3.0); add(vo, y, t, .9, 0)
    elif k == 'slide': add(fx, page_slide(.45, .14), t - .05, 1, 0); add(fx, hp(whoosh(.35, 1), 500) * .12, t, 1, 0)
    elif k == 'tag': add(fx, paper_slap(.22, .5), t + .2, 1, -.2)
    elif k == 'snip':
        for j in range(6): add(fx, snip(.28), t + j * e['d'] / 6, 1, .1)
    elif k == 'rip': add(fx, rip(.45, .5), t, 1, 0)
    elif k == 'hit': add(fx, thump(.5, 70), t, 1, 0)
    elif k in ('pop', 'pin', 'sticker', 'reveal'): add(fx, joint(.13, 1.2), t, 1, .1); add(fx, paper_slap(.12, .35), t + .02, 1, .1); add(fx, ding(.05), t + .02, 1, .2) if k in ('pin', 'reveal') else None
    elif k == 'tug': add(fx, crinkle(.6, .18, .02), t, 1, 0)
    elif k == 'unroll': add(fx, crinkle(.6, .16, .008), t, 1, 0); add(fx, page_slide(.5, .1), t, 1, 0)
    elif k == 'quill': add(fx, hp(crinkle(.5, .12, .03), 2500), t, 1, -.2)
    elif k == 'seal': add(fx, thump(.35, 110), t, 1, .3); add(fx, paper_slap(.15, .5), t, 1, .3)
    elif k == 'stamp': add(fx, thump(.5, 95), t, 1, 0); add(fx, paper_slap(.45, .8), t, 1, 0)
    elif k == 'boing': add(fx, slide_whistle(.28, 500, 1300, .07), t, 1, -.3)
    elif k == 'whoosh': add(fx, hp(whoosh(.4, 1), 400) * .2, t, 1, 0)
    elif k == 'swish': add(fx, hp(whoosh(.3, 1), 600) * .18, t, 1, .2)
    elif k == 'wash': add(fx, page_slide(.45, .1), t, 1, 0)
    elif k == 'slidepaper': add(fx, page_slide(e['d'], .07), t, 1, 0); add(fx, creak(.05), t + e['d'] * .5, 1, 0)
    elif k == 'shout': add(fx, joint(.1, .9), t, 1, 0)
    elif k == 'grow': add(fx, slide_whistle(e['d'], 400, 1200, .06), t, 1, 0)
    elif k == 'squash': add(fx, slide_whistle(.35, 1200, 350, .07), t, 1, 0); add(fx, thump(.3, 120), t + .35, 1, 0)
    elif k == 'paste': add(fx, paper_slap(.25, .5), t, 1, .2); add(fx, crinkle(.2, .1, .02), t + .05, 1, .2)
    elif k == 'ding': add(fx, ding(.06), t, 1, -.3)
    elif k == 'puff': add(fx, puff(.2), t, 1, .3); add(fx, slide_whistle(.3, 300, 700, .05), t, 1, .3)
    elif k == 'steps':
        for j in range(int(e['d'] / .17)): add(fx, joint(.09, .8 + .15 * (j % 2)), t + j * .17, 1, 0)
    elif k == 'slap': add(fx, paper_slap(.8, 1.4), t, 1, 0)
    elif k == 'bellsad': pass
    elif k == 'flip': add(fx, crinkle(.18, .2, .03), t, 1, .3); add(fx, hp(whoosh(.2, 1), 1500) * .08, t + .05, 1, .4)
    elif k == 'tick': pass
    elif k == 'slow': add(fx, slide_whistle(1.2, 700, 500, .03), t, 1, 0)
    elif k == 'fire': add(fx, fire(e['d'], .12), t, 1, 0)
    elif k == 'drum': pass
    elif k == 'march':
        for j in range(int(e['d'] / .3)): add(fx, thump(.25, 80), t + j * .3, 1, -.2)
    elif k == 'tear': add(fx, rip(1.0, .45), t, 1, 0)
    elif k == 'peel':
        for j in range(3): add(fx, rip(.3, .25), t + j * .12, 1, -.2 + .2 * j)
    elif k == 'cheer': add(fx, joint(.1, 1.0), t, 1, -.1); add(fx, joint(.1, 1.1), t + .2, 1, .1)
    elif k == 'bridge': add(fx, paper_slap(.2, .5), t, 1, 0); add(fx, ding(.04), t, 1, 0)
    elif k == 'crack': add(fx, creak(.08), t, 1, 0)
    elif k == 'rewind':
        n = int(e['d'] * SR); x = bp(rng.standard_normal(n), 600, 4000) * (np.sin(2 * np.pi * 9 * np.arange(n) / SR) * .5 + .5); add(fx, x * .05, t, 1, 0)

used = sorted({x[1] for x in score})
music = S.render(score, dur=DUR + 2, master=False)[:N]
if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
music = S.room(music, size=.35, mix=.16)
vo, fx = vo[:N], fx[:N]
# voice on top: music ducks (mid band more) while the voice speaks
env = np.abs(vo).max(1); kk = int(.03 * SR); env = np.convolve(env, np.ones(kk) / kk, 'same')
act = np.clip(env / (np.percentile(env[env > 1e-4], 50) + 1e-9), 0, 1)
dk = np.zeros(N); a = 0.0; att, rel = np.exp(-1 / (.05 * SR)), np.exp(-1 / (.35 * SR))
for i in range(0, N, 48):
    x = act[i]; a = att * a + (1 - att) * x if x > a else rel * a + (1 - rel) * x; dk[i:i + 48] = a
mid = np.stack([bp(music[:, c], 300, 4000) for c in (0, 1)], 1)
music_d = (music - mid * (1 - 10 ** (-7 / 20)) * dk[:, None]) * (1 - (1 - 10 ** (-3 / 20)) * dk[:, None])
speak = dk > .5; vr = np.sqrt((vo[speak] ** 2).mean()); mr = np.sqrt((music_d[speak] ** 2).mean())
mg = (vr / 10 ** (11 / 20)) / (mr + 1e-9)
mix = vo + music_d * mg + fx * (1 - .3 * dk[:, None])
mix = np.stack([compress(mix[:, 0], thr=.3, ratio=2.5, att=.002), compress(mix[:, 1], thr=.3, ratio=2.5, att=.002)], 1)
mix = mix / np.abs(mix).max() * .9; mix = np.stack([limit(mix[:, 0], ceil=.9), limit(mix[:, 1], ceil=.9)], 1)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
open(os.path.join(D, 'CREDITS_music.txt'), 'w').write('\n'.join(S.credits(used)) + '\n')
print('mix', mix.shape, 'music gain', round(float(mg), 3), 'instruments:', ', '.join(used))
