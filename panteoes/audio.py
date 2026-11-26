"""Score, sound effects and voice for "O Encontro dos Panteões — Ep. 01". Writes out/mix.wav.
Run: LIB=<library> <LIB>/.venv/bin/python audio.py
Score: original, D minor, 120 BPM, sampled orchestra (CC0) + a few synthesised game chips. Cinematic percussion only;
no sacred rhythms or chants of any tradition are used as decoration. Sections follow the script's music direction:
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

# ---------------------------------------------------------------- the score, section by section
cut = [e['t'] for e in ev if e['type'] == 'cutblack'][0]
stab(.3, .9)                                                        # the hook: one impact, then the freeze holds its breath
E(1.0, 'violins_trem', 'D5', 3.2, .25, .2, .5); drone(1.0, 4.4, ('D2',), .3)
a0 = sc('olimpo')[0]; m0 = sc('mundo')[0]                            # adventure / discovery
pads(a0, m0, .22, 'violins', 4); ostinato(a0 + 2, m0, .35)
horns(a0 + .5, ['D4', 'F4', 'A4', None, 'G4', 'F4', 'E4', None], .5, .45)
E(a0 + 3.8, 'glockenspiel', 'A6', 1.5, .4, .3, .4); E(a0 + 4.0, 'harp', 'D5', 2, .4, -.3, .5)
pads(m0, sc('trovao')[0], .2, 'violins', 4)
for j in range(int((sc('trovao')[0] - m0) / B)): E(m0 + j * B, 'marimba', name(root(j // 4, 4) + [0, 7, 12, 7][j % 4]), .4, .45, .3, .6)
horns(m0 + 1, ['A4', 'D5', 'C5', 'A4', 'G4', 'A4', None, None], .5, .4, 'flute')
t0, t1 = sc('trovao'); drone(t0, t1, ('D2', 'Eb2'), .3); E(t0, 'violins_trem', 'Eb5', t1 - t0, .2, .2, .4)   # tension, then percussion
x0, x1 = sc('xango'); drums(x0, x1, .65, 2); ostinato(x0, x1, .4, 'cellos_spic', 3, False); horns(x0 + 1, ['D3', None, 'F3', 'G3', 'A3', None, 'D4', None], .5, .55, 'trombone')
c0, c1 = sc('confr'); drums(c0, L0('s07b'), .5, 1); drone(c0, c1, ('D2', 'A2'), .3)                         # the music thins to a pulse
r0, r1 = sc('resp'); drums(L0('s08b'), r1, .7, 1); pads(L0('s08b') - .1, r1, .26, 'violins', 4); horns(L0('s08b'), ['D4', 'F4', 'A4', 'D5', 'C5', 'A4'], .5, .6, 'trumpet')
d0, d1 = sc('demo'); q1 = sc('conseq')[1]                           # the clash: everything
drums(d0, q1, .75, 2); ostinato(d0, q1, .5); pads(d0, q1, .28, 'violins', 4); horns(d0 + 1, ['D4', 'D4', 'F4', 'E4', 'D4', 'C4', 'D4', 'A3', 'D4', 'F4', 'A4', 'G4'], .5, .55, 'horn')
horns(sc('conseq')[0] + .5, ['Eb5', None, 'D5', None, 'Eb5', None, 'D5'], .5, .4, 'violins_trem')
o0 = sc('ogum')[0]; p1 = sc('percebe')[0]                            # character themes, a dynamic groove
drums(o0, p1, .6, 2); ostinato(o0, p1, .4, 'violins_spic', 4)
horns(o0 + .5, ['D3', 'F3', 'G3', 'A3', None, 'C4', 'A3', None], .5, .55, 'trombone')                    # Ogum: low brass, iron
horns(L0('s12b') - .2, ['A4', 'C5', 'D5', 'F5', 'E5', 'D5', 'C5', 'A4'], .25, .45, 'flute')               # Iansã: the wind
E(L0('s12b') - .3, 'sus_cymbal', 'cresc', None, .6)
pe0, pe1 = sc('percebe'); gstop = L1('s13'); drums(pe0, gstop, .5, 1); pads(pe0, gstop, .22, 'violins', 4)  # cut for the comic pause
drone(gstop + .75, pe1, ('D2', 'Eb2'), .32); E(gstop + .75, 'violins_trem', 'D5', pe1 - gstop - .75, .25, .2, .45)
am0, am1 = sc('ameaca'); drone(am0, am1, ('D1', 'D2', 'Eb2'), .35); E(am0 + 1, 'contrabass', 'D1', am1 - am0 - 1, .5, 0, .6)
E(L0('s14') + 1.5, 'violins_trem', 'Bb5', 3.5, .2, .3, .35)
ox0, ox1 = sc('oxala'); ox = [e['t'] for e in ev if e['type'] == 'shimmer'][0]      # light: tension falls away
drone(ox0, ox, ('D2', 'A2'), .28)
pads(ox, sc('revel')[0] + 2.5, .2, 'violins', 4); E(ox, 'vibraphone_bowed', 'D5', 4, .4, .2, .5); E(ox + .5, 'harp', 'F5', 3, .3, -.3, .5); E(ox + 1.5, 'harp', 'A5', 3, .3, .3, .5)
rv0, rv1 = sc('revel'); rb = L0('s16b') - .05; drone(rb, rv1, ('D2', 'Ab2'), .32); E(rb, 'gong', None, None, .6); E(rb, 'violins_trem', 'Ab5', rv1 - rb, .22, .2, .4)
g0, g1 = sc('publico'); g2 = sc('mec')[1]                            # videogame
for j in range(int((g2 - g0) / (B / 2))):
    t = g0 + j * B / 2; i = j // 16; c = [nn(x) for x in chord(i, 5)]
    E(t, 'xylophone', name(c[[0, 1, 2, 1][j % 4]] + (12 if j % 8 >= 4 else 0)), .25, .35, .3, .5)
    if j % 4 == 0: H(t, 'bass_drum', None, .55); E(t, 'contrabass_pizz', name(root(i, 2)), .4, .6, 0, .8)
    if j % 4 == 2: H(t, 'snare2', 'on', .25, .1)
pads(g0, g2, .16, 'violins', 4)
A0, A1 = sc('opA'); B0, B1 = sc('opB'); k0 = sc('cta')[0]
drums(A0, A1, .6, 1); pads(A0, A1, .25, 'violins', 4); horns(A0 + .5, ['D4', 'A4', 'G4', 'F4', 'E4', 'F4', 'G4', 'A4', 'D5', None, 'D5'], .5, .5, 'trumpet')   # heroic
drone(B0, B1, ('D2', 'Eb2', 'Ab2'), .3); ostinato(B0, B1, .35, 'cellos_spic', 2, False); E(B0, 'violins_trem', 'Eb5', B1 - B0, .22, .2, .4)
ostinato(k0, cut, .45, 'violins_spic', 4); drone(k0, cut, ('D2', 'A2'), .3)                               # rising, then nothing
for j in range(40):
    t = k0 + 1 + j * max(.18, 1.0 - j * .035)
    if t >= cut - .05: break
    E(t, 'timpani', 'D2', .4, min(.9, .3 + j * .03), 0, .6)
E(cut - 2.2, 'gran_cassa', 'roll_fast', None, .7); E(cut - 2.0, 'violins_trem', 'D6', 2.0, .3, 0, .5)

# ---------------------------------------------------------------- sound effects
def env(n, a=.005, r=.1): x = np.ones(n); na, nr = int(a * SR), int(r * SR); x[:na] = np.linspace(0, 1, na) if na else 1; x[-nr:] *= np.linspace(1, 0, nr) if nr else 1; return x
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
for e in ev:
    t, k = e['t'], e['type']
    if k == 'vo':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
        y = soxr.resample(y, sr, SR, quality='HQ'); y = compress(norm(hp(y, 90), .9), thr=.25, ratio=3.0)
        if e['id'] in ('s07b', 's08b'):   # the quoted lines get a little air around them
            y = np.concatenate([y, np.zeros(SR)]); wet = S.room(y.astype(np.float32), size=.55, mix=.22); add(vo, wet[:, 0], t, .95, 0)
        else: add(vo, y, t, .95, 0)
    elif k == 'thunder': add(fx, thunder(.75), t - .03, 1, 0)
    elif k == 'impact': add(fx, thump(.6 * e.get('v', 1), 55), t, 1, 0); add(fx, crash(.25 * e.get('v', 1)), t, 1, .1)
    elif k == 'riser': add(fx, riser(max(.25, e['d']), .18), t, 1, 0)
    elif k == 'zap': add(fx, zap(e['d'], .2), t, 1, rng.uniform(-.3, .3))
    elif k == 'freeze': add(fx, whoosh(.4, 1)[::-1] * .2, t - .35, 1, 0); add(fx, click(1.6, .25), t, 1, 0); add(fx, click(1.2, .2), t + .05, 1, 0)
    elif k == 'portal': add(fx, portal_snd(e['d'], .22), t, 1, .3)
    elif k == 'charge': add(fx, sweep(180, 1400, .8, .12, 'sq'), t, 1, -.2); add(fx, chips([1568], .1, .18, .12), t + .8, 1, -.2)
    elif k == 'steps':
        for j in range(int(e['d'] / .35)): add(fx, thump(.12, 110), t + j * .35, 1, -.1 + .2 * (j % 2))
    elif k == 'teleport': add(fx, sweep(200, 3000, .5, .2), t, 1, 0); add(fx, whoosh(.6, 1) * .25, t + .2, 1, 0)
    elif k == 'whoosh': add(fx, lp(whoosh(.5, 1), 4000) * .25, t, 1, 0)
    elif k == 'cut': add(fx, hp(whoosh(.2, 1), 1500) * .15, t - .1, 1, 0)
    elif k == 'pop': add(fx, pop(.35), t, 1, 0)
    elif k == 'birds': add(fx, birds(e['d']), t, 1, .3)
    elif k == 'rumble': add(fx, lp(rumble(e['d'] + .5, .35), 300), t, 1, 0)
    elif k == 'rocks':
        for j in range(9): add(fx, clack(rng.uniform(.6, 1.4), .25), t + .3 + j * rng.uniform(.06, .14), 1, rng.uniform(-.5, .5))
    elif k == 'smoke': add(fx, lp(whoosh(1.4, 1), 900) * .25, t, 1, 0)
    elif k == 'unlock': add(fx, chips([523, 659, 784, 1047, 1319], .07, .14, .13), t, 1, 0); add(fx, pop(.3), t, 1, 0)
    elif k == 'pulse':
        for j in range(int(e['d'] / .5)): tt = t_(.25); add(fx, np.sin(2 * np.pi * 50 * tt) * np.exp(-tt / .08) * .5, t + j * .5, 1, 0)
    elif k == 'collide': add(fx, thunder(.9), t, 1, 0); add(fx, zap(1.2, .3), t, 1, 0); add(fx, sweep(800, 60, .7, .25), t, 1, 0)
    elif k == 'alarm':
        for j in range(e['n']): add(fx, sq(880, .16, .09), t + j * .4, 1, .2); add(fx, sq(660, .16, .09), t + j * .4 + .2, 1, .2)
    elif k == 'glass': add(fx, glass(.45), t, 1, 0)
    elif k == 'unstable': add(fx, unstable(e['d'], .12), t, 1, 0)
    elif k == 'metal': add(fx, metal(.3), t, 1, .2)
    elif k == 'shing': add(fx, shing(.28), t, 1, .2)
    elif k == 'wind': add(fx, windsnd(e['d'], .3), t, 1, 0)
    elif k == 'gulp': add(fx, gulp(.3), t, 1, 0)
    elif k == 'heart':
        per = .55 if e.get('fast') else .9; j = 0
        while j * per < e['d']: add(fx, heartbeat(.55 + .3 * j * per / e['d']), t + j * per, 1, 0); j += 1
    elif k == 'growl': add(fx, growl(e['d'], .55 if e.get('big') else .4, e.get('big', 0)), t, 1, 0)
    elif k == 'shimmer': [E(t + j * .06, 'glockenspiel', p, 1.5, .4, -.3 + .1 * j, .45) for j, p in enumerate(['D6', 'F6', 'A6', 'C7', 'D7', 'F7'])]; E(t, 'sus_cymbal', 'cresc', None, .35)
    elif k == 'reveal': add(fx, whoosh(.8, 1)[::-1] * .25, t - .75, 1, 0); add(fx, thump(.7, 45), t, 1, 0)
    elif k == 'whispers': add(fx, whispers(e['d'], .1), t, 1, -.3); add(fx, whispers(e['d'], .08), t + .15, 1, .3)
    elif k == 'mission': add(fx, chips([784, 1175], .12, .22, .13), t, 1, 0)
    elif k == 'select':
        for j in range(e['n']): add(fx, pop(.3), t + j * .22, 1, -.4 + .2 * j); add(fx, chips([988 + 120 * j], .1, .08, .07), t + j * .22, 1, 0)
    elif k == 'notify': add(fx, ding(.25), t, 1, .2)
    elif k == 'levelup': add(fx, chips([523, 784, 1047, 1568], .06, .12, .14), t, 1, 0)
    elif k == 'coin': add(fx, chips([988, 1319], .07, .2, .07), t, 1, .2)
    elif k == 'tick': add(fx, click(1.0, .35), t, 1, 0); add(fx, chips([1760], .1, .06, .1), t, 1, 0)

used = sorted({x[1] for x in score})
music = S.render(score, dur=DUR + 3, master=False)[:N + PAD]
if len(music) < N + PAD: music = np.pad(music, ((0, N + PAD - len(music)), (0, 0)))
mus[:len(music)] += music; mus = S.room(mus, size=.7, mix=.25)
# the dry cut: everything stops with the black; the comic pause and the hook freeze leave the music out
for a, b in [(cut, DUR + 8), (L1('s13') + .02, L1('s13') + .75)]: mus[int(a * SR):int(b * SR)] *= 0
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
