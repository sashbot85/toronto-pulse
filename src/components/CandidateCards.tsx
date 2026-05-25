'use client';

import { SentimentData } from '@/lib/types';

interface CandidateCardsProps {
  sentiment: SentimentData | null;
  loading: boolean;
}

function SentimentMixBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative;
  const positivePct = total > 0 ? (positive / total) * 100 : 0;
  const neutralPct = total > 0 ? (neutral / total) * 100 : 0;
  const negativePct = total > 0 ? (negative / total) * 100 : 0;

  return (
    <div>
      <div style={{
        height: '12px',
        background: '#1f2937',
        borderRadius: '999px',
        overflow: 'hidden',
        display: 'flex',
        marginBottom: '10px',
      }}>
        <div style={{ width: `${positivePct}%`, background: '#10b981' }} />
        <div style={{ width: `${neutralPct}%`, background: '#6b7280' }} />
        <div style={{ width: `${negativePct}%`, background: '#ef4444' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px', color: '#9ca3af' }}>
        <span><span style={{ color: '#10b981', fontWeight: 700 }}>{Math.round(positivePct)}%</span> positive</span>
        <span><span style={{ color: '#6b7280', fontWeight: 700 }}>{Math.round(neutralPct)}%</span> neutral</span>
        <span><span style={{ color: '#ef4444', fontWeight: 700 }}>{Math.round(negativePct)}%</span> negative</span>
      </div>
    </div>
  );
}

interface CandidateCardProps {
  name: string;
  initials: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  sentiment: SentimentData['chowSentiment'] | null;
  topIssues: string[];
  buzzVolume: number;
  totalVolume: number;
  loading: boolean;
}

function CandidateCard({
  name, initials, color, gradientFrom, gradientTo,
  sentiment, topIssues, buzzVolume, totalVolume, loading
}: CandidateCardProps) {
  const buzzPct = totalVolume > 0 ? Math.round((buzzVolume / totalVolume) * 100) : 0;

  return (
    <div
      className="card-hover"
      style={{
        background: '#111827',
        border: `1px solid ${color}30`,
        borderRadius: '20px',
        padding: '28px 24px',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
          boxShadow: `0 0 20px ${color}30`,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f9fafb', lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            {name === 'Olivia Chow' ? 'Incumbent Mayor' : 'Challenger'}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '6px',
            padding: '2px 8px',
            borderRadius: '12px',
            background: `${color}20`,
            border: `1px solid ${color}40`,
            fontSize: '11px',
            fontWeight: 600,
            color,
          }}>
            {sentiment?.trend === 'up' ? '↑' : '↓'} Trend {sentiment?.trend === 'up' ? 'Rising' : 'Falling'}
          </div>
        </div>
      </div>

      {/* Sentiment share */}
      {loading ? (
        <div className="skeleton" style={{ height: '90px', borderRadius: '12px', marginBottom: '16px' }} />
      ) : (
        <div style={{ marginBottom: '8px' }}>
          <div className="font-mono-num" style={{ fontSize: '30px', fontWeight: 800, color, textAlign: 'center', marginBottom: '8px' }}>
            {sentiment?.score || 0}%
          </div>
          <SentimentMixBar
            positive={sentiment?.positive || 0}
            neutral={sentiment?.neutral || 0}
            negative={sentiment?.negative || 0}
          />
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
        Positive share of this candidate's mentions
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'Positive', value: sentiment?.positive || 0, color: '#10b981' },
          { label: 'Neutral', value: sentiment?.neutral || 0, color: '#6b7280' },
          { label: 'Negative', value: sentiment?.negative || 0, color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1,
            padding: '8px',
            background: '#0d1424',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <div className="font-mono-num" style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>
              {loading ? '—' : stat.value}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Top Issues */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>
          Associated Issues
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '24px', width: '70px', borderRadius: '12px' }} />
            ))
          ) : topIssues.length > 0 ? (
            topIssues.map(issue => (
              <span key={issue} style={{
                padding: '3px 10px',
                borderRadius: '12px',
                background: `${color}15`,
                border: `1px solid ${color}30`,
                fontSize: '11px',
                fontWeight: 600,
                color,
              }}>
                {issue}
              </span>
            ))
          ) : (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Awaiting data...</span>
          )}
        </div>
      </div>

      {/* Buzz volume */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Buzz Volume
          </div>
          <div className="font-mono-num" style={{ fontSize: '13px', fontWeight: 700, color }}>
            {loading ? '—' : `${buzzVolume} mentions`}
          </div>
        </div>
        <div style={{ height: '6px', background: '#1f2937', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${buzzPct}%`,
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
            borderRadius: '3px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>
          {loading ? '' : `${buzzPct}% of total election discussion`}
        </div>
      </div>
    </div>
  );
}

export default function CandidateCards({ sentiment, loading }: CandidateCardsProps) {
  const totalVolume = (sentiment?.chowSentiment.total || 0) + (sentiment?.bradfordSentiment.total || 0);

  // Derive top issues per candidate from global issues (simplified)
  const chowIssues = sentiment?.topIssues.slice(0, 3).map(i => i.name) || [];
  const bradIssues = sentiment?.topIssues.slice(0, 3).map(i => i.name).reverse() || [];

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f9fafb', marginBottom: '16px' }}>
        Candidate Comparison
      </h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <CandidateCard
          name="Olivia Chow"
          initials="OC"
          color="#f59e0b"
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          sentiment={sentiment?.chowSentiment || null}
          topIssues={chowIssues}
          buzzVolume={sentiment?.chowSentiment.total || 0}
          totalVolume={totalVolume}
          loading={loading}
        />
        <CandidateCard
          name="Brad Bradford"
          initials="BB"
          color="#3b82f6"
          gradientFrom="#3b82f6"
          gradientTo="#1d4ed8"
          sentiment={sentiment?.bradfordSentiment || null}
          topIssues={bradIssues}
          buzzVolume={sentiment?.bradfordSentiment.total || 0}
          totalVolume={totalVolume}
          loading={loading}
        />
      </div>
    </div>
  );
}
