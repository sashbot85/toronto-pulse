'use client';

import { SentimentData } from '@/lib/types';

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
  const maxCount = Math.max(...issues.map(i => i.count), 1);

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(25,29,36,0.98), rgba(18,22,28,0.98))',
      border: '1px solid #262c36',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f5f7fb', letterSpacing: '-0.02em' }}>
            Top Issue Clusters
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7b8494' }}>
            Tap a cluster to focus the signal feed
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

            return (
              <button
                key={issue.name}
                onClick={() => onSelectIssue(isSelected ? null : issue.name)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 14px',
                  background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? '#3a4352' : '#232933'}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f5f7fb', marginBottom: '8px' }}>
                    {issue.name}
                  </div>
                  <div style={{ height: '8px', background: '#252b33', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
                <div style={{ display: 'grid', justifyItems: 'end', gap: '8px' }}>
                  <div className="font-mono-num" style={{ fontSize: '15px', fontWeight: 800, color: '#f5f7fb' }}>
                    {issue.count.toLocaleString()}
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                    fontSize: '10px',
                    fontWeight: 700,
                    color,
                  }}>
                    {getSentimentLabel(issue.sentiment)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
