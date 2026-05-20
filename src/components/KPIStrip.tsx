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
        background: 'linear-gradient(180deg, rgba(26,31,38,0.98), rgba(18,22,28,0.98))',
        border: '1px solid #262c36',
        borderRadius: '20px',
        padding: '18px 20px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: '#7b8494', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          {title}
        </div>
        {trend && !loading && (
          <div style={{ color: trend === 'up' ? '#31d0aa' : '#fb7185', fontSize: '12px', fontWeight: 700 }}>
            {trend === 'up' ? 'trending_up' : 'trending_down'}
          </div>
        )}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: '36px', width: '80%', marginBottom: '8px' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <div className="font-mono-num" style={{ fontSize: '34px', fontWeight: 800, color: color || '#f9fafb', lineHeight: 0.95, letterSpacing: '-0.04em' }}>{value}</div>
          {(title.includes('Sentiment') || title.includes('Chow') || title.includes('Bradford')) && (
            <div style={{ color: '#7b8494', fontSize: '14px', marginBottom: '4px' }}>/ 100</div>
          )}
        </div>
      )}
      {subtitle && !loading && (
        <div style={{ fontSize: '12px', color: '#7b8494', marginTop: '8px' }}>
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
  }

  return (
    <div
      className="card-hover"
      style={{
        background: 'linear-gradient(180deg, rgba(26,31,38,0.98), rgba(18,22,28,0.98))',
        border: '1px solid #262c36',
        borderRadius: '20px',
        padding: '18px 20px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: '11px', color: '#7b8494', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '14px' }}>
        Dominant Sentiment
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
          <span style={{ fontSize: '20px', fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
            {label}
          </span>
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
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    }} className="kpi-grid">
      <KPICard
        title="Chow Approval"
        value={chowScore !== undefined ? `${chowScore}%` : '—'}
        subtitle={sentiment ? `${sentiment.chowSentiment.positive}↑ / ${sentiment.chowSentiment.negative}↓ mentions` : undefined}
        trend={sentiment?.chowSentiment.trend}
        color="#f59e0b"
        loading={loading}
      />
      <KPICard
        title="Bradford Approval"
        value={bradScore !== undefined ? `${bradScore}%` : '—'}
        subtitle={sentiment ? `${sentiment.bradfordSentiment.positive}↑ / ${sentiment.bradfordSentiment.negative}↓ mentions` : undefined}
        trend={sentiment?.bradfordSentiment.trend}
        color="#3b82f6"
        loading={loading}
      />
      <KPICard
        title="Total Signals (24h)"
        value={postsAnalyzed !== undefined ? postsAnalyzed.toLocaleString() : '—'}
        subtitle="Volume across Reddit, X, and Bluesky"
        color="#f9fafb"
        loading={loading}
      />
      <DominantSentimentCard sentiment={sentiment} loading={loading} />
      <style>{`
        @media (max-width: 1180px) {
          .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
