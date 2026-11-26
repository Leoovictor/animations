#!/bin/sh
# Generates the three part sheets with the user's Codex CLI (core/image/gen_image.py), one after another (the second and third use the first as style reference).
set -e
LIB="${LIB:-$HOME/lemo-opuscar}"; HERE=$(cd "$(dirname "$0")/.." && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
p() { "$PY" -c "import json,sys;d=json.load(open('$HERE/tools/sheets.json'));print([s for s in d['sheets'] if s['name']=='$1'][0]['prompt'])"; }
[ -f "$HERE/src/sheet-ro.png" ] || { "$PY" core/image/gen_image.py "$(p sheet-ro)" --aspect 16:9 --out "$HERE/src" --name sheet-ro --timeout 600; mv "$HERE"/src/sheet-ro_*.png "$HERE/src/sheet-ro.png" 2>/dev/null || true; }
for n in sheet-co sheet-cr; do [ -f "$HERE/src/$n.png" ] || { "$PY" core/image/gen_image.py "$(p $n)" --aspect 16:9 --ref "$HERE/src/sheet-ro.png" --out "$HERE/src" --name $n --timeout 600; mv "$HERE"/src/${n}_*.png "$HERE/src/$n.png" 2>/dev/null || true; }; done
ls -la "$HERE/src"
