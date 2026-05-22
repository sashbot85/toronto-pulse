#!/bin/bash
set -e

cd /Users/macmini/toronto-pulse

echo "[$(date)] Running Toronto Pulse scraper..."
npx tsx scraper/scrape.ts

echo "[$(date)] Committing data..."
git add public/data/pulse-data.json public/data/pulse-history.json
git commit -m "data: pulse update $(date +%Y-%m-%d_%H:%M)" --allow-empty

echo "[$(date)] Pushing to main..."
git push origin main

echo "[$(date)] Done."
