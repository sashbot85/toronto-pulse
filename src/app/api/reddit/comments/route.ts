import { NextResponse } from 'next/server';

interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  post_title: string;
  permalink: string;
}

interface CacheEntry {
  data: RedditComment[];
  timestamp: number;
}

const cache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 5 * 60 * 1000;

function extractComments(data: unknown, postTitle: string): RedditComment[] {
  const comments: RedditComment[] = [];
  
  if (!Array.isArray(data)) return comments;
  
  // Reddit comment JSON has [post_data, comments_data]
  if (data.length < 2) return comments;
  
  const commentListing = (data[1] as { data?: { children?: unknown[] } })?.data?.children || [];
  
  function processComment(comment: unknown): void {
    if (!comment || typeof comment !== 'object') return;
    const c = comment as { kind?: string; data?: { body?: string; author?: string; score?: number; created_utc?: number; permalink?: string; id?: string; replies?: unknown } };
    if (c.kind !== 't1' || !c.data) return;
    
    if (c.data.body && c.data.body !== '[deleted]') {
      comments.push({
        id: c.data.id || '',
        body: c.data.body.slice(0, 500),
        author: c.data.author || '[deleted]',
        score: c.data.score || 0,
        created_utc: c.data.created_utc || 0,
        post_title: postTitle,
        permalink: c.data.permalink || '',
      });
    }
    
    // Process replies
    const replies = (c.data.replies as { data?: { children?: unknown[] } })?.data?.children || [];
    if (Array.isArray(replies)) {
      replies.slice(0, 5).forEach(processComment);
    }
  }
  
  commentListing.slice(0, 30).forEach(processComment);
  return comments;
}

async function fetchPostComments(postId: string, subreddit: string, postTitle: string): Promise<RedditComment[]> {
  const url = `https://old.reddit.com/r/${subreddit}/comments/${postId}.json?limit=30&depth=2`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TorontoPulseBot/1.0' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`Reddit API error: ${response.status}`);
  
  const data = await response.json();
  return extractComments(data, postTitle);
}

export async function GET() {
  const cacheKey = 'reddit_comments';
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json({ 
      comments: cache[cacheKey].data, 
      cached: true,
      lastFetched: cache[cacheKey].timestamp
    });
  }

  try {
    // Fetch top posts first
    const postsResp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reddit/posts`);
    const postsData = await postsResp.json();
    const posts = postsData.posts?.slice(0, 5) || [];

    const allComments: RedditComment[] = [];
    for (const post of posts) {
      try {
        const comments = await fetchPostComments(post.id, post.subreddit, post.title);
        allComments.push(...comments);
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch {
        // Skip failed posts
      }
    }

    const sorted = allComments.sort((a, b) => b.created_utc - a.created_utc);
    cache[cacheKey] = { data: sorted, timestamp: now };

    return NextResponse.json({ 
      comments: sorted, 
      cached: false,
      lastFetched: now
    });
  } catch (error) {
    if (cache[cacheKey]) {
      return NextResponse.json({ 
        comments: cache[cacheKey].data, 
        cached: true, 
        stale: true,
        lastFetched: cache[cacheKey].timestamp
      });
    }
    return NextResponse.json({ comments: [], error: String(error), lastFetched: null });
  }
}
