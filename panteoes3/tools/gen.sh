#!/bin/sh
# Generate the images named on the command line (default: all) with tools/sheets.py prompts. Skips files that exist.
LIB="${LIB:-$HOME/lemo-opuscar}"; HERE=$(cd "$(dirname "$0")/.." && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
for n in "$@"; do
  [ -f "$HERE/src/$n.png" ] && continue
  eval "$("$PY" -c "
import sys,shlex;sys.path.insert(0,'$HERE/tools');from sheets import SHEETS
s=[x for x in SHEETS if x['name']=='$n'][0]
print('P='+shlex.quote(s['prompt']));print('A='+s['aspect']);print('R='+(s['ref'] or ''))")"
  if [ -n "$R" ]; then set -- --ref "$HERE/src/$R.png"; else set --; fi
  "$PY" core/image/gen_image.py "$P" --aspect "$A" "$@" --out "$HERE/src" --name "$n" --timeout 600 && mv "$HERE"/src/${n}_2*.png "$HERE/src/$n.png" 2>/dev/null
done
ls "$HERE/src"
