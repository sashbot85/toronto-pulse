#!/usr/bin/env tsx
/**
 * Toronto Pulse Scraper
 * Scrapes Reddit + X (via Nitter), runs sentiment analysis,
 * and writes a static JSON file to public/data/pulse-data.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { format, subDays } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  url: string;
  source: 'reddit';
}

interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  post_title: string;
  permalink: string;
  source: 'reddit';
}

interface Tweet {
  id: string;
  text: string;
  author: string;
  handle: string;
  likes: number;
  retweets: number;
  created_utc: number;
  permalink: string;
  source: 'twitter';
}

// ─── Sentiment Keywords (from src/lib/sentiment.ts) ──────────────────────────

const CHOW_POSITIVE = [
  'good mayor', 'support chow', 'voting chow', 'chow is right',
  'approve', 'great job', 'doing well', 'better than', 're-elect',
  'good leadership', 'love chow', 'chow doing', 'olivia is',
  'chow has', 'chow will', 'backing chow', 'chow plan'
];

const CHOW_NEGATIVE = [
  'chow sucks', 'worst mayor', 'fire chow', 'chow failed',
  'terrible', 'incompetent', 'vote her out', 'disappointed',
  'disaster', 'hate chow', 'chow is bad', 'chow is wrong',
  'against chow', 'dump chow', 'chow is the worst', 'recall chow'
];

const BRADFORD_POSITIVE = [
  'support bradford', 'voting bradford', 'bradford is right',
  'fresh start', 'new leadership', 'better option', 'good platform',
  'love bradford', 'brad is', 'bradford has', 'backing bradford',
  'bradford plan', 'go bradford', 'vote bradford'
];

const BRADFORD_NEGATIVE = [
  'bradford sucks', 'unknown', 'no experience', 'who is bradford',
  "can't win", 'weak candidate', 'hate bradford', 'against bradford',
  'bradford is bad', 'bradford failed', 'bradford is wrong',
  'no bradford', 'dump bradford', 'brad sucks'
];

const ISSUE_KEYWORDS: Record<string, string[]> = {
  'Housing': ['housing', 'rent', 'affordable', 'condo', 'landlord', 'tenant', 'eviction', 'zoning'],
  'Transit/TTC': ['transit', 'ttc', 'subway', 'bus', 'traffic', 'bike lane', 'eglinton', 'streetcar'],
  'Safety': ['safety', 'crime', 'police', 'shooting', 'violence', 'theft', 'assault'],
  'Affordability': ['affordability', 'cost of living', 'taxes', 'property tax', 'inflation', 'expensive'],
  'Homelessness': ['homeless', 'encampment', 'shelter', 'mental health', 'addiction'],
  'Development': ['development', 'construction', 'condo tower', 'heritage', 'neighbourhood'],
};

const GEO_KEYWORDS: Record<string, string[]> = {
  'Downtown': ['downtown', 'dt toronto', 'queen west', 'king st', 'financial district', 'yonge', 'bloor', 'spadina', 'kensington'],
  'North York': ['north york', 'thornhill', 'sheppard', 'willowdale', 'don mills', 'york mills'],
  'Scarborough': ['scarborough', 'malvern', 'agincourt', 'markham rd', 'warden'],
  'Etobicoke': ['etobicoke', 'mississauga rd', 'bloor west', 'humber', 'long branch'],
  'East York': ['east york', 'danforth', 'greektown', 'pape', 'broadview'],
};

// ─── Sentiment Helpers ───────────────────────────────────────────────────────

function mentionsChow(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('chow') || lower.includes('olivia');
}

function mentionsBradford(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('bradford') || lower.includes('brad ');
}

function scoreText(text: string, positiveKw: string[], negativeKw: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of positiveKw) if (lower.includes(kw)) score++;
  for (const kw of negativeKw) if (lower.includes(kw)) score--;
  if (score > 0) return 1;
  if (score < 0) return -1;
  return 0;
}

function detectIssues(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(ISSUE_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => lower.includes(kw)))
    .map(([issue]) => issue);
}

function detectGeo(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(GEO_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => lower.includes(kw)))
    .map(([area]) => area);
}

// ─── Reddit Scraping ─────────────────────────────────────────────────────────

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  const query = 'election OR mayor OR chow OR bradford OR municipal';
  const url = `https://old.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&limit=50`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'TorontoPulseBot/1.0' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Reddit API error: ${response.status}`);

  const data = await response.json() as { data: { children: Array<{ data: RedditPost }> } };
  return data.data.children.map(child => ({
    id: child.data.id,
    title: child.data.title,
    selftext: child.data.selftext || '',
    author: child.data.author,
    score: child.data.score,
    num_comments: child.data.num_comments,
    created_utc: child.data.created_utc,
    subreddit: child.data.subreddit,
    permalink: child.data.permalink,
    url: child.data.url,
    source: 'reddit' as const,
  }));
}

function extractComments(data: unknown, postTitle: string, subreddit: string): RedditComment[] {
  const comments: RedditComment[] = [];
  if (!Array.isArray(data) || data.length < 2) return comments;

  const commentListing = (data[1] as { data?: { children?: unknown[] } })?.data?.children || [];

  function processComment(comment: unknown): void {
    if (!comment || typeof comment !== 'object') return;
    const c = comment as {
      kind?: string;
      data?: {
        body?: string; author?: string; score?: number;
        created_utc?: number; permalink?: string; id?: string;
        replies?: unknown;
      }
    };
    if (c.kind !== 't1' || !c.data) return;
    if (c.data.body && c.data.body !== '[deleted]') {
      comments.push({
        id: c.data.id || '',
        body: c.data.body.slice(0, 500),
        author: c.data.author || '[deleted]',
        score: c.data.score || 0,
        created_utc: c.data.created_utc || 0,
        post_title: postTitle,
        permalink: c.data.permalink || `/r/${subreddit}/comments/`,
        source: 'reddit' as const,
      });
    }
    const replies = (c.data.replies as { data?: { children?: unknown[] } })?.data?.children || [];
    if (Array.isArray(replies)) replies.slice(0, 5).forEach(processComment);
  }

  commentListing.slice(0, 30).forEach(processComment);
  return comments;
}

async function fetchPostComments(post: RedditPost): Promise<RedditComment[]> {
  const url = `https://old.reddit.com/r/${post.subreddit}/comments/${post.id}.json?limit=30&depth=2`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TorontoPulseBot/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Reddit comments error: ${response.status}`);
  const data = await response.json();
  return extractComments(data, post.title, post.subreddit);
}

// ─── Nitter / X Scraping ─────────────────────────────────────────────────────

const NITTER_INSTANCES = [
  'https://nitter.poast.org',
  'https://xcancel.com',
  'https://nitter.privacydev.net',
  'https://nitter.cz',
];

function parseTweets(html: string, baseUrl: string): Tweet[] {
  const tweets: Tweet[] = [];

  // Extract tweet blocks
  const tweetPattern = /<div class="timeline-item[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;

  // Use a simpler line-by-line approach
  const lines = html.split('\n');
  let currentTweet: Partial<Tweet> | null = null;
  let inTweet = false;
  let tweetHtml = '';

  // Try regex approach on the whole HTML
  const itemRegex = /<div class="timeline-item[^"]*">([\s\S]*?)(?=<div class="timeline-item|<\/div>\s*<\/div>\s*<div class="timeline-|$)/g;

  while ((match = itemRegex.exec(html)) !== null) {
    const block = match[0];

    // Extract username/handle
    const handleMatch = block.match(/class="username"[^>]*>@([^<]+)</);
    const nameMatch = block.match(/class="fullname"[^>]*>([^<]+)</);

    // Extract tweet text
    const textMatch = block.match(/class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);

    // Extract timestamp
    const timeMatch = block.match(/datetime="([^"]+)"/);

    // Extract stats
    const likeMatch = block.match(/class="icon-heart[^"]*"[\s\S]*?<span[^>]*>(\d+)/);
    const retweetMatch = block.match(/class="icon-retweet[^"]*"[\s\S]*?<span[^>]*>(\d+)/);

    // Extract permalink
    const linkMatch = block.match(/class="tweet-link" href="([^"]+)"/);

    if (!handleMatch || !textMatch) continue;

    // Clean text
    const rawText = textMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (!rawText) continue;

    const handle = handleMatch[1].trim();
    const name = nameMatch ? nameMatch[1].trim() : handle;
    const permalink = linkMatch
      ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://twitter.com${linkMatch[1].replace(/^\/[^/]+/, '')}`)
      : `https://twitter.com/${handle}`;

    let created_utc = Math.floor(Date.now() / 1000);
    if (timeMatch) {
      try {
        created_utc = Math.floor(new Date(timeMatch[1]).getTime() / 1000);
      } catch { /* keep default */ }
    }

    const id = `tweet_${handle}_${created_utc}`;

    tweets.push({
      id,
      text: rawText.slice(0, 500),
      author: name,
      handle,
      likes: likeMatch ? parseInt(likeMatch[1], 10) : 0,
      retweets: retweetMatch ? parseInt(retweetMatch[1], 10) : 0,
      created_utc,
      permalink,
      source: 'twitter' as const,
    });

    if (tweets.length >= 30) break;
  }

  return tweets;
}

async function fetchTweets(): Promise<Tweet[]> {
  const query = 'toronto election chow bradford mayor 2026';
  const encodedQuery = encodeURIComponent(query);

  for (const instance of NITTER_INSTANCES) {
    try {
      console.log(`  Trying nitter: ${instance}`);
      const url = `${instance}/search?f=tweets&q=${encodedQuery}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(`  ${instance} returned ${response.status}`);
        continue;
      }

      const html = await response.text();
      if (html.includes('timeline-item') || html.includes('tweet-content')) {
        const tweets = parseTweets(html, instance);
        if (tweets.length > 0) {
          console.log(`  Got ${tweets.length} tweets from ${instance}`);
          return tweets;
        }
        console.warn(`  ${instance} responded but no tweets parsed`);
      } else {
        console.warn(`  ${instance} response doesn't look like tweets`);
      }
    } catch (err) {
      console.warn(`  ${instance} failed: ${(err as Error).message}`);
    }
  }

  console.warn('  All nitter instances failed — no tweets collected');
  return [];
}

// ─── Sentiment Analysis ───────────────────────────────────────────────────────

function runSentimentAnalysis(
  posts: RedditPost[],
  comments: RedditComment[],
  tweets: Tweet[]
) {
  const allItems: Array<{ text: string; created_utc: number }> = [
    ...posts.map(p => ({ text: `${p.title} ${p.selftext}`, created_utc: p.created_utc })),
    ...comments.map(c => ({ text: c.body, created_utc: c.created_utc })),
    ...tweets.map(t => ({ text: t.text, created_utc: t.created_utc })),
  ];

  let chowPos = 0, chowNeg = 0, chowNeutral = 0;
  let bradPos = 0, bradNeg = 0, bradNeutral = 0;
  const issueCounts: Record<string, { count: number; sentiment: number }> = {};
  const geoCounts: Record<string, { count: number; sentiment: number }> = {};

  // Daily volume buckets (last 14 days)
  const dayBuckets: Record<string, {
    chowPos: number; chowNeg: number; chowNeutral: number;
    bradPos: number; bradNeg: number; bradNeutral: number; total: number;
  }> = {};
  for (let i = 13; i >= 0; i--) {
    const day = format(subDays(new Date(), i), 'yyyy-MM-dd');
    dayBuckets[day] = { chowPos: 0, chowNeg: 0, chowNeutral: 0, bradPos: 0, bradNeg: 0, bradNeutral: 0, total: 0 };
  }

  for (const item of allItems) {
    const { text, created_utc } = item;
    let day: string;
    try {
      day = format(new Date(created_utc * 1000), 'yyyy-MM-dd');
    } catch { day = format(new Date(), 'yyyy-MM-dd'); }

    const hasChow = mentionsChow(text);
    const hasBrad = mentionsBradford(text);

    if (hasChow) {
      const s = scoreText(text, CHOW_POSITIVE, CHOW_NEGATIVE);
      if (s > 0) chowPos++; else if (s < 0) chowNeg++; else chowNeutral++;
      if (dayBuckets[day]) {
        if (s > 0) dayBuckets[day].chowPos++;
        else if (s < 0) dayBuckets[day].chowNeg++;
        else dayBuckets[day].chowNeutral++;
        dayBuckets[day].total++;
      }
    }

    if (hasBrad) {
      const s = scoreText(text, BRADFORD_POSITIVE, BRADFORD_NEGATIVE);
      if (s > 0) bradPos++; else if (s < 0) bradNeg++; else bradNeutral++;
      if (dayBuckets[day]) {
        if (s > 0) dayBuckets[day].bradPos++;
        else if (s < 0) dayBuckets[day].bradNeg++;
        else dayBuckets[day].bradNeutral++;
        dayBuckets[day].total++;
      }
    }

    // Issues
    for (const issue of detectIssues(text)) {
      if (!issueCounts[issue]) issueCounts[issue] = { count: 0, sentiment: 0 };
      issueCounts[issue].count++;
      const overallS = hasChow
        ? scoreText(text, CHOW_POSITIVE, CHOW_NEGATIVE)
        : hasBrad ? scoreText(text, BRADFORD_POSITIVE, BRADFORD_NEGATIVE) : 0;
      issueCounts[issue].sentiment += overallS;
    }

    // Geo
    for (const geo of detectGeo(text)) {
      if (!geoCounts[geo]) geoCounts[geo] = { count: 0, sentiment: 0 };
      geoCounts[geo].count++;
    }
  }

  const volumeByDay = Object.entries(dayBuckets).map(([date, data]) => ({ date, ...data }));
  const recentDays = volumeByDay.slice(-7);
  const prevDays = volumeByDay.slice(-14, -7);
  const recentChowScore = recentDays.reduce((a, d) => a + d.chowPos - d.chowNeg, 0);
  const prevChowScore = prevDays.reduce((a, d) => a + d.chowPos - d.chowNeg, 0);
  const recentBradScore = recentDays.reduce((a, d) => a + d.bradPos - d.bradNeg, 0);
  const prevBradScore = prevDays.reduce((a, d) => a + d.bradPos - d.bradNeg, 0);

  const chowTotal = chowPos + chowNeg + chowNeutral;
  const bradTotal = bradPos + bradNeg + bradNeutral;

  return {
    chowSentiment: {
      positive: chowPos, negative: chowNeg, neutral: chowNeutral,
      total: chowTotal,
      score: chowTotal > 0 ? Math.round((chowPos / chowTotal) * 100) : 0,
      trend: (recentChowScore >= prevChowScore ? 'up' : 'down') as 'up' | 'down',
    },
    bradfordSentiment: {
      positive: bradPos, negative: bradNeg, neutral: bradNeutral,
      total: bradTotal,
      score: bradTotal > 0 ? Math.round((bradPos / bradTotal) * 100) : 0,
      trend: (recentBradScore >= prevBradScore ? 'up' : 'down') as 'up' | 'down',
    },
    topIssues: Object.entries(issueCounts)
      .map(([name, { count, sentiment }]) => ({
        name, count,
        sentiment: count > 0 ? Math.max(-1, Math.min(1, sentiment / count)) : 0,
      }))
      .sort((a, b) => b.count - a.count),
    volumeByDay,
    geoData: Object.entries(geoCounts)
      .map(([area, { count, sentiment }]) => ({
        area, count,
        sentiment: count > 0 ? Math.max(-1, Math.min(1, sentiment / count)) : 0,
      }))
      .sort((a, b) => b.count - a.count),
    postsAnalyzed: allItems.length,
    lastUpdated: Date.now(),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Toronto Pulse Scraper] Starting...');
  const startTime = Date.now();

  // 1. Fetch Reddit posts
  console.log('\n[Reddit] Fetching posts...');
  const subreddits = ['toronto', 'CanadaPolitics', 'TorontoPolitics'];
  const postResults = await Promise.allSettled(subreddits.map(s => fetchSubredditPosts(s)));

  const allPosts: RedditPost[] = [];
  for (let i = 0; i < postResults.length; i++) {
    const r = postResults[i];
    if (r.status === 'fulfilled') {
      console.log(`  r/${subreddits[i]}: ${r.value.length} posts`);
      allPosts.push(...r.value);
    } else {
      console.warn(`  r/${subreddits[i]} failed: ${r.reason}`);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniquePosts = allPosts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).sort((a, b) => b.created_utc - a.created_utc);

  console.log(`  Total unique posts: ${uniquePosts.length}`);

  // 2. Fetch comments for top 5 posts
  console.log('\n[Reddit] Fetching comments for top 5 posts...');
  const topPosts = uniquePosts.slice(0, 5);
  const allComments: RedditComment[] = [];

  for (const post of topPosts) {
    try {
      const comments = await fetchPostComments(post);
      console.log(`  ${post.id} (${post.subreddit}): ${comments.length} comments`);
      allComments.push(...comments);
      await new Promise(r => setTimeout(r, 600)); // rate limit
    } catch (err) {
      console.warn(`  Failed to fetch comments for ${post.id}: ${(err as Error).message}`);
    }
  }

  // 3. Fetch tweets
  console.log('\n[Twitter/X] Fetching tweets via Nitter...');
  const tweets = await fetchTweets();

  // 4. Run sentiment analysis
  console.log('\n[Sentiment] Analyzing...');
  const sentiment = runSentimentAnalysis(uniquePosts, allComments, tweets);
  console.log(`  Posts analyzed: ${sentiment.postsAnalyzed}`);
  console.log(`  Chow mentions: ${sentiment.chowSentiment.total}, Bradford mentions: ${sentiment.bradfordSentiment.total}`);

  // 5. Write output
  const outputDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'public', 'data');
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'pulse-data.json');
  const output = {
    lastScraped: Date.now(),
    posts: uniquePosts,
    comments: allComments,
    tweets,
    sentiment,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n[Done] Written to ${outputPath}`);
  console.log(`  Posts: ${uniquePosts.length}, Comments: ${allComments.length}, Tweets: ${tweets.length}`);
  console.log(`  Elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(err => {
  console.error('[Scraper Error]', err);
  process.exit(1);
});
