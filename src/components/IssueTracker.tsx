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
            Click to filter feed by issue
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
                {/* Issue name */}
                <div style={{ width: '110px', fontSize: '13px', fontWeight: 600, color: '#d1d5db', flexShrink: 0 }}>
                  {issue.name}
                </div>

                {/* Bar */}
                <div style={{ flex: 1, height: '6px', background: '#1f2937', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: color,
                    borderRadius: '3px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>

                {/* Count */}
                <div className="font-mono-num" style={{ width: '32px', fontSize: '13px', fontWeight: 700, color: '#f9fafb', textAlign: 'right', flexShrink: 0 }}>
                  {issue.count}
                </div>

                {/* Sentiment pill */}
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
