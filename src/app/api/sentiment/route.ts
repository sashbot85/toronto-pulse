import { NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';

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
  'Housing': ['housing', 'rent', 'affordable housing', 'condo', 'landlord', 'tenant', 'eviction', 'homeless shelter', 'zoning'],
  'Transit/TTC': ['transit', 'ttc', 'subway', 'bus', 'traffic', 'congestion', 'bike lane', 'eglinton', 'crosstown', 'streetcar'],
  'Safety': ['safety', 'crime', 'police', 'shooting', 'violence', 'gang', 'theft', 'assault', 'tps', 'defund'],
  'Affordability': ['affordability', 'cost of living', 'taxes', 'property tax', 'inflation', 'expensive', 'budget cuts'],
  'Homelessness': ['homelessness', 'homeless', 'encampment', 'shelter', 'mental health', 'addiction', 'overdose'],
  'Development': ['development', 'construction', 'condo tower', 'heritage', 'neighbourhood', 'community', 'intensification'],
};

const GEO_KEYWORDS: Record<string, string[]> = {
  'Downtown': ['downtown', 'dt toronto', 'queen west', 'king st', 'financial district', 'yonge', 'bloor', 'spadina', 'kensington'],
  'North York': ['north york', 'thornhill', 'sheppard', 'willowdale', 'don mills', 'york mills'],
  'Scarborough': ['scarborough', 'malvern', 'agincourt', 'markham rd', 'warden'],
  'Etobicoke': ['etobicoke', 'mississauga rd', 'bloor west', 'humber', 'long branch'],
  'East York': ['east york', 'danforth', 'greektown', 'pape', 'broadview'],
};

interface TextItem {
  body?: string;
  title?: string;
  selftext?: string;
  created_utc: number;
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

function mentionsCandidate(text: string, candidate: 'chow' | 'bradford'): boolean {
  const lower = text.toLowerCase();
  if (candidate === 'chow') return lower.includes('chow') || lower.includes('olivia');
  if (candidate === 'bradford') return lower.includes('bradford') || lower.includes('brad ');
  return false;
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

export async function GET() {
  try {
    // Fetch posts and comments
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    let posts: TextItem[] = [];
    let comments: TextItem[] = [];
    
    try {
      const [postsResp, commentsResp] = await Promise.allSettled([
        fetch(`${baseUrl}/api/reddit/posts`),
        fetch(`${baseUrl}/api/reddit/comments`),
      ]);
      
      if (postsResp.status === 'fulfilled' && postsResp.value.ok) {
        const d = await postsResp.value.json();
        posts = d.posts || [];
      }
      if (commentsResp.status === 'fulfilled' && commentsResp.value.ok) {
        const d = await commentsResp.value.json();
        comments = d.comments || [];
      }
    } catch {
      // Will use empty arrays
    }

    const allItems = [
      ...posts.map(p => ({ text: `${p.title} ${p.selftext || ''}`, created_utc: p.created_utc })),
      ...comments.map(c => ({ text: c.body || '', created_utc: c.created_utc })),
    ];

    // Sentiment aggregation
    let chowPos = 0, chowNeg = 0, chowNeutral = 0;
    let bradPos = 0, bradNeg = 0, bradNeutral = 0;
    const issueCounts: Record<string, { count: number; sentiment: number }> = {};
    const geoCounts: Record<string, { count: number; sentiment: number }> = {};

    // Daily volume buckets (last 14 days)
    const dayBuckets: Record<string, { chowPos: number; chowNeg: number; chowNeutral: number; bradPos: number; bradNeg: number; bradNeutral: number; total: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const day = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dayBuckets[day] = { chowPos: 0, chowNeg: 0, chowNeutral: 0, bradPos: 0, bradNeg: 0, bradNeutral: 0, total: 0 };
    }

    for (const item of allItems) {
      const { text, created_utc } = item;
      const day = format(new Date(created_utc * 1000), 'yyyy-MM-dd');
      
      const mentionsChow = mentionsCandidate(text, 'chow');
      const mentionsBrad = mentionsCandidate(text, 'bradford');

      if (mentionsChow) {
        const s = scoreText(text, CHOW_POSITIVE, CHOW_NEGATIVE);
        if (s > 0) chowPos++;
        else if (s < 0) chowNeg++;
        else chowNeutral++;
        
        if (dayBuckets[day]) {
          if (s > 0) dayBuckets[day].chowPos++;
          else if (s < 0) dayBuckets[day].chowNeg++;
          else dayBuckets[day].chowNeutral++;
          dayBuckets[day].total++;
        }
      }

      if (mentionsBrad) {
        const s = scoreText(text, BRADFORD_POSITIVE, BRADFORD_NEGATIVE);
        if (s > 0) bradPos++;
        else if (s < 0) bradNeg++;
        else bradNeutral++;

        if (dayBuckets[day]) {
          if (s > 0) dayBuckets[day].bradPos++;
          else if (s < 0) dayBuckets[day].bradNeg++;
          else dayBuckets[day].bradNeutral++;
          dayBuckets[day].total++;
        }
      }

      // Issues
      const issues = detectIssues(text);
      for (const issue of issues) {
        if (!issueCounts[issue]) issueCounts[issue] = { count: 0, sentiment: 0 };
        issueCounts[issue].count++;
        const overallSentiment = mentionsChow 
          ? scoreText(text, CHOW_POSITIVE, CHOW_NEGATIVE)
          : mentionsBrad
            ? scoreText(text, BRADFORD_POSITIVE, BRADFORD_NEGATIVE)
            : 0;
        issueCounts[issue].sentiment += overallSentiment;
      }

      // Geo
      const geos = detectGeo(text);
      for (const geo of geos) {
        if (!geoCounts[geo]) geoCounts[geo] = { count: 0, sentiment: 0 };
        geoCounts[geo].count++;
      }
    }

    const topIssues = Object.entries(issueCounts)
      .map(([name, { count, sentiment }]) => ({
        name,
        count,
        sentiment: count > 0 ? Math.max(-1, Math.min(1, sentiment / count)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const geoData = Object.entries(geoCounts)
      .map(([area, { count, sentiment }]) => ({
        area,
        count,
        sentiment: count > 0 ? Math.max(-1, Math.min(1, sentiment / count)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const volumeByDay = Object.entries(dayBuckets).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Chow trend (last 7 days vs prev 7 days)
    const recentDays = volumeByDay.slice(-7);
    const prevDays = volumeByDay.slice(-14, -7);
    const recentChowScore = recentDays.reduce((a, d) => a + d.chowPos - d.chowNeg, 0);
    const prevChowScore = prevDays.reduce((a, d) => a + d.chowPos - d.chowNeg, 0);
    const recentBradScore = recentDays.reduce((a, d) => a + d.bradPos - d.bradNeg, 0);
    const prevBradScore = prevDays.reduce((a, d) => a + d.bradPos - d.bradNeg, 0);

    const chowTotalItems = chowPos + chowNeg + chowNeutral;
    const bradTotalItems = bradPos + bradNeg + bradNeutral;

    return NextResponse.json({
      chowSentiment: {
        positive: chowPos,
        negative: chowNeg,
        neutral: chowNeutral,
        total: chowTotalItems,
        score: chowTotalItems > 0 ? Math.round((chowPos / chowTotalItems) * 100) : 0,
        trend: recentChowScore >= prevChowScore ? 'up' : 'down',
      },
      bradfordSentiment: {
        positive: bradPos,
        negative: bradNeg,
        neutral: bradNeutral,
        total: bradTotalItems,
        score: bradTotalItems > 0 ? Math.round((bradPos / bradTotalItems) * 100) : 0,
        trend: recentBradScore >= prevBradScore ? 'up' : 'down',
      },
      topIssues,
      volumeByDay,
      geoData,
      postsAnalyzed: allItems.length,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
