'use client';

import { SentimentData } from '@/lib/types';

function getTrendDirection(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 2) return 'flat';
  const midpoint = Math.ceil(values.length / 2);
  const first = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const second = values.slice(midpoint).reduce((sum, value) => sum + value, 0);
  if (second > first) return 'up';
  if (second < first) return 'down';
  return 'flat';
}

function TrendSparkline({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const width = 70;
  const height = 24;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

interface IssueTrackerProps {
  sentiment: SentimentData | null;
  loading: boolean;
  onSelectIssue: (issue: string | null) => void;
  selectedIssue: string | null;
}

function getSentimentColor(s: number): string {
  if (s > 0.2) return '#10b981';
  if (s < -0.2) return '#ef4444';
  return '#f59e0b';
}

function getSentimentLabel(s: number): string {
  if (s > 0.2) return 'Positive';
  if (s < -0.2) return 'Negative';
  return 'Mixed';
}

export default function IssueTracker({ sentiment, loading, onSelectIssue, selectedIssue }: IssueTrackerProps) {
  const issues = sentiment?.topIssues || [];
  const issueHistory = sentiment?.issueHistory || [];
  const maxCount = Math.max(...issues.map(i => i.count), 1);

  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '16px',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f9fafb' }}>
            Issue Tracker
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
            Click to filter feed by issue • trend shows recent daily momentum
          </p>
        </div>
        {selectedIssue && (
          <button
            onClick={() => onSelectIssue(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: 'transparent',
              color: '#9ca3af',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Clear filter
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
          No issue data yet. Waiting for Reddit posts...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {issues.map((issue) => {
            const color = getSentimentColor(issue.sentiment);
            const pct = Math.round((issue.count / maxCount) * 100);
            const isSelected = selectedIssue === issue.name;
            const history = issueHistory.find((entry) => entry.name === issue.name);
            const trendValues = history?.days.slice(-14).map((day) => day.count) || [];
            const trendDirection = getTrendDirection(trendValues);
            const trendLabel = trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→';

            return (
              <button
                key={issue.name}
                onClick={() => onSelectIssue(isSelected ? null : issue.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: isSelected ? '#1f2937' : 'transparent',
                  border: `1px solid ${isSelected ? '#374151' : 'transparent'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                >
                <div style={{ width: '130px', flexShrink: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#d1d5db' }}>
                    {issue.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
                    {history?.totalCount || issue.count} mentions • 90d
                  </div>
                </div>

                <div style={{ flex: 1, height: '6px', background: '#1f2937', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: color,
                    borderRadius: '3px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>

                <div style={{ width: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: trendDirection === 'up' ? '#10b981' : trendDirection === 'down' ? '#ef4444' : '#9ca3af', fontWeight: 700 }}>
                    {trendLabel}
                  </span>
                  <TrendSparkline values={trendValues.length ? trendValues : [issue.count]} color={color} />
                </div>

                <div className="font-mono-num" style={{ width: '32px', fontSize: '13px', fontWeight: 700, color: '#f9fafb', textAlign: 'right', flexShrink: 0 }}>
                  {issue.count}
                </div>

                <div style={{
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: `${color}20`,
                  border: `1px solid ${color}40`,
                  fontSize: '10px',
                  fontWeight: 600,
                  color,
                  width: '60px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  {getSentimentLabel(issue.sentiment)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
