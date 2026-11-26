"""Voice envelopes for lip sync (30 per second, 0..1): writes env.json."""
import json, os, numpy as np, soundfile as sf
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); out = {}
for l in json.load(open(D + '/lines.json', encoding='utf-8')):
    y, sr = sf.read(f"{D}/voices/{l['id']}.wav"); y = y if y.ndim == 1 else y.mean(1)
    hop = sr // 30; n = len(y) // hop; r = np.array([np.sqrt((y[i * hop:(i + 1) * hop] ** 2).mean()) for i in range(n)])
    r = r / (np.percentile(r, 95) + 1e-9); out[l['id']] = [round(float(min(1, x)), 2) for x in r]
json.dump(out, open(D + '/env.json', 'w'))
