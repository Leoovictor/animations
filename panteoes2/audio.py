"""Score, sound effects and voice for "O Encontro dos Panteões — Ep. 02". Writes out/mix.wav.
Run: LIB=<library> <LIB>/.venv/bin/python audio.py
Score: original, D minor, 120 BPM, sampled orchestra (CC0) + a few synthesised game chips. Cinematic percussion only;
no ceremonial songs, sacred rhythms or chants of any tradition are used as decoration. Sections follow the script's music direction:
impact → adventure/discovery → percussion and tension → epic clash → character themes → dark suspense → calm light →
videogame → rising suspense that stops dead with the cut to black."""
import os, sys, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf, soxr
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, bp, lp, hp, t_, norm, compress, whoosh, thump, creak, heartbeat, brown, click, clack, crash, ding, pop, rumble, roar
D = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(D, 'events.json'))); TL = json.load(open(os.path.join(D, 'timeline.json'), encoding='utf-8'))
DUR = float(EV['dur']); N = int(round(DUR * SR)); ev = EV['ev']; SC = TL['scenes']
S.seed(5); rng = np.random.default_rng(5); PAD = SR * 8
mus = np.zeros((N + PAD, 2), np.float32); fx = np.zeros((N + PAD, 2), np.float32); vo = np.zeros((N + PAD, 2), np.float32)
score = []
def E(t, inst, p, d, v, pan=0, g=1.0): score.append((round(t, 4), inst, p, d, v, pan, g))
def H(t, inst, var, v, pan=0, g=1.0): score.append((round(t, 4), inst, var, None, v, pan, g))
sc = lambda k: (SC[k]['t0'], SC[k]['t1'])
L0 = lambda i: TL['lines'][i]['t0']; L1 = lambda i: TL['lines'][i]['t1']
B = .5
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def nn(p): n = NOTE[p[0]] + (1 if '#' in p else -1 if 'b' in p[1:2] else 0); return n + 12 * int(p[-1])
def name(m): return ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][m % 12] + str(m // 12)
PROG = [('D', [0, 3, 7]), ('Bb', [0, 4, 7]), ('F', [0, 4, 7]), ('C', [0, 4, 7])]   # i – VI – III – VII
def root(i, octv=2): r, _ = PROG[i % 4]; return nn(r + str(octv))
def chord(i, octv=3): r, q = PROG[i % 4]; b = nn(r + str(octv)); return [name(b + x) for x in q]

# ---------------------------------------------------------------- building blocks
def ostinato(t0, t1, v=.45, inst='violins_spic', octv=4, low=True):
    k = 0; t = t0
    while t < t1 - 1e-6:
        i = int((t - t0) // 2); r = root(i, octv); pat = [0, 0, 7, 0, 12, 0, 7, 0][k % 8]
        E(t, inst, name(r + pat), B / 2 * .9, v * (1 if k % 4 == 0 else .8), .25)
        if low and k % 2 == 0: E(t, 'cellos_spic', name(root(i, 2) + (0 if k % 4 == 0 else 7)), B * .45, v * .9, -.25)
        t += B / 2; k += 1
def pads(t0, t1, v=.25, inst='violins', octv=3):
    t = t0; i = 0
    while t < t1 - 1e-6: d = min(2, t1 - t); [E(t, inst, p, d, v, -.3 + .3 * j, .6) for j, p in enumerate(chord(i, octv))]; E(t, 'contrabass', name(root(i, 1)), d, v * 1.2, 0, .6); t += 2; i += 1
def drums(t0, t1, v=.6, busy=1):
    t = t0; k = 0
    while t < t1 - 1e-6:
        if k % 8 == 0: H(t, 'gran_cassa', 'hit', v, 0, .9)
        if k % 4 == 2: H(t, 'toms', 'low_mallet', v * .9, -.2)
        if busy and k % 8 in (5, 7): H(t, 'toms', 'high_mallet', v * .7, .2)
        if busy > 1 and k % 2 == 1: H(t, 'frame_drum', None, v * .45, .3)
        t += B / 2; k += 1
def horns(t0, notes, step=1.0, v=.5, inst='horn'):
    for j, p in enumerate(notes):
        if p: E(t0 + j * step, inst, p, step * .95, v, -.1, .8)
def stab(t, v=.8):   # orchestral hit
    for p in ['D2', 'D3', 'A3', 'D4']: E(t, 'trombone' if p[-1] in '23' else 'trumpet', p, .45, v, 0, .8)
    H(t, 'gran_cassa', 'hit', v); H(t, 'clash', 'crash', v * .6); E(t, 'timpani', 'D2', 1.2, v)
def drone(t0, t1, notes=('D2', 'A2'), v=.3):
    for j, p in enumerate(notes): E(t0, 'cellos', p, t1 - t0, v, -.2 + .4 * j, .6)

W_ = TL['words']
def wt_(lid, word):
    import unicodedata
    n = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if c.isalnum())
    for w in W_[lid]:
        if n(w[0]).startswith(n(word)): return w[1]
    raise KeyError(word)
# ---------------------------------------------------------------- the score, section by section (Ep. 02)
cut = [e['t'] for e in ev if e['type'] == 'cutblack'][0]
stops = [(e['t'], e['t'] + .8) for e in ev if e['type'] in ('musicstop', 'silence')] + [(L1('s03') + .1, L1('s03') + .9)]
h0, h1 = sc('hook'); stab(.25, .9); drone(.6, h1, ('D2', 'A2'), .3); E(.6, 'violins_trem', 'D5', h1 - .6, .22, .2, .45); drums(2.0, h1 - .5, .55, 1)   # impact and thunder
r0 = sc('recap')[0]; t1 = sc('terr')[1]                                  # adventure / discovery
pads(r0, t1, .22, 'violins', 4); ostinato(r0, sc('queda')[1], .4); drums(r0, L1('s03'), .55, 1)
horns(r0 + .5, ['D4', 'F4', 'A4', None, 'G4', 'F4', 'E4', None, 'D4', 'F4', 'A4', 'C5'], .5, .45)
q0 = sc('terr')[0]
for j in range(int((t1 - q0) / B)): E(q0 + j * B, 'marimba', name(root(j // 4, 4) + [0, 7, 12, 7][j % 4]), .4, .45, .3, .6)
horns(q0 + .5, ['A4', 'D5', 'C5', 'A4', 'G4', 'A4', 'F4', 'G4', 'A4', None], .5, .4, 'flute'); E(q0, 'harp', 'D5', 3, .35, -.3, .5)
o0, o1 = sc('observa')[0], sc('anhanga')[1]                              # forest suspense
drone(o0, o1, ('D2', 'Eb2'), .3); E(o0, 'violins_trem', 'Eb5', o1 - o0, .2, .2, .4)
for j in range(int((o1 - o0) / 1.5)): E(o0 + .5 + j * 1.5, 'harp', ['D4', 'Eb4', 'A3', 'D4'][j % 4], 1.4, .25, -.3, .4)
E(wt_('s06', 'Anhangá') - .2, 'vibraphone_bowed', 'A5', 3, .35, .2, .45)
p0, p1 = sc('provoc')[0], sc('tupa')[1]                                  # epic build up to Tupã
drone(p0, p1, ('D2', 'A2'), .3); drums(sc('trovao')[0], p1, .7, 2); ostinato(sc('trovao')[0], p1, .45)
pads(sc('tupa')[0], p1, .26, 'violins', 4); horns(wt_('s09', 'Tupã'), ['D3', None, 'F3', 'G3', 'A3', None, 'D4', None, 'C4', 'A3'], .5, .6, 'trombone')
horns(wt_('s09', 'Tupã') + .5, ['A4', 'D5', 'F5', 'E5', 'D5', 'A4'], .5, .5, 'trumpet')
c0, c1 = sc('tres')                                                      # comic pause: pizzicato, then nothing
for j in range(int((L1('s10b') - c0) / B)): E(c0 + j * B, 'violins_pizz', ['D5', 'A4', 'F5', 'A4'][j % 4], .3, .4, .2, .6)
a0, a1 = sc('advert')[0], sc('guaraci')[1]                               # mystery and revelations
drone(a0, a1, ('D2', 'A2'), .28)
for j in range(int((a1 - a0) / 2)): E(a0 + j * 2, 'vibraphone_bowed', name(nn(chord(j, 4)[j % 3])), 2.0, .25, .2, .35)
E(L0('s11b') + .3, 'contrabass', 'D1', 4, .45, 0, .5)
jf = wt_('s12', 'figura') - .1; [E(jf + i * .18, 'tubular_bells' if i == 0 else 'glockenspiel', p, 2.5, .35, -.3 + .15 * i, .4) for i, p in enumerate(['D5', 'A6', 'D7', 'F6', 'A6'])]
v0, v1 = sc('visao'); ostinato(v0, v1, .4, 'violins_spic', 4); E(v0, 'sus_cymbal', 'cresc', None, .4)
g0 = wt_('s14', 'Guaraci'); pads(g0, sc('guaraci')[1], .28, 'violins', 4); horns(g0, ['D4', 'A4', 'D5', None, 'C5', 'A4'], .5, .5, 'horn')
k0, k1 = sc('criatura'); drone(k0, k1, ('D1', 'D2', 'Eb2'), .35); E(L0('s15') + 1.0, 'violins_trem', 'Bb5', 3, .2, .3, .35)
l0, l1 = sc('alianca')                                                   # confrontation and alliance
drums(l0, l1, .8, 2); ostinato(l0, l1, .5); pads(l0, l1, .3, 'violins', 4); horns(l0 + .25, ['D4', 'D4', 'F4', 'E4', 'D4', 'C4', 'D4', 'A4', 'D5', 'C5'], .5, .6, 'trumpet')
horns(l0 + .25, ['D3', None, 'F3', None, 'A3', None, 'D4', None], .5, .55, 'trombone'); 
d0, d1 = sc('descob')[0], sc('destino')[1]                               # discovery, the two portals
pads(d0, d1, .22, 'violins', 4)
for j in range(int((d1 - d0) / B)): E(d0 + j * B, 'harp', name(nn(chord(j // 8, 4)[j % 3]) + 12 * (j % 2)), .6, .3, -.2, .45)
E(wt_('s18', 'dois') - .1, 'gong', None, None, .6); E(wt_('s18', 'dois') - .1, 'timpani', 'D2', 1.5, .8)
g0_, g2 = sc('part')[0], sc('part')[1]                                   # videogame
for j in range(int((g2 - g0_) / (B / 2))):
    t = g0_ + j * B / 2; i = j // 16; c = [nn(x) for x in chord(i, 5)]
    E(t, 'xylophone', name(c[[0, 1, 2, 1][j % 4]] + (12 if j % 8 >= 4 else 0)), .25, .35, .3, .5)
    if j % 4 == 0: H(t, 'bass_drum', None, .55); E(t, 'contrabass_pizz', name(root(i, 2)), .4, .6, 0, .8)
    if j % 4 == 2: H(t, 'snare2', 'on', .25, .1)
A0, A1 = sc('opA'); B0, B1 = sc('opB')
drone(A0, A1, ('D2', 'A2'), .28); E(A0, 'violins_trem', 'A5', A1 - A0, .22, .2, .4); horns(A0 + 1, ['D4', 'A4', 'G4', 'F4', 'E4', 'D4', 'A3', 'D4'], .6, .5, 'horn')
drone(B0, B1, ('D2', 'Eb2'), .3); horns(B0 + .5, ['D5', 'Eb5', 'F#5', 'G5', 'F#5', 'Eb5', 'D5', None, 'D5', 'Eb5'], .5, .4, 'oboe')
k0 = sc('cta')[0]; ostinato(k0, cut, .45, 'violins_spic', 4); drone(k0, cut, ('D2', 'A2'), .3)
for j in range(40):
    t = k0 + .5 + j * max(.18, .9 - j * .035)
    if t >= cut - .05: break
    E(t, 'timpani', 'D2', .4, min(.9, .3 + j * .03), 0, .6)
E(cut - 2.0, 'gran_cassa', 'roll_fast', None, .7); E(cut - 1.8, 'violins_trem', 'D6', 1.8, .3, 0, .5)

# ---------------------------------------------------------------- sound effects
def env(n, a=.005, r=.1): x = np.ones(n); na, nr = min(n // 2, int(a * SR)), min(n // 2, int(r * SR)); x[:na] = np.linspace(0, 1, na) if na else 1; x[-nr:] *= np.linspace(1, 0, nr) if nr else 1; return x
def sq(f, d, v=.2): tt = t_(d); return lp(np.sign(np.sin(2 * np.pi * f * tt)) * .5 + np.sign(np.sin(2 * np.pi * f * 2.003 * tt)) * .12, 6000) * env(len(tt), .002, min(.06, d * .4)) * v
def chips(fs, step, d, v=.18): out = np.zeros(int((step * len(fs) + d) * SR) + 1); [out.__setitem__(slice(int(i * step * SR), int(i * step * SR) + int(d * SR)), out[int(i * step * SR):int(i * step * SR) + int(d * SR)] + sq(f, d, v)[:int(d * SR)]) for i, f in enumerate(fs)]; return out
def zap(d, v=.3):
    n = int(d * SR); x = bp(rng.standard_normal(n), 1500, 9000) * ((rng.random(n // 200 + 1) > .55).repeat(200)[:n]); hum = np.sin(2 * np.pi * 120 * np.arange(n) / SR) * .3
    return (x + hum * bp(rng.standard_normal(n), 80, 400)) * env(n, .01, .2) * v
def thunder(v=1.0): c = crash(1.0) * .7; r = rumble(3.0, 1.0); x = np.zeros(int(3.2 * SR)); x[:len(c)] += c[:len(x)]; x[:len(r)] += lp(r, 600)[:len(x)] * 1.2; x[:int(.5 * SR)] += zap(.5, .6); return norm(x, v)
def sweep(f0, f1, d, v=.2, kind='sin'):
    tt = t_(d); f = np.geomspace(f0, f1, len(tt)); ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) if kind == 'sin' else np.sign(np.sin(ph)) * .5; return lp(x, 7000) * env(len(tt), .01, .08) * v
def riser(d, v=.25): n = int(d * SR); x = bp(rng.standard_normal(n), 400, 7000) * np.linspace(0, 1, n) ** 2; return x * v + sweep(200, 1600, d, v * .5)
def portal_snd(d, v=.25):
    n = int(d * SR); tt = np.arange(n) / SR; x = np.sin(2 * np.pi * (90 + 30 * np.sin(2 * np.pi * 3 * tt)) * tt) * .5 + bp(rng.standard_normal(n), 300, 2500) * (.5 + .5 * np.sin(2 * np.pi * 4 * tt)) * .4
    return x * env(n, .5, .8) * v
def glass(v=.5):
    out = np.zeros(int(1.2 * SR))
    for j in range(7): s = int(j * .045 * SR); b = hp(rng.standard_normal(int(.08 * SR)), 3000) * np.exp(-np.arange(int(.08 * SR)) / (.015 * SR)); out[s:s + len(b)] += b * (1 - j * .1)
    tt = t_(1.2); out += sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / .35) for f in (3150, 4420, 5830)) * .15
    return norm(out, v)
def metal(v=.4):
    tt = t_(1.4); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / dd) for f, dd in ((523, .5), (1290, .3), (2210, .2), (3370, .12))); c = clack(1.0, 1); x[:len(c)] += c[:len(x)]; return norm(x, v)
def shing(v=.3): n = int(.9 * SR); tt = np.arange(n) / SR; x = hp(rng.standard_normal(n), 5000) * np.exp(-tt / .08) * .6 + np.sin(2 * np.pi * 3520 * tt) * np.exp(-tt / .3) * .4 + np.sin(2 * np.pi * 5280 * tt) * np.exp(-tt / .2) * .2; return x * v
def windsnd(d, v=.3): n = int(d * SR); tt = np.arange(n) / SR; x = lp(rng.standard_normal(n), 1200); x = bp(x + rng.standard_normal(n) * .2, 250, 2400) * (.55 + .45 * np.sin(2 * np.pi * .7 * tt + np.sin(2 * np.pi * .23 * tt) * 3)); return norm(x) * env(n, .6, 1.0) * v
def gulp(v=.35): return sweep(520, 140, .22, v) + np.concatenate([np.zeros(int(.25 * SR)), sweep(300, 900, .12, v * .5)])[:int(.22 * SR)]
def whispers(d, v=.12):
    n = int(d * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n); y = np.zeros(n)
    for f in (700, 1200, 2500): y += bp(x, f * .8, f * 1.2) * (.5 + .5 * np.sin(2 * np.pi * (3 + f / 900) * tt + f))
    return y * env(n, .3, .6) * ((np.sin(2 * np.pi * 2.3 * tt) > -.3) * .8 + .2) * v
def unstable(d, v=.12): n = int(d * SR); tt = np.arange(n) / SR; return (np.sin(2 * np.pi * 55 * tt) + .6 * np.sin(2 * np.pi * 58.3 * tt) + .3 * np.sin(2 * np.pi * 110.7 * tt)) * (.6 + .4 * np.sin(2 * np.pi * 6 * tt)) * env(n, .2, .4) * v
def birds(d, v=.05):
    out = np.zeros(int(d * SR))
    for j in range(int(d * 2)):
        s = int(rng.random() * (d - .3) * SR); c = sweep(2500 + 1500 * rng.random(), 3800 + 1000 * rng.random(), .09, v); out[s:s + len(c)] += c[:len(out) - s]
    return out
def growl(d, v=.5, big=0): x = roar(d, 1.0); x = lp(x, 900 if big else 600) + lp(brown(d + .1)[:len(x)], 120) * .6; return norm(x, v)
def boing(v=.25): tt = t_(.5); f = 180 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt / .25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .2) * v
def splash_snd(v=.5): n = int(1.4 * SR); tt = np.arange(n) / SR; x = lp(rng.standard_normal(n), 3000) * np.exp(-tt / .25) + bp(rng.standard_normal(n), 2000, 7000) * np.exp(-tt / .5) * .5 * (rng.random(n) > .7); return norm(x, v)
def jungle(d, v=.06):
    out = np.zeros(int(d * SR)); n = len(out); out += lp(rng.standard_normal(n), 900) * .3 * v * 4
    for j in range(int(d * 3)):
        s = int(rng.random() * max(1, (d - .4)) * SR); c = sweep(2200 + 2000 * rng.random(), 3000 + 2500 * rng.random(), .07 + .06 * rng.random(), v); out[s:s + len(c)] += c[:max(0, n - s)]
    for j in range(int(d * 1.2)):
        s = int(rng.random() * max(1, (d - .6)) * SR); f0 = 500 + 600 * rng.random(); c = sweep(f0, f0 * 1.3, .25, v * .8); out[s:s + len(c)] += c[:max(0, n - s)]
    return out
def macaw(v=.18): n = int(.5 * SR); tt = np.arange(n) / SR; f = 900 + 500 * np.sin(2 * np.pi * 7 * tt); x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + bp(rng.standard_normal(n), 1500, 4000) * .4; return lp(x, 5000) * env(n, .01, .15) * v
def twig(v=.3): x = np.zeros(int(.4 * SR)); [x.__setitem__(slice(int(j * .05 * SR), int(j * .05 * SR) + len(c)), x[int(j * .05 * SR):int(j * .05 * SR) + len(c)] + c) for j, c in enumerate([clack(rng.uniform(1.2, 2.0), v)[:int(.1 * SR)] for _ in range(4)])]; return x
def bells(v=.2): tt = t_(3.0); return sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / (1.2 - k * .2)) * (.6 ** k) for k, f in enumerate((1318, 1976, 2637, 3520))) * v
for e in ev:
    t, k = e['t'], e['type']
    if k == 'vo':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
        y = soxr.resample(y, sr, SR, quality='HQ'); y = compress(norm(hp(y, 90), .9), thr=.25, ratio=3.0)
        if e['id'] in ('s10b', 's11b'):
            y = np.concatenate([y, np.zeros(SR)]); wet = S.room(y.astype(np.float32), size=.55, mix=.22); add(vo, wet[:, 0], t, .95, 0)
        else: add(vo, y, t, .95, 0)
    elif k == 'thunder': add(fx, thunder(.75), t - .03, 1, 0)
    elif k == 'impact': add(fx, thump(.6 * e.get('v', 1), 55), t, 1, 0); add(fx, crash(.25 * e.get('v', 1)), t, 1, .1)
    elif k == 'riser': add(fx, riser(max(.25, e['d']), .18), t, 1, 0)
    elif k == 'zap': add(fx, zap(e['d'], .2), t, 1, rng.uniform(-.3, .3))
    elif k == 'freeze': add(fx, whoosh(.4, 1)[::-1] * .2, t - .35, 1, 0); add(fx, click(1.6, .25), t, 1, 0)
    elif k == 'roar': add(fx, growl(e['d'], .55 if e.get('big') else .45, 1), t, 1, 0)
    elif k == 'growl': add(fx, growl(e['d'], .35), t, 1, 0)
    elif k == 'portal': add(fx, portal_snd(e['d'], .22), t, 1, .3)
    elif k == 'teleport': add(fx, sweep(200, 3000, .5, .2), t, 1, 0); add(fx, whoosh(.6, 1) * .25, t + .2, 1, 0)
    elif k == 'whoosh': add(fx, lp(whoosh(.5, 1), 4000) * .25, t, 1, 0)
    elif k == 'cut': add(fx, hp(whoosh(.2, 1), 1500) * .15, t - .1, 1, 0)
    elif k == 'fall': add(fx, sweep(1400, 300, e['d'], .14), t, 1, 0); add(fx, lp(whoosh(e['d'], 1), 2500) * .3, t, 1, 0)
    elif k == 'splash': add(fx, splash_snd(.55), t, 1, -.2)
    elif k == 'gulp': add(fx, gulp(.3), t, 1, 0)
    elif k == 'boing': add(fx, boing(.25), t, 1, 0)
    elif k == 'drain': add(fx, sweep(1200, 120, 1.0, .12, 'sq'), t, 1, -.2)
    elif k == 'jungle': add(fx, jungle(e['d']), t, 1, .2)
    elif k == 'macaw': add(fx, macaw(.16), t, 1, -.4); add(fx, macaw(.12), t + .35, 1, .4)
    elif k == 'twig': add(fx, twig(.3), t, 1, .4)
    elif k == 'shimmer': [E(t + j * .06, 'glockenspiel', p, 1.5, .35, -.3 + .1 * j, .4) for j, p in enumerate(['D6', 'F6', 'A6', 'C7', 'D7'])]
    elif k == 'dissolve': add(fx, riser(.8, .12)[::-1], t, 1, 0); [E(t + j * .08, 'glockenspiel', p, 1.2, .3, .3, .35) for j, p in enumerate(['A6', 'F6', 'D6', 'A5'])]
    elif k == 'spiritwind': add(fx, windsnd(e['d'], .2), t, 1, 0)
    elif k == 'charge': add(fx, sweep(180, 1400, .8, .12, 'sq'), t, 1, -.2)
    elif k == 'suck': add(fx, sweep(2500, 80, .9, .2), t, 1, 0); add(fx, whoosh(.8, 1)[::-1] * .25, t, 1, 0)
    elif k in ('silence', 'musicstop', 'cutsil', 'cutblack'): pass
    elif k == 'rumble': add(fx, lp(rumble(e['d'] + .5, .35), 300), t, 1, 0)
    elif k == 'unlock': add(fx, chips([523, 659, 784, 1047, 1319], .07, .14, .13), t, 1, 0); add(fx, pop(.3), t, 1, 0)
    elif k == 'levelup': add(fx, chips([523, 784, 1047, 1568], .06, .12, .14), t, 1, 0)
    elif k == 'pulse':
        for j in range(int(e['d'] / .5)): tt = t_(.25); add(fx, np.sin(2 * np.pi * 50 * tt) * np.exp(-tt / .08) * .5, t + j * .5, 1, 0)
    elif k == 'roots': add(fx, lp(rumble(e['d'], .3), 200), t, 1, 0); add(fx, zap(e['d'], .06), t, 1, 0)
    elif k == 'alarm':
        for j in range(e['n']): add(fx, sq(880, .16, .09), t + j * .4, 1, .2); add(fx, sq(660, .16, .09), t + j * .4 + .2, 1, .2)
    elif k == 'bells': add(fx, bells(.18), t, 1, .2)
    elif k == 'ripple': add(fx, sweep(400, 1800, .35, .08), t, 1, 0); add(fx, lp(whoosh(.4, 1), 3000) * .2, t, 1, 0)
    elif k == 'sunburst': add(fx, riser(.5, .2), t - .45, 1, 0); add(fx, thump(.5, 60), t + .05, 1, 0)
    elif k == 'darkgrow': add(fx, unstable(e['d'], .14), t, 1, 0)
    elif k == 'heart':
        per = .55 if e.get('fast') else .9; j = 0
        while j * per < e['d']: add(fx, heartbeat(.55 + .3 * j * per / e['d']), t + j * per, 1, 0); j += 1
    elif k == 'rare': add(fx, chips([784, 988, 1175, 1568, 1976], .08, .25, .12), t, 1, 0); [E(t + j * .07, 'glockenspiel', p, 1.4, .35, 0, .4) for j, p in enumerate(['D6', 'A6', 'D7'])]
    elif k == 'touch': add(fx, sweep(300, 2400, .4, .15), t, 1, 0); add(fx, thump(.4, 70), t + .35, 1, 0)
    elif k == 'mission': add(fx, chips([784, 1175], .12, .22, .13), t, 1, 0)
    elif k == 'notify': add(fx, ding(.25), t, 1, .2)
    elif k == 'coin': add(fx, chips([988, 1319], .07, .2, .07), t, 1, .2)
    elif k == 'icewind': add(fx, hp(windsnd(e['d'], .25), 600), t, 1, 0)
    elif k == 'sand': add(fx, bp(windsnd(e['d'], .2), 1500, 6000), t, 1, 0)
    elif k == 'pop': add(fx, pop(.35), t, 1, 0)
    else: print('unhandled event', k)
used = sorted({x[1] for x in score})
music = S.render(score, dur=DUR + 3, master=False)[:N + PAD]
if len(music) < N + PAD: music = np.pad(music, ((0, N + PAD - len(music)), (0, 0)))
mus[:len(music)] += music; mus = S.room(mus, size=.7, mix=.25)
# the dry cut: everything stops with the black; the comic pause and the hook freeze leave the music out
for a, b in [(cut, DUR + 8)] + stops: mus[int(a * SR):int(b * SR)] *= 0
fx[int(cut * SR):] *= 0; vo[int(cut * SR):] *= 0
fade = int(.03 * SR); s = int(cut * SR)
vo, fx, mus = vo[:N], fx[:N], mus[:N]
env_ = np.abs(vo).max(1); kk = int(.03 * SR); env_ = np.convolve(env_, np.ones(kk) / kk, 'same')
act = np.clip(env_ / (np.percentile(env_[env_ > 1e-4], 50) + 1e-9), 0, 1)
dk = np.zeros(N); x0 = 0.0; att, rel = np.exp(-1 / (.05 * SR)), np.exp(-1 / (.4 * SR))
for i in range(0, N, 48):
    x = act[i]; x0 = att * x0 + (1 - att) * x if x > x0 else rel * x0 + (1 - rel) * x; dk[i:i + 48] = x0
speak = dk > .5; vr = np.sqrt((vo[speak] ** 2).mean()); mr = np.sqrt((mus[speak] ** 2).mean()); fr = np.sqrt((fx[speak] ** 2).mean())
mg = (vr / 10 ** (14 / 20)) / (mr + 1e-9); fg = min(1.0, (vr / 10 ** (8 / 20)) / (fr + 1e-9))
mix = vo + mus * mg * (1 - .4 * dk[:, None]) + fx * fg * (1 - .3 * dk[:, None])
mix = np.stack([compress(mix[:, c], thr=.3, ratio=2.5, att=.002) for c in (0, 1)], 1)
mix = mix / np.abs(mix).max() * .9; mix = np.stack([limit(mix[:, c], ceil=.9) for c in (0, 1)], 1)
mix[s:] = 0
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
open(os.path.join(D, 'CREDITS_music.txt'), 'w').write('\n'.join(S.credits(used)) + '\n')
print('mix', mix.shape, 'music gain', round(float(mg), 3), 'fx gain', round(float(fg), 3), 'instruments:', ', '.join(used))
