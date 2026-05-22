#!/usr/bin/env tsx
/**
 * Toronto Pulse Scraper
 * Scrapes Reddit + social posts, runs sentiment analysis,
 * and writes a static JSON file to public/data/pulse-data.json
 */

import { generatePulseData, getPulseDataOutputPath, writePulseDataFile } from '../src/lib/pulse-generator';

async function main() {
  const startTime = Date.now();
  const output = await generatePulseData();
  const outputPath = getPulseDataOutputPath();
  writePulseDataFile(output, outputPath);

  console.log(`\n[Done] Written to ${outputPath}`);
  console.log(`  Posts: ${output.posts.length}, Comments: ${output.comments.length}, Tweets: ${output.tweets.length}`);
  console.log(`  Elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(err => {
  console.error('[Scraper Error]', err);
  process.exit(1);
});
