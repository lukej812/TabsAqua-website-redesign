#!/usr/bin/env bash
# Rebuilds into .next-test and (re)starts it on port 3200, for design review.
set -euo pipefail
pkill -f "next start --port 3200" || true
NEXT_DIST_DIR=.next-test npx next build 2>&1 | grep -E "rror|✓ Generating|⨯|Route|○|ƒ" || true
(NEXT_DIST_DIR=.next-test nohup npx next start --port 3200 >/dev/null 2>&1 &)
for _ in $(seq 1 40); do curl -s -o /dev/null http://localhost:3200/ && exit 0; sleep 0.5; done
echo "server did not start" >&2; exit 1
