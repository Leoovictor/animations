"""Score, foley and voices for "Umbral — parte 1". Writes out/mix.wav. Run: LIB=<library> <LIB>/.venv/bin/python audio.py
Music: an eerie bed in D minor that never resolves — a low string drone, a music-box tune (the house, the childhood) that
comes back changed, a heartbeat for the shocks; the memory gets a low rumble and fire; the end holds a suspended chord
and cuts to silence with the door. Voices: the voice behind the door is muffled (low-passed, roomy); the brother's even more."""
import os, sys, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf, soxr
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, bp, lp, hp, t_, norm, compress, whoosh, thump, creak, heartbeat, brown, click
D = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(D, 'events.json'))); TL = json.load(open(os.path.join(D, 'timeline.json'), encoding='utf-8'))
LINES = {l['id']: l for l in json.load(open(os.path.join(D, 'lines.json'), encoding='utf-8'))}
DUR = float(EV['dur']); N = int(round(DUR * SR)); ev = EV['ev']; SC = TL['scenes']
S.seed(3); rng = np.random.default_rng(3); PAD = SR * 8
mus = np.zeros((N + PAD, 2), np.float32); fx = np.zeros((N + PAD, 2), np.float32); vo = np.zeros((N + PAD, 2), np.float32); amb = np.zeros((N + PAD, 2), np.float32)
score = []
def E(t, inst, p, d, v, pan=0, g=1.0): score.append((t, inst, p, d, v, pan, g))
def sc(k): return SC[k]['t0'], SC[k]['t1']
def L0(i): return TL['lines'][i]['t0']
def L1(i): return TL['lines'][i]['t1']

# ---------------------------------------------------------------- music
def drone(t0, t1, notes=('D2', 'A2'), v=.3, g=.3):
    for i, n in enumerate(notes): E(t0, 'cellos' if n[-1] in '23' else 'contrabass', n, t1 - t0, v, -.2 + .4 * i, g)
BOX = ['A5', 'D6', 'F6', 'E6', 'D6', 'A5', 'Bb5', 'A5']   # the music-box tune: the house
def musicbox(t0, notes=BOX, step=.42, v=.5, g=.5, pan=.2):
    for i, p in enumerate(notes): E(t0 + i * step, 'glockenspiel', p, 1.8, v * .8, pan, g * .7)
h0, h1 = sc('hook'); drone(0, sc('ciclo')[1], ('D2', 'A2'), .28, .28)
E(.0, 'violins_trem', 'D5', 2.4, .2, .2, .22); E(L0('l02'), 'violins_trem', 'Eb5', 3.2, .18, -.2, .2)
musicbox(sc('acorda')[0] + .4, v=.45); musicbox(sc('acorda')[0] + 4.0, BOX[:5], v=.4)
E(L0('l06') - .1, 'timpani', 'D2', 2.0, .7, 0, .5); E(L0('l06') - .1, 'violins_trem', 'C#5', 3.5, .25, .1, .28)
# the loop: the same tune again, slower, a note missing
musicbox(sc('ciclo')[0] + .3, BOX[:4] + BOX[5:], step=.5, v=.4)
m0, m1 = sc('menina'); drone(m0, sc('umbral')[1], ('D2', 'F2', 'A2'), .26, .26)
for i, p in enumerate(['F4', 'E4', 'D4', 'E4', 'A3']): E(m0 + 1 + i * 1.6, 'harp', p, 2.5, .3, .25, .3)
E(L0('l12') + 3.5, 'violins_trem', 'Bb4', 3.0, .22, .2, .25)
E(L0('l14') - .1, 'tubular_bells', 'D4', 4, .4, 0, .3); E(L0('l14') - .1, 'violins', 'A4', 3.5, .2, -.2, .2)
l0, l1 = sc('lembra'); drone(l0, l1, ('D2', 'A2'), .3, .3); E(L0('l16') - .1, 'violins_trem', 'D5', 3.8, .22, .2, .25); E(L0('l16') - .1, 'violas', 'G#4', 3.8, .22, -.2, .22)
f0, f1 = sc('flash'); E(f0, 'contrabass', 'D1', f1 - f0, .4, 0, .4); E(f0, 'cellos', 'Eb2', f1 - f0, .3, .2, .3); E(f0, 'gran_cassa', None, None, .6, 0, .5)
for i, p in enumerate(['D5', 'C5', 'Bb4', 'A4']): E(L0('l18') + i * .6, 'violin', p, .9, .35, .2, .35)
c0, c1 = sc('macaneta'); drone(c0, sc('nome')[0] + 3, ('D2', 'A2'), .26, .26)
musicbox(L0('l20') + .2, ['D6', 'F6', 'E6', 'D6', 'C#6', 'D6'], step=.55, v=.38)
n0, n1 = sc('nome'); E(n0 + .2, 'harp', 'D4', 3, .35, -.2, .3); E(n0 + .5, 'harp', 'A4', 3, .3, .2, .3)
toff = None
for e in ev:
    if e['type'] == 'off': toff = e['t']
    if e['type'] == 'fogdrop': tfog = e['t']
E(toff, 'violins_trem', 'D4', 1.2, .25, 0, .25)
for n, p in [('violins', 'A4'), ('violins', 'E5'), ('violas', 'D4'), ('cellos', 'G2')]: E(tfog, n, p, n1 - tfog + 1.5, .22, 0, .22)   # Dsus: the street opens, nothing resolves
E(L0('l25') - .1, 'glockenspiel', 'E6', 2.5, .3, .3, .25)
i0, i1 = sc('irmao'); drone(i0, i1, ('D2', 'Eb2'), .26, .26)
E(L0('l27') - .1, 'violins_trem', 'Eb5', 5.2, .2, .2, .25); E(L0('l29') - .1, 'violins_trem', 'A5', 3.8, .2, -.2, .22)
cutb = [e['t'] for e in ev if e['type'] == 'cutblack'][0]
k0, k1 = sc('cta'); drone(k0 + .3, k1, ('D2', 'A2'), .24, .24); musicbox(k0 + .8, BOX, step=.5, v=.38); musicbox(k0 + 5.2, BOX[:6], step=.5, v=.34)
for i in range(int((k1 - k0 - 1) / 1.0)): E(k0 + 1 + i * 1.0, 'timpani', 'D2', .5, .25, 0, .22)

# ---------------------------------------------------------------- foley
def pat(v=1.0):   # a bare foot on stone
    d = .12; tt = t_(d); return norm(lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt / .02) + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt / .03) * .6) * v
def knock(v=1.0):
    d = .3; tt = t_(d); return norm(bp(rng.standard_normal(len(tt)), 150, 1800) * np.exp(-tt / .025) + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / .05)) * v
def scrape(d, v=1.0):
    n = int(d * SR); x = bp(rng.standard_normal(n), 1800, 6000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 7 * np.arange(n) / SR)))
    return x * np.sin(np.pi * np.arange(n) / n) ** .5 * v
def fire(d, v=1.0):
    n = int(d * SR); x = lp(brown(d + .1)[:n], 300) * .8 + bp((rng.random(n) < .004) * rng.standard_normal(n) * 3, 800, 6000)
    return norm(x * np.minimum(1, np.arange(n) / (SR * .5)) * np.minimum(1, (n - np.arange(n)) / (SR * .6))) * v
def buzz(d, v=1.0): tt = t_(d); return (np.sign(np.sin(2 * np.pi * 60 * tt)) * .3 + bp(rng.standard_normal(len(tt)), 2000, 6000) * .2) * (np.sin(2 * np.pi * 13 * tt) > 0) * v
def rev_whoosh(d, v=1.0): return whoosh(d, 1)[::-1] * v
for e in ev:
    t, k = e['t'], e['type']
    if k == 'vo':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav')); y = y.mean(1) if y.ndim > 1 else y
        y = soxr.resample(y, sr, SR, quality='HQ'); who = e['who']
        y = compress(norm(hp(y, 80), .9), thr=.25, ratio=3.0)
        if who in ('porta', 'irmao'):   # behind a door: muffled, with a little room
            y = lp(y, 1100 if who == 'porta' else 900, 4) * 1.6; y = np.concatenate([y, np.zeros(SR)])
            wet = S.room(y.astype(np.float32), size=.35, mix=.35); add(vo, wet[:, 0] * .9, t, .95, .05 if who == 'porta' else 0)
        else: add(vo, y, t, .95, {'caio': -.08, 'lia': .08}.get(who, 0))
    elif k == 'heart': add(fx, heartbeat(.5), t, 1, 0); add(fx, heartbeat(.4), t + .85, 1, 0)
    elif k == 'steps':
        for j in range(int(e['d'] / .32)): add(fx, pat(.09), t + j * .32, 1, -.1 + .2 * (j % 2))
    elif k == 'run':
        for j in range(int(e['d'] / .2)): add(fx, pat(.13), t + j * .2, 1, -.15 + .3 * (j % 2))
    elif k == 'pant':
        for j in range(int(e['d'] / .55)): add(fx, bp(rng.standard_normal(int(.3 * SR)), 600, 3000) * np.sin(np.pi * np.arange(int(.3 * SR)) / int(.3 * SR)) * .03, t + j * .55, 1, 0)
    elif k == 'sting': add(fx, rev_whoosh(.6, .18), t - .55, 1, 0); add(fx, thump(.5, 50), t, 1, 0)
    elif k == 'scratch': add(fx, scrape(e['d'], .12), t, 1, -.3)
    elif k == 'pop': add(fx, click(pitch=.8, v=.12), t, 1, 0); add(fx, hp(whoosh(.15, 1), 1500) * .06, t - .05, 1, 0)
    elif k == 'chime': E(t, 'glockenspiel', 'D6', 2, .35, .3, .25); E(t + .15, 'glockenspiel', 'A6', 2, .3, .3, .2)
    elif k == 'whoosh': add(fx, lp(whoosh(1.0, 1), 2500) * .15, t, 1, 0)
    elif k == 'flash': add(fx, rev_whoosh(.5, .2), t - .45, 1, 0); add(fx, thump(.4, 60), t, 1, 0)
    elif k == 'fire': add(amb, fire(e['d'], .14), t, 1, 0)
    elif k == 'slip': add(fx, lp(whoosh(.6, 1), 1500) * .12, t, 1, 0); E(t + .2, 'violins_trem', 'F5', 1.4, .25, .2, .22)
    elif k == 'knob': add(fx, creak(.06), t, 1, -.2); add(fx, click(pitch=.6, v=.08), t + .1, 1, -.2)
    elif k == 'flicker': add(fx, buzz(.45, .04), t, 1, -.3)
    elif k == 'off': add(fx, thump(.35, 80), t, 1, -.3); add(fx, click(pitch=.5, v=.15), t, 1, -.3)
    elif k == 'fogdrop': add(fx, lp(whoosh(e['d'], 1), 900) * .2, t, 1, 0)
    elif k == 'knock':
        for j in range(3): add(fx, knock(.5), t + j * .28, 1, 0)
    elif k == 'cutblack': pass
    elif k == 'cut': pass
# night air: low wind for the whole film, under everything
nn = N + PAD; wind = lp(brown(nn / SR + .1)[:nn], 500); wind = norm(wind) * (.6 + .4 * np.sin(2 * np.pi * np.arange(nn) / SR / 7))
add(amb, wind * .05, 0, 1, 0)

used = sorted({x[1] for x in score})
music = S.render(score, dur=DUR + 3, master=False)[:N + PAD]
if len(music) < N + PAD: music = np.pad(music, ((0, N + PAD - len(music)), (0, 0)))
mus[:len(music)] += music
mus = S.room(mus, size=.6, mix=.28)
# the dry cut: everything stops with the black, until the call to vote
a, b = int(cutb * SR), int(SC['cta']['t0'] * SR)
for buf in (mus, fx, amb): buf[a:b] *= 0
vo, fx, amb, mus = vo[:N], fx[:N], amb[:N], mus[:N]
env = np.abs(vo).max(1); kk = int(.03 * SR); env = np.convolve(env, np.ones(kk) / kk, 'same')
act = np.clip(env / (np.percentile(env[env > 1e-4], 50) + 1e-9), 0, 1)
dk = np.zeros(N); x0 = 0.0; att, rel = np.exp(-1 / (.05 * SR)), np.exp(-1 / (.4 * SR))
for i in range(0, N, 48):
    x = act[i]; x0 = att * x0 + (1 - att) * x if x > x0 else rel * x0 + (1 - rel) * x; dk[i:i + 48] = x0
speak = dk > .5; vr = np.sqrt((vo[speak] ** 2).mean()); mr = np.sqrt((mus[speak] ** 2).mean())
mg = (vr / 10 ** (12 / 20)) / (mr + 1e-9)
mix = vo + mus * mg * (1 - .35 * dk[:, None]) + fx + amb
mix = np.stack([compress(mix[:, c], thr=.3, ratio=2.5, att=.002) for c in (0, 1)], 1)
mix = mix / np.abs(mix).max() * .9; mix = np.stack([limit(mix[:, c], ceil=.9) for c in (0, 1)], 1)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
open(os.path.join(D, 'CREDITS_music.txt'), 'w').write('\n'.join(S.credits(used)) + '\n')
print('mix', mix.shape, 'music gain', round(float(mg), 3), 'instruments:', ', '.join(used))
