'use client';

import { SentimentData } from '@/lib/types';

interface CandidateCardsProps {
  sentiment: SentimentData | null;
  loading: boolean;
}

function GaugeChart({ score, color }: { score: number; color: string }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const angle = (clampedScore / 100) * 180 - 90; // -90 to +90 degrees
  const cx = 80;
  const cy = 70;
  const r = 55;

  // Arc path
  const startAngle = -180;
  const endAngle = 0;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  // Needle
  const needleRad = (angle * Math.PI) / 180;
  const needleX = cx + (r - 10) * Math.cos(needleRad);
  const needleY = cy + (r - 10) * Math.sin(needleRad);

  return (
    <svg width="160" height="90" viewBox="0 0 160 90">
      {/* Background arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke="#1f2937"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Colored arc (filled portion) */}
      {clampedScore > 0 && (() => {
        const fillEnd = (((clampedScore / 100) * 180) - 180) * Math.PI / 180;
        const fX = cx + r * Math.cos(fillEnd);
        const fY = cy + r * Math.sin(fillEnd);
        const largeArc = clampedScore > 50 ? 1 : 0;
        return (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${fX} ${fY}`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        );
      })()}
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill={color} />
      {/* Score label */}
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fill={color}
        fontSize="18"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        {score}%
      </text>
    </svg>
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
        background: 'linear-gradient(180deg, rgba(25,29,36,0.98), rgba(18,22,28,0.98))',
        border: `1px solid ${color}22`,
        borderRadius: '24px',
        padding: '28px 24px',
        flex: 1,
        minWidth: 0,
        boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
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

      {/* Gauge */}
      {loading ? (
        <div className="skeleton" style={{ height: '90px', borderRadius: '12px', marginBottom: '16px' }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
          <GaugeChart score={sentiment?.score || 0} color={color} />
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
        Positive sentiment score
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
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f5f7fb', marginBottom: '16px', letterSpacing: '-0.03em' }}>
        Candidate Comparison Matrix
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
