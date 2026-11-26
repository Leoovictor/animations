#!/bin/sh
# One command: voice → check → timeline → events → score/mix → picture → master → checks. (3D toon, 1080×1920, 30 fps)
set -e
LIB="${LIB:-$HOME/lemo-opuscar}"; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
"$PY" core/tts/tts_zh.py "$HERE/lines.json" "$HERE/voices" --voice pt-BR-AntonioNeural
"$PY" "$HERE/tools/env.py"
mkdir -p "$HERE/out"
"$PY" "$HERE/tools/timeline.py"
"$PY" core/render/srt.py "$HERE/out/srt_cues.json" "$HERE/umbral2.srt"
node core/render/events.mjs "$HERE" --size 1080x1920
"$PY" "$HERE/audio.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/umbral2.mp4" 30 1
node core/render/readcheck.mjs "$HERE" --size 1080x1920 > "$HERE/out/readcheck.txt" || true
echo "done: $HERE/umbral2.mp4"
