#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bb content
npx shadow-cljs release app
echo "Built app/public"
