import * as fs from 'fs';
import * as path from 'path';
import { format, subDays } from 'date-fns';
import { fileURLToPath } from 'url';
import {
  CHOW_NEGATIVE,
  CHOW_POSITIVE,
  BRADFORD_NEGATIVE,
  BRADFORD_POSITIVE,
  getSentimentScore,
  mentionsBradford,
  mentionsChow,
} from './sentiment';
import type { WeightedRule } from './sentiment';

export interface RedditPost {
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

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  post_title: string;
  permalink: string;
  source: 'reddit';
}

export interface Tweet {
  id: string;
  text: string;
  author: string;
  handle: string;
  likes: number;
  retweets: number;
  created_utc: number;
  permalink: string;
  source: 'twitter' | 'bluesky';
}

export interface PulseData {
  lastScraped: number;
  posts: RedditPost[];
  comments: RedditComment[];
  tweets: Tweet[];
  sentiment: SentimentAnalysisResult;
}

interface DailyHistoryPoint {
  date: string;
  chowPos: number;
  chowNeg: number;
  chowNeutral: number;
  bradPos: number;
  bradNeg: number;
  bradNeutral: number;
  total: number;
}

interface DailyArchiveEntry {
  date: string;
  capturedAt: number;
  posts: RedditPost[];
  comments: RedditComment[];
  tweets: Tweet[];
  sentiment: SentimentAnalysisResult;
}

interface TopicHistoryPoint {
  date: string;
  count: number;
  sentiment: number;
}

interface TopicHistorySeries {
  name: string;
  totalCount: number;
  avgSentiment: number;
  days: TopicHistoryPoint[];
}

interface SentimentAnalysisResult {
  chowSentiment: {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
    score: number;
    trend: 'up' | 'down';
  };
  bradfordSentiment: {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
    score: number;
    trend: 'up' | 'down';
  };
  topIssues: Array<{
    name: string;
    count: number;
    sentiment: number;
  }>;
  issueHistory: TopicHistorySeries[];
  volumeByDay: DailyHistoryPoint[];
  geoData: Array<{
    area: string;
    count: number;
    sentiment: number;
  }>;
  geoHistory: TopicHistorySeries[];
  postsAnalyzed: number;
  lastUpdated: number;
}

interface TrendArchiveEntry {
  date: string;
  sentiment: {
    topIssues: SentimentAnalysisResult['topIssues'];
    geoData: SentimentAnalysisResult['geoData'];
  };
}

const HISTORY_DAYS = 90;

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

const GENERIC_POSITIVE = [...CHOW_POSITIVE, ...BRADFORD_POSITIVE];
const GENERIC_NEGATIVE = [...CHOW_NEGATIVE, ...BRADFORD_NEGATIVE];

function scoreText(text: string, positiveKw: WeightedRule[], negativeKw: WeightedRule[]): number {
  const score = getSentimentScore(text, positiveKw, negativeKw);
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

function scoreOverallText(text: string, hasChow: boolean, hasBrad: boolean): number {
  if (hasChow) return scoreText(text, CHOW_POSITIVE, CHOW_NEGATIVE);
  if (hasBrad) return scoreText(text, BRADFORD_POSITIVE, BRADFORD_NEGATIVE);
  return scoreText(text, GENERIC_POSITIVE, GENERIC_NEGATIVE);
}

function buildTopicHistoryFromArchive(
  archiveEntries: TrendArchiveEntry[],
  selector: (entry: TrendArchiveEntry) => Array<{ name: string; count: number; sentiment: number }>,
  limit = 6,
): TopicHistorySeries[] {
  const seriesMap = new Map<string, { totalCount: number; weightedSentiment: number; days: TopicHistoryPoint[] }>();

  for (const entry of archiveEntries.slice(-HISTORY_DAYS)) {
    for (const item of selector(entry)) {
      if (!seriesMap.has(item.name)) {
        seriesMap.set(item.name, { totalCount: 0, weightedSentiment: 0, days: [] });
      }

      const current = seriesMap.get(item.name)!;
      current.totalCount += item.count;
      current.weightedSentiment += item.sentiment * item.count;
      current.days.push({
        date: entry.date,
        count: item.count,
        sentiment: item.sentiment,
      });
    }
  }

  return Array.from(seriesMap.entries())
    .map(([name, value]) => ({
      name,
      totalCount: value.totalCount,
      avgSentiment: value.totalCount > 0 ? Math.max(-1, Math.min(1, value.weightedSentiment / value.totalCount)) : 0,
      days: value.days.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, limit);
}

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

const X_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAABPy9gEAAAAAnL2nhrfiek5PYNiVD93bAWCYGCQ%3DoPU8eNCFChjfVVIRgZgBPDB0PgoHy5uJmRTUZOH8N1E50mPfNW';

const X_SEARCH_QUERIES = [
  'toronto mayor',
  'olivia chow',
  'brad bradford',
  'toronto election 2026',
  'toronto municipal election',
  'toronto city hall',
];

interface XApiResponse {
  data?: Array<{
    id: string;
    text: string;
    author_id: string;
    created_at?: string;
    public_metrics?: {
      like_count: number;
      retweet_count: number;
      reply_count: number;
    };
  }>;
  includes?: {
    users?: Array<{
      id: string;
      name: string;
      username: string;
    }>;
  };
}

async function fetchXSearchResults(query: string, maxResults = 50): Promise<Tweet[]> {
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.min(maxResults, 100)}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username,name`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${X_BEARER_TOKEN}`,
      'User-Agent': 'TorontoPulseBot/1.0',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`X API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data: XApiResponse = await response.json();
  if (!data.data || data.data.length === 0) return [];

  const userMap = new Map<string, { name: string; username: string }>();
  for (const user of data.includes?.users || []) {
    userMap.set(user.id, { name: user.name, username: user.username });
  }

  return data.data.map(tweet => {
    const user = userMap.get(tweet.author_id);
    const createdAt = tweet.created_at ? new Date(tweet.created_at) : new Date();

    return {
      id: `x_${tweet.id}`,
      text: tweet.text.slice(0, 500),
      author: user?.name || 'Unknown',
      handle: user?.username ? `@${user.username}` : '@unknown',
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      created_utc: Math.floor(createdAt.getTime() / 1000),
      permalink: `https://x.com/${user?.username || 'i'}/status/${tweet.id}`,
      source: 'twitter' as const,
    };
  });
}

async function fetchXTweets(): Promise<Tweet[]> {
  const allTweets: Tweet[] = [];
  const seenIds = new Set<string>();

  for (const query of X_SEARCH_QUERIES) {
    try {
      console.log(`  X API search: "${query}"`);
      const tweets = await fetchXSearchResults(query, 50);
      for (const tweet of tweets) {
        if (!seenIds.has(tweet.id)) {
          seenIds.add(tweet.id);
          allTweets.push(tweet);
        }
      }
      console.log(`  "${query}": ${tweets.length} tweets (${allTweets.length} total unique)`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`  X search "${query}" failed: ${(err as Error).message}`);
    }
  }

  return allTweets.sort((a, b) => b.created_utc - a.created_utc);
}

const BLUESKY_ACTORS = [
  'oliviachow.bsky.social',
  'joshmatlow.bsky.social',
  'ausmamalik.bsky.social',
  'coteau.bsky.social',
  'bradford.bsky.social',
];

function extractPostText(record: Record<string, unknown>): string {
  const text = typeof record.text === 'string' ? record.text : '';
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchBlueskyFeed(actor: string, limit = 20): Promise<Tweet[]> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Bluesky feed error: ${response.status}`);

  const data = await response.json() as {
    feed?: Array<{
      reason?: unknown;
      post?: {
        uri?: string;
        indexedAt?: string;
        author?: { displayName?: string; handle?: string };
        record?: Record<string, unknown> & { createdAt?: string; reply?: unknown };
      };
    }>;
  };

  const mapped: Array<Tweet | null> = (data.feed || [])
    .filter(item => item.post?.record && !item.reason && !item.post.record.reply)
    .map(item => {
      const record = item.post!.record!;
      const handle = item.post?.author?.handle || actor;
      const text = extractPostText(record);
      if (!text) return null;

      const uri = item.post?.uri || '';
      const uriParts = uri.split('/');
      const postId = uriParts[uriParts.length - 1] || `${handle}-${Date.now()}`;
      const createdAt = typeof record.createdAt === 'string' ? record.createdAt : item.post?.indexedAt;
      const created_utc = createdAt ? Math.floor(new Date(createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000);

      return {
        id: `bsky_${handle}_${postId}`,
        text: text.slice(0, 500),
        author: item.post?.author?.displayName?.trim() || handle,
        handle,
        likes: 0,
        retweets: 0,
        created_utc,
        permalink: `https://bsky.app/profile/${handle}/post/${postId}`,
        source: 'bluesky' as const,
      };
    });

  return mapped.filter((tweet): tweet is Tweet => tweet !== null);
}

async function fetchBlueskyTweets(): Promise<Tweet[]> {
  const allTweets: Tweet[] = [];

  for (const actor of BLUESKY_ACTORS) {
    try {
      console.log(`  Bluesky feed: ${actor}`);
      const posts = await fetchBlueskyFeed(actor, 20);
      console.log(`  ${actor}: ${posts.length} posts`);
      allTweets.push(...posts);
    } catch (err) {
      console.warn(`  ${actor} failed: ${(err as Error).message}`);
    }
  }

  const electionKeywords = [
    'toronto', 'mayor', 'city hall', 'housing', 'ttc', 'transit', 'scarborough',
    'north york', 'etobicoke', 'east york', 'budget', 'tax', 'olivia', 'chow', 'bradford'
  ];

  return allTweets
    .filter(tweet => electionKeywords.some(kw => tweet.text.toLowerCase().includes(kw)))
    .sort((a, b) => b.created_utc - a.created_utc)
    .slice(0, 20);
}

async function fetchAllSocial(): Promise<Tweet[]> {
  console.log('\n[X/Twitter] Fetching via API...');
  const xTweets = await fetchXTweets();
  console.log(`  X total: ${xTweets.length} tweets`);

  console.log('\n[Bluesky] Fetching feeds...');
  const bskyTweets = await fetchBlueskyTweets();
  console.log(`  Bluesky total: ${bskyTweets.length} posts`);

  const combined = [...xTweets, ...bskyTweets].sort((a, b) => b.created_utc - a.created_utc);
  console.log(`  Combined social: ${combined.length} items`);
  return combined;
}

function runSentimentAnalysis(
  posts: RedditPost[],
  comments: RedditComment[],
  tweets: Tweet[],
  history: DailyHistoryPoint[] = [],
  archiveEntries: DailyArchiveEntry[] = [],
): SentimentAnalysisResult {
  const allItems: Array<{ text: string; created_utc: number }> = [
    ...posts.map(p => ({ text: `${p.title} ${p.selftext}`, created_utc: p.created_utc })),
    ...comments.map(c => ({ text: c.body, created_utc: c.created_utc })),
    ...tweets.map(t => ({ text: t.text, created_utc: t.created_utc })),
  ];

  let chowPos = 0, chowNeg = 0, chowNeutral = 0;
  let bradPos = 0, bradNeg = 0, bradNeutral = 0;
  const issueCounts: Record<string, { count: number; sentiment: number }> = {};
  const geoCounts: Record<string, { count: number; sentiment: number }> = {};

  const dayBuckets: Record<string, {
    chowPos: number; chowNeg: number; chowNeutral: number;
    bradPos: number; bradNeg: number; bradNeutral: number; total: number;
  }> = {};
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const day = format(subDays(new Date(), i), 'yyyy-MM-dd');
    dayBuckets[day] = { chowPos: 0, chowNeg: 0, chowNeutral: 0, bradPos: 0, bradNeg: 0, bradNeutral: 0, total: 0 };
  }

  for (const item of allItems) {
    const { text, created_utc } = item;
    let day: string;
    try {
      day = format(new Date(created_utc * 1000), 'yyyy-MM-dd');
    } catch {
      day = format(new Date(), 'yyyy-MM-dd');
    }

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

    const overallS = scoreOverallText(text, hasChow, hasBrad);

    for (const issue of detectIssues(text)) {
      if (!issueCounts[issue]) issueCounts[issue] = { count: 0, sentiment: 0 };
      issueCounts[issue].count++;
      issueCounts[issue].sentiment += overallS;
    }

    for (const geo of detectGeo(text)) {
      if (!geoCounts[geo]) geoCounts[geo] = { count: 0, sentiment: 0 };
      geoCounts[geo].count++;
      geoCounts[geo].sentiment += overallS;
    }
  }

  const liveVolumeByDay = Object.entries(dayBuckets).map(([date, data]) => ({ date, ...data }));
  const historyMap = new Map<string, DailyHistoryPoint>();
  for (const item of history) historyMap.set(item.date, item);
  for (const item of liveVolumeByDay) historyMap.set(item.date, item);
  const volumeByDay = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-HISTORY_DAYS);
  const recentDays = volumeByDay.slice(-7);
  const prevDays = volumeByDay.slice(-14, -7);
  const recentChowScore = recentDays.reduce((a, d) => a + d.chowPos - d.chowNeg, 0);
  const prevChowScore = prevDays.reduce((a, d) => a + d.chowPos - d.chowNeg, 0);
  const recentBradScore = recentDays.reduce((a, d) => a + d.bradPos - d.bradNeg, 0);
  const prevBradScore = prevDays.reduce((a, d) => a + d.bradPos - d.bradNeg, 0);

  const chowTotal = chowPos + chowNeg + chowNeutral;
  const bradTotal = bradPos + bradNeg + bradNeutral;
  const topIssues = Object.entries(issueCounts)
    .map(([name, { count, sentiment }]) => ({
      name, count,
      sentiment: count > 0 ? Math.max(-1, Math.min(1, sentiment / count)) : 0,
    }))
    .sort((a, b) => b.count - a.count);
  const geoData = Object.entries(geoCounts)
    .map(([area, { count, sentiment }]) => ({
      area, count,
      sentiment: count > 0 ? Math.max(-1, Math.min(1, sentiment / count)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const archiveForTrends: TrendArchiveEntry[] = [...archiveEntries.filter(item => item.date !== format(new Date(), 'yyyy-MM-dd')), {
    date: format(new Date(), 'yyyy-MM-dd'),
    sentiment: {
      topIssues,
      geoData,
    },
  }];

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
    topIssues,
    volumeByDay,
    issueHistory: buildTopicHistoryFromArchive(
      archiveForTrends,
      (entry) => (entry.sentiment.topIssues || []).map((issue) => ({
        name: issue.name,
        count: issue.count,
        sentiment: issue.sentiment,
      })),
    ),
    geoData,
    geoHistory: buildTopicHistoryFromArchive(
      archiveForTrends,
      (entry) => (entry.sentiment.geoData || []).map((geo) => ({
        name: geo.area,
        count: geo.count,
        sentiment: geo.sentiment,
      })),
    ),
    postsAnalyzed: allItems.length,
    lastUpdated: Date.now(),
  };
}

export async function generatePulseData(): Promise<PulseData> {
  console.log('[Toronto Pulse Scraper] Starting...');

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

  const seen = new Set<string>();
  const uniquePosts = allPosts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).sort((a, b) => b.created_utc - a.created_utc);

  console.log(`  Total unique posts: ${uniquePosts.length}`);

  console.log('\n[Reddit] Fetching comments for top 5 posts...');
  const topPosts = uniquePosts.slice(0, 5);
  const allComments: RedditComment[] = [];

  for (const post of topPosts) {
    try {
      const comments = await fetchPostComments(post);
      console.log(`  ${post.id} (${post.subreddit}): ${comments.length} comments`);
      allComments.push(...comments);
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.warn(`  Failed to fetch comments for ${post.id}: ${(err as Error).message}`);
    }
  }

  const tweets = await fetchAllSocial();

  console.log('\n[Sentiment] Analyzing...');
  const historyPath = getPulseHistoryOutputPath();
  const history = readPulseHistoryFile(historyPath);
  const archive = readPulseArchiveFile(getPulseArchiveOutputPath());
  const sentiment = runSentimentAnalysis(uniquePosts, allComments, tweets, history, archive);
  console.log(`  Posts analyzed: ${sentiment.postsAnalyzed}`);
  console.log(`  Chow mentions: ${sentiment.chowSentiment.total}, Bradford mentions: ${sentiment.bradfordSentiment.total}`);

  try {
    writePulseHistoryFile(historyPath, sentiment.volumeByDay);
    writePulseArchiveFile(getPulseArchiveOutputPath(), {
      date: format(new Date(), 'yyyy-MM-dd'),
      capturedAt: Date.now(),
      posts: uniquePosts,
      comments: allComments,
      tweets,
      sentiment,
    });
  } catch (error) {
    console.warn('[Toronto Pulse Scraper] History/archive file write skipped:', error);
  }

  return {
    lastScraped: Date.now(),
    posts: uniquePosts,
    comments: allComments,
    tweets,
    sentiment,
  };
}

export function getPulseDataOutputPath(): string {
  const fileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(fileDir, '..', '..', 'public', 'data', 'pulse-data.json');
}

export function getPulseHistoryOutputPath(): string {
  const fileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(fileDir, '..', '..', 'public', 'data', 'pulse-history.json');
}

export function getPulseArchiveOutputPath(): string {
  const fileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(fileDir, '..', '..', 'public', 'data', 'pulse-archive.json');
}

function readPulseHistoryFile(historyPath = getPulseHistoryOutputPath()): DailyHistoryPoint[] {
  try {
    if (!fs.existsSync(historyPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePulseHistoryFile(historyPath: string, data: DailyHistoryPoint[]): void {
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(data.slice(-90), null, 2));
}

function readPulseArchiveFile(archivePath = getPulseArchiveOutputPath()): DailyArchiveEntry[] {
  try {
    if (!fs.existsSync(archivePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePulseArchiveFile(archivePath: string, entry: DailyArchiveEntry): void {
  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  const existing = readPulseArchiveFile(archivePath);
  const filtered = existing.filter(item => item.date !== entry.date);
  const next = [...filtered, entry]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90);
  fs.writeFileSync(archivePath, JSON.stringify(next, null, 2));
}

export function writePulseDataFile(output: PulseData, outputPath = getPulseDataOutputPath()): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
}
