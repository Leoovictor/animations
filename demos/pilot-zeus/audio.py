"""Sound for the Zeus pilot (12 s). Writes out/mix.wav. Run: LIB=<library> <LIB>/.venv/bin/python audio.py (after events.mjs wrote events.json).
Tracks: score (sampled orchestra, CC0, original), ambience (forest, wind), effects (steps, charge, zap, thunder). Every sound starts at an
event from the page (window.EV), so picture and sound share one list of times."""
import os, sys, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, bp, lp, hp, t_, norm, compress, whoosh, thump, crash, rumble, brown, click
D = os.path.dirname(os.path.abspath(__file__)); EV = json.load(open(os.path.join(D, 'events.json'))); DUR = float(EV['dur']); N = int(round(DUR * SR)); PAD = SR * 6
S.seed(7); rng = np.random.default_rng(7)
mus, amb, fx = (np.zeros((N + PAD, 2), np.float32) for _ in range(3)); score = []
def E(t, inst, p, d, v, pan=0, g=1.0): score.append((round(t, 4), inst, p, d, v, pan, g))
def H(t, inst, var, v, pan=0, g=1.0): score.append((round(t, 4), inst, var, None, v, pan, g))
def env(n, a=.01, r=.1): x = np.ones(n); na, nr = min(n // 2, int(a * SR)), min(n // 2, int(r * SR)); x[:na] = np.linspace(0, 1, na) if na else 1; x[n - nr:] *= np.linspace(1, 0, nr) if nr else 1; return x
def sweep(f0, f1, d, v=.2): tt = t_(d); f = np.geomspace(f0, f1, len(tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), .02, .08) * v
# ---------------------------------------------------------------- score: a light walking theme → held breath → rising tension → hit → settle
for i, (p, d) in enumerate([('D5', .45), ('F5', .45), ('A5', .9), ('G5', .45), ('F5', .45), ('E5', .9)]): E(.2 + sum(x[1] for x in [('D5', .45), ('F5', .45), ('A5', .9), ('G5', .45), ('F5', .45), ('E5', .9)][:i]), 'flute', p, d * .95, .45, .2, .6)
for j in range(6): E(j * .45, 'harp', ['D4', 'A4', 'F4', 'A4'][j % 4], .8, .35, -.3, .5)
for j in range(3): E(j * 1.0, 'contrabass_pizz', ['D2', 'A1', 'D2'][j], .6, .5, 0, .6)
E(3.3, 'violins_trem', 'Eb5', 2.6, .3, .2, .5); E(3.3, 'cellos', 'D2', 2.8, .35, -.2, .5); E(3.5, 'timpani', 'D2', 1.2, .5, 0, .5)      # the start
for j in range(12): E(6.0 + j * .25, 'violins_spic', ['D4', 'D4', 'F4', 'D4'][j % 4], .2, .35 + .03 * j, .2, .55)                       # rising pulse
E(6.0, 'cellos', 'D2', 3.0, .3, -.2, .5); E(7.5, 'violins', 'A4', 1.5, .3, .2, .4); E(8.2, 'gran_cassa', 'roll_fast', None, .5)
for p in ['D2', 'D3', 'A3', 'D4']: E(9.12, 'trombone' if p[-1] in '23' else 'trumpet', p, .6, .8, 0, .7)                                    # the hit
H(9.12, 'gran_cassa', 'hit', .9); H(9.12, 'clash', 'crash', .55); E(9.12, 'timpani', 'D2', 1.6, .9)
for p in ['D4', 'F4', 'A4']: E(10.3, 'violins', p, 1.7, .26, 0, .4)                                                                     # settle
E(10.3, 'cellos', 'D3', 1.7, .3, 0, .5)
# ---------------------------------------------------------------- effects and ambience, from the page's events
def forest(d, v=.05):
    n = int(d * SR); out = lp(rng.standard_normal(n), 700) * .25 * v
    for j in range(int(d * 2.5)):
        s = int(rng.random() * max(1, d - .3) * SR); c = sweep(2400 + 1800 * rng.random(), 3600 + 1500 * rng.random(), .08 + .05 * rng.random(), v); out[s:s + len(c)] += c[:max(0, n - s)]
    return out * env(n, .3, .6)
def windsnd(d, v=.3):
    n = int(d * SR); tt = np.arange(n) / SR; x = bp(lp(rng.standard_normal(n), 1200) + rng.standard_normal(n) * .2, 250, 2400)
    return norm(x * (.55 + .45 * np.sin(2 * np.pi * .7 * tt + np.sin(2 * np.pi * .23 * tt) * 3))) * env(n, .8, 1.2) * v
def step(v=.3, soft=0):   # a sandal on packed earth: a soft thump and a little grit
    d = .14; tt = t_(d); x = np.sin(2 * np.pi * 85 * tt) * np.exp(-tt / .03) * .8 + bp(rng.standard_normal(len(tt)), 900, 4000) * np.exp(-tt / .015) * .5
    return norm(x) * v * (.55 if soft else 1)
def charge(d, v=.2):     # an electric hum that rises and crackles faster
    n = int(d * SR); tt = np.arange(n) / SR; u = tt / d; f = 60 + 180 * u ** 2
    hum = np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    crack = bp(rng.standard_normal(n), 1500, 8000) * (rng.random(n) < .0015 + .02 * u ** 2)
    return (hum * .3 * (.2 + u) + crack * 1.5 * u) * env(n, .3, .02) * v
def zap(v=.4): n = int(.35 * SR); tt = np.arange(n) / SR; return (bp(rng.standard_normal(n), 2000, 9000) * np.exp(-tt / .06) + sweep(3000, 300, .35, .5)[:n]) * v
def thunder(v=.8): c = crash(1.0) * .6; r = lp(rumble(3.0, 1.0), 500); x = np.zeros(int(3.2 * SR)); x[:len(c)] += c[:len(x)]; x[:len(r)] += r[:len(x)] * 1.3; return norm(x, v)
for e in EV['ev']:
    t, k = e['t'], e['type']
    if k == 'step': add(fx, step(.32, e.get('soft')), t, 1, -.15 if e.get('foot') == 'F' else .1)
    elif k == 'forest': add(amb, forest(e['d'], .05 if not e.get('back') else .035), t, 1, .2)
    elif k == 'wind': add(amb, windsnd(e['d'], .28), t, 1, 0)
    elif k == 'gust': add(amb, lp(whoosh(1.4, 1), 1800) * .3, t, 1, -.3)
    elif k == 'startle': add(fx, sweep(400, 900, .25, .12), t, 1, 0)
    elif k == 'charge': add(fx, charge(e['d'], .22), t, 1, .1)
    elif k == 'zap': add(fx, zap(.4), t, 1, .2)
    elif k == 'thunder': add(fx, thunder(.85), t - .02, 1, 0); add(fx, thump(.8, 45), t, 1, 0)
    elif k == 'whoosh': add(fx, lp(whoosh(.6, 1), 3000) * .25, t, 1, 0)
    else: print('unhandled event', k)
music = S.render(score, dur=DUR + 3, master=False)[:N + PAD]
if len(music) < N + PAD: music = np.pad(music, ((0, N + PAD - len(music)), (0, 0)))
mus[:] += S.room(music.astype(np.float32), size=.6, mix=.25)
mix = (mus * .55 + amb + fx)[:N]
mix = np.stack([compress(mix[:, c], thr=.3, ratio=2.5, att=.002) for c in (0, 1)], 1); mix = mix / np.abs(mix).max() * .9; mix = np.stack([limit(mix[:, c], ceil=.9) for c in (0, 1)], 1)
fade = int(.4 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
os.makedirs(os.path.join(D, 'out'), exist_ok=True); sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
open(os.path.join(D, 'CREDITS_music.txt'), 'w').write('\n'.join(S.credits(sorted({x[1] for x in score}))) + '\n')
print('mix', mix.shape, 'events', len(EV['ev']))
