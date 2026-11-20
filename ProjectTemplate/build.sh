#!/bin/sh
set -eu
cd "$(dirname "$0")"
node scripts/sync-slides.mjs
node scripts/build.mjs
