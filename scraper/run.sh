#!/bin/bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
PROJECT_DIR="/Users/macmini/toronto-pulse"
NPX_BIN="/usr/local/bin/npx"
GIT_BIN="/usr/bin/git"

cd "$PROJECT_DIR"

echo "[$(date)] Running Toronto Pulse scraper..."
echo "[$(date)] PATH=$PATH"
"$NPX_BIN" tsx scraper/scrape.ts

echo "[$(date)] Committing data..."
"$GIT_BIN" add public/data/pulse-data.json public/data/pulse-history.json
"$GIT_BIN" commit -m "data: pulse update $(date +%Y-%m-%d_%H:%M)" --allow-empty

echo "[$(date)] Pushing to main..."
"$GIT_BIN" push origin main

echo "[$(date)] Done."
