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

// Twitter/X bird icon (inline SVG path)
function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  );
}

const ISSUE_KEYWORDS: Record<string, string[]> = {
  'Housing': ['housing', 'rent', 'affordable', 'condo', 'landlord', 'tenant', 'eviction', 'zoning'],
  'Transit/TTC': ['transit', 'ttc', 'subway', 'bus', 'traffic', 'bike lane', 'eglinton', 'streetcar'],
  'Safety': ['safety', 'crime', 'police', 'shooting', 'violence', 'theft', 'assault'],
  'Affordability': ['affordability', 'cost of living', 'taxes', 'property tax', 'inflation', 'expensive'],
  'Homelessness': ['homeless', 'encampment', 'shelter', 'mental health', 'addiction'],
  'Development': ['development', 'construction', 'condo tower', 'heritage', 'neighbourhood'],
};

export default function LiveFeed({ items, loading, issueFilter }: LiveFeedProps) {
  const [tab, setTab] = useState<'all' | 'posts' | 'comments' | 'x'>('all');

  const filtered = items.filter(item => {
    if (tab === 'posts' && item.type !== 'post') return false;
    if (tab === 'comments' && item.type !== 'comment') return false;
    if (tab === 'x' && item.source !== 'twitter') return false;
    return true;
  }).slice(0, 50);

  const issueFiltered = issueFilter
    ? filtered.filter(item => {
        const lower = item.text.toLowerCase();
        const keywords = ISSUE_KEYWORDS[issueFilter] || [];
        return keywords.some(kw => lower.includes(kw));
      })
    : filtered;

  const tweetCount = items.filter(i => i.source === 'twitter').length;

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
            {issueFiltered.length} items
            {tweetCount > 0 && ` • ${tweetCount} from X`}
          </p>
        </div>
        {/* Source filter tabs */}
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1f2937' }}>
          {(['all', 'posts', 'comments', 'x'] as const).map((t, i, arr) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: tab === t ? '#1f2937' : 'transparent',
                color: tab === t ? (t === 'x' ? '#1d9bf0' : '#f9fafb') : '#6b7280',
                border: 'none',
                borderRight: i < arr.length - 1 ? '1px solid #1f2937' : 'none',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {t === 'x' ? (
                <>
                  <XIcon />
                  X
                </>
              ) : t}
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
              No items yet
            </div>
            <div style={{ fontSize: '12px' }}>
              Run the scraper to populate data
            </div>
          </div>
        ) : (
          issueFiltered.map((item) => {
            const isTwitter = item.source === 'twitter';
            const subredditColor = item.subreddit ? (SUBREDDIT_COLORS[item.subreddit] || '#6b7280') : '#6b7280';
            const sentimentColor = SENTIMENT_COLORS[item.sentiment];
            const href = isTwitter
              ? item.permalink
              : `https://reddit.com${item.permalink}`;

            return (
              <a
                key={item.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 14px',
                  background: isTwitter ? '#060d1a' : '#0d1424',
                  borderRadius: '10px',
                  border: `1px solid ${isTwitter ? '#1a2a3a' : '#1f2937'}`,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = isTwitter ? '#1d9bf040' : '#374151';
                  (e.currentTarget as HTMLElement).style.background = isTwitter ? '#0a1628' : '#111827';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = isTwitter ? '#1a2a3a' : '#1f2937';
                  (e.currentTarget as HTMLElement).style.background = isTwitter ? '#060d1a' : '#0d1424';
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {/* Source badge */}
                  {isTwitter ? (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(29, 155, 240, 0.15)',
                      border: '1px solid rgba(29, 155, 240, 0.3)',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#1d9bf0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <XIcon />
                      Twitter/X
                    </span>
                  ) : item.subreddit ? (
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
                  ) : null}

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
                  <span>{isTwitter ? `@${item.author}` : `u/${item.author}`}</span>
                  <span>·</span>
                  <span>{timeAgo(item.created_utc)}</span>
                  <span>·</span>
                  <span>
                    {isTwitter ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }}>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {item.score}
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }}>
                          <path d="M12 4l8 8H4z"/>
                        </svg>
                        {item.score}
                      </>
                    )}
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
