'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FeedItem } from '@/lib/types';

interface LiveFeedProps {
  items: FeedItem[];
  loading: boolean;
  issueFilter: string | null;
}

const SUBREDDIT_COLORS: Record<string, string> = {
  toronto: '#f59e0b',
  CanadaPolitics: '#3b82f6',
  TorontoPolitics: '#10b981',
};

const SENTIMENT_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
};

function timeAgo(utc: number): string {
  try {
    return formatDistanceToNow(new Date(utc * 1000), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export default function LiveFeed({ items, loading, issueFilter }: LiveFeedProps) {
  const [tab, setTab] = useState<'all' | 'posts' | 'comments'>('all');

  const filtered = items.filter(item => {
    if (tab === 'posts' && item.type !== 'post') return false;
    if (tab === 'comments' && item.type !== 'comment') return false;
    return true;
  }).slice(0, 50);

  const ISSUE_KEYWORDS: Record<string, string[]> = {
    'Housing': ['housing', 'rent', 'affordable', 'condo', 'landlord', 'tenant', 'eviction', 'zoning'],
    'Transit/TTC': ['transit', 'ttc', 'subway', 'bus', 'traffic', 'bike lane', 'eglinton', 'streetcar'],
    'Safety': ['safety', 'crime', 'police', 'shooting', 'violence', 'theft', 'assault'],
    'Affordability': ['affordability', 'cost of living', 'taxes', 'property tax', 'inflation', 'expensive'],
    'Homelessness': ['homeless', 'encampment', 'shelter', 'mental health', 'addiction'],
    'Development': ['development', 'construction', 'condo tower', 'heritage', 'neighbourhood'],
  };

  const issueFiltered = issueFilter
    ? filtered.filter(item => {
        const lower = item.text.toLowerCase();
        const keywords = ISSUE_KEYWORDS[issueFilter] || [];
        return keywords.some(kw => lower.includes(kw));
      })
    : filtered;

  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f9fafb' }}>
            Live Feed
            {issueFilter && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                · {issueFilter}
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
            {issueFiltered.length} items • Reddit r/toronto + r/CanadaPolitics + r/TorontoPolitics
          </p>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1f2937' }}>
          {(['all', 'posts', 'comments'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: tab === t ? '#1f2937' : 'transparent',
                color: tab === t ? '#f9fafb' : '#6b7280',
                border: 'none',
                borderRight: t !== 'comments' ? '1px solid #1f2937' : 'none',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div
        className="feed-scroll"
        style={{
          overflowY: 'auto',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '10px' }} />
          ))
        ) : issueFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>
              No posts yet
            </div>
            <div style={{ fontSize: '12px' }}>
              Reddit data will appear here once fetched
            </div>
          </div>
        ) : (
          issueFiltered.map((item) => {
            const subredditColor = item.subreddit ? (SUBREDDIT_COLORS[item.subreddit] || '#6b7280') : '#6b7280';
            const sentimentColor = SENTIMENT_COLORS[item.sentiment];

            return (
              <a
                key={item.id}
                href={`https://reddit.com${item.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 14px',
                  background: '#0d1424',
                  borderRadius: '10px',
                  border: '1px solid #1f2937',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#374151';
                  (e.currentTarget as HTMLElement).style.background = '#111827';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#1f2937';
                  (e.currentTarget as HTMLElement).style.background = '#0d1424';
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {/* Subreddit badge */}
                  {item.subreddit && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: `${subredditColor}20`,
                      border: `1px solid ${subredditColor}40`,
                      fontSize: '10px',
                      fontWeight: 600,
                      color: subredditColor,
                    }}>
                      r/{item.subreddit}
                    </span>
                  )}

                  {/* Type badge */}
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#1f2937',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {item.type}
                  </span>

                  {/* Candidate tags */}
                  {item.mentionsChow && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#f59e0b',
                    }}>
                      Chow
                    </span>
                  )}
                  {item.mentionsBradford && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#3b82f6',
                    }}>
                      Bradford
                    </span>
                  )}

                  {/* Sentiment dot */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: sentimentColor,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '10px', color: sentimentColor, fontWeight: 600 }}>
                      {item.sentiment}
                    </span>
                  </div>
                </div>

                {/* Text */}
                <div style={{
                  fontSize: '13px',
                  color: '#d1d5db',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '6px',
                }}>
                  {item.text}
                </div>

                {/* Meta */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '11px',
                  color: '#6b7280',
                }}>
                  <span>u/{item.author}</span>
                  <span>·</span>
                  <span>{timeAgo(item.created_utc)}</span>
                  <span>·</span>
                  <span>
                    {/* Arrow up SVG */}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }}>
                      <path d="M12 4l8 8H4z"/>
                    </svg>
                    {item.score}
                  </span>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
