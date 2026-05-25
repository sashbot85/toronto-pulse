'use client';

import { SentimentData } from '@/lib/types';

interface KPIStripProps {
  sentiment: SentimentData | null;
  loading: boolean;
}

function KPICard({ title, value, subtitle, trend, color, loading }: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | null;
  color?: string;
  loading: boolean;
}) {
  return (
    <div
      className="card-hover"
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '16px',
        padding: '20px 24px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>
        {title}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: '36px', width: '80%', marginBottom: '8px' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="font-mono-num" style={{
            fontSize: '32px',
            fontWeight: 700,
            color: color || '#f9fafb',
            lineHeight: 1,
          }}>
            {value}
          </div>
          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: trend === 'up' ? '#10b981' : '#ef4444',
              fontSize: '20px',
            }}>
              {trend === 'up' ? '↑' : '↓'}
            </div>
          )}
        </div>
      )}
      {subtitle && !loading && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function DominantSentimentCard({ sentiment, loading }: { sentiment: SentimentData | null; loading: boolean }) {
  let label = 'Mixed';
  let color = '#6b7280';
  let bg = 'rgba(107, 114, 128, 0.1)';
  let subtitle = 'Overall tone across both candidates';

  if (sentiment) {
    const chowScore = sentiment.chowSentiment.score;
    const bradScore = sentiment.bradfordSentiment.score;
    const avgScore = (chowScore + bradScore) / 2;
    
    if (avgScore >= 50) {
      label = 'Positive';
      color = '#10b981';
      bg = 'rgba(16, 185, 129, 0.1)';
    } else if (avgScore <= 30) {
      label = 'Negative';
      color = '#ef4444';
      bg = 'rgba(239, 68, 68, 0.1)';
    }

    subtitle = `Average positive-share across Chow and Bradford mentions: ${Math.round(avgScore)}%`;
  }

  return (
    <div
      className="card-hover"
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '16px',
        padding: '20px 24px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>
        Overall Tone
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: '36px', width: '70%' }} />
      ) : (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: bg,
          border: `1px solid ${color}40`,
          marginTop: '4px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: color,
          }} />
          <span style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
            {label}
          </span>
        </div>
      )}
      {!loading && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default function KPIStrip({ sentiment, loading }: KPIStripProps) {
  const chowScore = sentiment?.chowSentiment.score;
  const bradScore = sentiment?.bradfordSentiment.score;
  const postsAnalyzed = sentiment?.postsAnalyzed;

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    }}>
      <KPICard
        title="Chow Approval"
        value={chowScore !== undefined ? `${chowScore}%` : '—'}
        subtitle={sentiment ? `${sentiment.chowSentiment.total} mentions • ${sentiment.chowSentiment.positive}↑ / ${sentiment.chowSentiment.negative}↓` : undefined}
        trend={sentiment?.chowSentiment.trend}
        color="#f59e0b"
        loading={loading}
      />
      <KPICard
        title="Bradford Approval"
        value={bradScore !== undefined ? `${bradScore}%` : '—'}
        subtitle={sentiment ? `${sentiment.bradfordSentiment.total} mentions • ${sentiment.bradfordSentiment.positive}↑ / ${sentiment.bradfordSentiment.negative}↓` : undefined}
        trend={sentiment?.bradfordSentiment.trend}
        color="#3b82f6"
        loading={loading}
      />
      <KPICard
        title="Items Analyzed"
        value={postsAnalyzed !== undefined ? postsAnalyzed.toLocaleString() : '—'}
        subtitle="Posts + comments + social"
        color="#f9fafb"
        loading={loading}
      />
      <DominantSentimentCard sentiment={sentiment} loading={loading} />
    </div>
  );
}
