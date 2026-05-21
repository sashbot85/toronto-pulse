'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Poll } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface PollingChartProps {
  polls: Poll[];
  loading: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const source = payload[0]?.payload?.source || '';
    return (
      <div style={{
        background: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '13px',
      }}>
        <div style={{ color: '#9ca3af', marginBottom: '6px', fontSize: '11px' }}>{label}</div>
        {source && <div style={{ color: '#6b7280', marginBottom: '8px', fontSize: '11px' }}>{source}</div>}
        {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
            <span style={{ color: '#d1d5db' }}>{entry.name}:</span>
            <span style={{ color: '#f9fafb', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function PollingChart({ polls, loading }: PollingChartProps) {
  // Build chart data - use horserace polls, prefer decided voters when multiple on same date
  const chartData = polls
    .filter(p => p.type === 'horserace')
    .reduce((acc, poll) => {
      const existing = acc.find(d => d.date === poll.date);
      if (!existing) {
        acc.push({
          date: poll.date,
          displayDate: format(parseISO(poll.date), 'MMM d'),
          source: poll.source,
          Chow: poll.chow,
          Bradford: poll.bradford,
          Other: poll.other,
        });
      }
      return acc;
    }, [] as Array<{ date: string; displayDate: string; source: string; Chow: number; Bradford: number; Other: number }>)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(25,29,36,0.98), rgba(18,22,28,0.98))',
      border: '1px solid #262c36',
      borderRadius: '24px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f5f7fb', letterSpacing: '-0.03em' }}>
            Polling Velocity
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7b8494' }}>
            Head-to-head polling data across the race cycle
          </p>
        </div>
        <div style={{
          padding: '8px 12px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px',
          color: '#c7cfdd',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {polls.filter(p => p.type === 'horserace').length} POLLS
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '220px', borderRadius: '12px' }} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="chowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bradGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#1f2937' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#1f2937' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 70]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              formatter={(value) => (
                <span style={{ color: value === 'Chow' ? '#f59e0b' : '#3b82f6', fontWeight: 600 }}>
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="Chow"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#chowGradient)"
              dot={{ fill: '#f59e0b', strokeWidth: 0, r: 5 }}
              activeDot={{ r: 7, fill: '#f59e0b' }}
            />
            <Area
              type="monotone"
              dataKey="Bradford"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#bradGradient)"
              dot={{ fill: '#3b82f6', strokeWidth: 0, r: 5 }}
              activeDot={{ r: 7, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Poll details table */}
      {!loading && polls.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            All Polls
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {polls.map((poll, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#0d1424',
                borderRadius: '8px',
                fontSize: '12px',
              }}>
                <div style={{ color: '#9ca3af' }}>
                  <span style={{ color: '#f9fafb', fontWeight: 600 }}>{poll.source}</span>
                  {' · '}
                  {format(parseISO(poll.date), 'MMM d, yyyy')}
                  {' · '}
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#1f2937',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {poll.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>C: {poll.chow}%</span>
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>B: {poll.bradford}%</span>
                  <span style={{ color: '#6b7280' }}>Oth: {poll.other}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
