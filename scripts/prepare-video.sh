#!/usr/bin/env bash
# Prepares the guided descent media from one master clip.
#
#   bash scripts/prepare-video.sh <your-master-clip.mov>            # video, mobile cut, posters
#   bash scripts/prepare-video.sh <your-master-clip.mov> --frames 90 # also a 90-frame image sequence
#
# Writes into public/video and public/images. Uses ffmpeg from the ffmpeg-static
# dev dependency unless FFMPEG points at another binary. See docs/video-production.md
# for why each setting was chosen and the size budget each file must meet.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/prepare-video.sh <master> [--frames <count>]" >&2
  exit 1
fi

MASTER="$1"
shift
FRAMES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --frames) FRAMES="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# npm runs scripts from the project folder, even with --prefix. Resolve relative
# paths against the folder the command was typed in (npm sets INIT_CWD to it).
from_caller() {
  case "$1" in
    /*) printf '%s' "$1" ;;
    *) printf '%s/%s' "${INIT_CWD:-$PWD}" "$1" ;;
  esac
}
MASTER="$(from_caller "$MASTER")"

if [[ ! -f "$MASTER" ]]; then
  echo "Can't find the master clip: $MASTER" >&2
  echo "Pass the path to the real footage, for example:" >&2
  echo "  npm --prefix tabs-aquaquest-diving run video:prepare -- ~/Movies/descent-master.mov" >&2
  exit 1
fi

FF="${FFMPEG:-$(cd "$ROOT" && node -p "require('ffmpeg-static')")}"
# OUT lets you write somewhere other than public/ (for a dry run).
OUT="$(from_caller "${OUT:-$ROOT/public}")"
VIDEO="$OUT/video"
IMAGES="$OUT/images"
mkdir -p "$VIDEO" "$IMAGES"

run() { "$FF" -hide_banner -loglevel error -y "$@"; }

echo "1/5  MP4 (H.264), the primary source. Keyframe every 8 frames, no B-frames, no audio."
# -g 8 / -keyint_min 8 / -sc_threshold 0: a keyframe at least every 8 frames, so any
#   seek decodes at most 7 frames. Measured 16 ms average vs 158 ms at the default.
# -bf 0: no B-frames, so frames decode in display order and seeks stay cheap.
# -crf 23 with -maxrate 4M: good quality, hard cap of about 7 MB for 14 s.
# -movflags +faststart: metadata at the front, so duration is known after the first request.
# -an: drops the audio track.
run -i "$MASTER" -an \
  -vf "scale=1920:-2:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 23 -maxrate 4M -bufsize 8M \
  -profile:v high -level 4.1 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -bf 0 \
  -movflags +faststart \
  "$VIDEO/guided-descent.mp4"

echo "2/5  WebM (VP9), the fallback. Same keyframe spacing."
run -i "$MASTER" -an \
  -vf "scale=1920:-2:flags=lanczos,fps=30" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  -g 8 -keyint_min 8 \
  "$VIDEO/guided-descent.webm"

echo "3/5  Mobile MP4, 960 px wide. Phones only get video when this file exists."
run -i "$MASTER" -an \
  -vf "scale=960:-2:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 25 -maxrate 1.6M -bufsize 3.2M \
  -profile:v main -level 3.1 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -bf 0 \
  -movflags +faststart \
  "$VIDEO/guided-descent-mobile.mp4"

echo "4/5  Posters from the first frame: 1920 px wide, and a 4:5 crop for phones."
run -i "$MASTER" -frames:v 1 -vf "scale=1920:-2:flags=lanczos" -c:v libwebp -quality 72 \
  "$IMAGES/guided-descent-poster.webp"
run -i "$MASTER" -frames:v 1 -vf "crop=ih*4/5:ih,scale=1080:-2:flags=lanczos" -c:v libwebp -quality 70 \
  "$IMAGES/guided-descent-mobile.webp"

if [[ "$FRAMES" -gt 0 ]]; then
  echo "5/5  Image sequence: $FRAMES frames, 1280 px wide (only for NEXT_PUBLIC_USE_FRAME_SEQUENCE=true)."
  # "ffmpeg -i" with no output exits non-zero by design, hence "|| true".
  DURATION="$({ "$FF" -hide_banner -i "$MASTER" 2>&1 || true; } | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')"
  RATE="$(awk -v n="$FRAMES" -v d="$DURATION" 'BEGIN { printf "%.4f", n / d }')"
  rm -rf "$VIDEO/frames"
  mkdir -p "$VIDEO/frames"
  run -i "$MASTER" -vf "fps=$RATE,scale=1280:-2:flags=lanczos" -frames:v "$FRAMES" \
    -c:v libwebp -quality 62 "$VIDEO/frames/frame-%04d.webp"
  COUNT="$(ls "$VIDEO/frames"/frame-*.webp | wc -l | tr -d ' ')"
  HEIGHT="$({ "$FF" -hide_banner -i "$VIDEO/frames/frame-0001.webp" 2>&1 || true; } | sed -n 's/.*, \([0-9]*\)x\([0-9]*\).*/\2/p' | head -1)"
  printf '{\n  "count": %s,\n  "width": 1280,\n  "height": %s,\n  "pattern": "/video/frames/frame-%%04d.webp"\n}\n' "$COUNT" "$HEIGHT" \
    > "$VIDEO/frames/manifest.json"
else
  echo "5/5  Image sequence skipped (pass --frames <count> to build one)."
fi

echo
echo "Sizes (check against the budget in docs/video-production.md):"
du -h "$VIDEO"/guided-descent* "$IMAGES"/guided-descent* 2>/dev/null
[[ -d "$VIDEO/frames" ]] && du -sh "$VIDEO/frames"
echo
echo "Next: node scripts/seek-bench.mjs public/video/guided-descent.mp4 public/video/guided-descent.webm"
