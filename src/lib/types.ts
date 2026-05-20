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
  source?: 'reddit';
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  post_title: string;
  permalink: string;
  source?: 'reddit';
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
  source: 'twitter';
}

export interface Poll {
  date: string;
  source: string;
  chow: number;
  bradford: number;
  other: number;
  type: string;
}

export interface SentimentData {
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
  volumeByDay: Array<{
    date: string;
    chowPos: number;
    chowNeg: number;
    chowNeutral: number;
    bradPos: number;
    bradNeg: number;
    bradNeutral: number;
    total: number;
  }>;
  geoData: Array<{
    area: string;
    count: number;
    sentiment: number;
  }>;
  postsAnalyzed: number;
  lastUpdated: number;
}

export type FeedItem = {
  type: 'post' | 'comment' | 'tweet';
  id: string;
  text: string;
  author: string;
  score: number;
  created_utc: number;
  subreddit?: string;
  permalink: string;
  mentionsChow: boolean;
  mentionsBradford: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: 'reddit' | 'twitter';
};
