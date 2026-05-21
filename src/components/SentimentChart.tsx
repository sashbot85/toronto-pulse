'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SentimentData } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface SentimentChartProps {
  sentiment: SentimentData | null;
  loading: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '12px',
      }}>
        <div style={{ color: '#9ca3af', marginBottom: '8px' }}>{label}</div>
        {payload.map((entry: { name: string; value: number; fill: string }, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: entry.fill }} />
            <span style={{ color: '#d1d5db' }}>{entry.name}:</span>
            <span style={{ color: '#f9fafb', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SentimentChart({ sentiment, loading }: SentimentChartProps) {
  const [candidate, setCandidate] = useState<'chow' | 'bradford'>('chow');

  const chartData = sentiment?.volumeByDay.map(d => ({
    date: (() => { try { return format(parseISO(d.date), 'MMM d'); } catch { return d.date; } })(),
    Positive: candidate === 'chow' ? d.chowPos : d.bradPos,
    Neutral: candidate === 'chow' ? d.chowNeutral : d.bradNeutral,
    Negative: candidate === 'chow' ? d.chowNeg : d.bradNeg,
  })) || [];

  // Only show last 10 days
  const displayData = chartData.slice(-10);

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(25,29,36,0.98), rgba(18,22,28,0.98))',
      border: '1px solid #262c36',
      borderRadius: '24px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f5f7fb', letterSpacing: '-0.02em' }}>
            Daily Sentiment Mix
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7b8494' }}>
            Day-by-day signal mix across the recent window
          </p>
        </div>
        {/* Candidate toggle */}
        <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', border: '1px solid #262c36', background: 'rgba(255,255,255,0.03)', padding: '4px' }}>
          <button
            onClick={() => setCandidate('chow')}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: candidate === 'chow' ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
              color: candidate === 'chow' ? '#f59e0b' : '#6b7280',
              border: 'none',
              borderRadius: '999px',
              transition: 'all 0.2s ease',
            }}
          >
            Chow
          </button>
          <button
            onClick={() => setCandidate('bradford')}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: candidate === 'bradford' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: candidate === 'bradford' ? '#3b82f6' : '#6b7280',
              border: 'none',
              borderRadius: '999px',
              transition: 'all 0.2s ease',
            }}
          >
            Bradford
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={{ stroke: '#1f2937' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={{ stroke: '#1f2937' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            <Bar dataKey="Positive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Neutral" stackId="a" fill="#374151" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
