#!/bin/sh
# Zeus pilot: events → sound → picture → master → checks. 1080×1920, 30 fps, 12 s (360 frames). STRICT: a failed check stops the build.
set -e
LIB="${LIB:-$HOME/lemo-opuscar}"; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
"$PY" "$HERE/audio.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/pilot-zeus.mp4" 30 1
node core/render/readcheck.mjs "$HERE" --size 1080x1920 > "$HERE/out/readcheck.txt" || [ "$?" = 2 ]   # 2 = the pilot has no on-screen text to check
echo "done: $HERE/pilot-zeus.mp4"
