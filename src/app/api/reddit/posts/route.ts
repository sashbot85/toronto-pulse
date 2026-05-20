import { NextResponse } from 'next/server';

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
}

interface CacheEntry {
  data: RedditPost[];
  timestamp: number;
}

const cache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  const query = 'election OR mayor OR chow OR bradford OR municipal';
  const url = `https://old.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&limit=50`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TorontoPulseBot/1.0',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();
  
  return data.data.children.map((child: { data: RedditPost }) => ({
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
  }));
}

export async function GET() {
  const cacheKey = 'reddit_posts';
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json({ 
      posts: cache[cacheKey].data, 
      cached: true,
      lastFetched: cache[cacheKey].timestamp
    });
  }

  try {
    const subreddits = ['toronto', 'CanadaPolitics', 'TorontoPolitics'];
    const results = await Promise.allSettled(subreddits.map(s => fetchSubredditPosts(s)));
    
    const allPosts: RedditPost[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allPosts.push(...result.value);
      }
    }

    // Deduplicate and sort by created_utc desc
    const seen = new Set<string>();
    const uniquePosts = allPosts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).sort((a, b) => b.created_utc - a.created_utc);

    cache[cacheKey] = { data: uniquePosts, timestamp: now };

    return NextResponse.json({ 
      posts: uniquePosts, 
      cached: false,
      lastFetched: now
    });
  } catch (error) {
    // Return stale cache if available
    if (cache[cacheKey]) {
      return NextResponse.json({ 
        posts: cache[cacheKey].data, 
        cached: true, 
        stale: true,
        lastFetched: cache[cacheKey].timestamp,
        error: 'Using stale data due to fetch error'
      });
    }
    return NextResponse.json({ posts: [], error: String(error), lastFetched: null }, { status: 500 });
  }
}
