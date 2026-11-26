"""Generate the sheets listed in a prompts.py with the Codex CLI image tool (Lemo-Opuscar core/image/gen_image.py). Skips images that exist.
Usage: <LIB>/.venv/bin/python tools/gen_sheets.py assets/characters/zeus/sheets [name ...]"""
import importlib.util, os, subprocess, sys, glob, shutil
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
d = os.path.abspath(sys.argv[1]); only = set(sys.argv[2:])
spec = importlib.util.spec_from_file_location('prompts', os.path.join(d, 'prompts.py')); P = importlib.util.module_from_spec(spec); spec.loader.exec_module(P)
for s in P.SHEETS:
    if only and s['name'] not in only: continue
    out = os.path.join(d, s['name'] + '.png')
    if os.path.exists(out): print('exists', out); continue
    cmd = [os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/image/gen_image.py'), s['prompt'], '--aspect', s['aspect'], '--out', d, '--name', s['name'], '--timeout', '600']
    if s.get('ref'): cmd += ['--ref', os.path.normpath(os.path.join(d, s['ref']))]
    r = subprocess.run(cmd, cwd=LIB)
    got = sorted(glob.glob(os.path.join(d, s['name'] + '_2*.png')))
    if r.returncode or not got: sys.exit(f"generation failed: {s['name']} (exit {r.returncode})")
    shutil.move(got[-1], out); print('wrote', out)
