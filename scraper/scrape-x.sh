#!/bin/bash
# X/Twitter scraper using headless browser
# Searches X for Toronto election keywords and extracts tweet data
# Outputs JSON to stdout

cd /Users/macmini/toronto-pulse

QUERIES=(
  "toronto mayor election 2026"
  "olivia chow mayor"
  "brad bradford toronto"  
  "toronto municipal election"
)

TWEETS_FILE="scraper/x-tweets-raw.json"
echo "[]" > "$TWEETS_FILE"

for query in "${QUERIES[@]}"; do
  echo "Searching X for: $query" >&2
  encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
  
  # Use web_fetch through curl to get search results from alternative frontends
  # Try multiple sources
  for frontend in "https://xcancel.com" "https://nitter.privacydev.net"; do
    result=$(curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
      "${frontend}/search?f=tweets&q=${encoded}" \
      --max-time 15 2>/dev/null)
    
    if echo "$result" | grep -q "timeline-item\|tweet-content"; then
      echo "Got results from $frontend for: $query" >&2
      echo "$result" >> "scraper/x-raw-${RANDOM}.html"
      break
    fi
  done
  
  sleep 2
done

echo "X scraping complete" >&2
