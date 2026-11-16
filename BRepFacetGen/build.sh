#!/bin/sh
set -eu
cd "$(dirname "$0")"
node scripts/sync-slides.mjs
cd ..
if [ "${1:-}" = "--build" ]; then
  shift
  bundle _2.7.2_ exec jekyll build "$@"
else
  bundle _2.7.2_ exec jekyll serve "$@"
fi
