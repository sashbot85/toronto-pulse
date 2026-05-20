'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  lastUpdated: number | null;
  autoRefresh: boolean;
  onToggleRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ lastUpdated, autoRefresh, onToggleRefresh, isRefreshing }: HeaderProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      setTimeAgo(formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <header style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div className="top-tabs">
          <span className="top-tab active">Real-time</span>
          <span className="top-tab">Forecasts</span>
          <span className="top-tab">History</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            minWidth: '230px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '16px',
            border: '1px solid #262c36',
            background: '#171b21',
            color: '#7b8494',
            fontSize: '13px',
          }}>
            <span style={{ fontSize: '14px' }}>⌕</span>
            <span>Search data points...</span>
          </div>

          <button
            onClick={onToggleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '16px',
              border: '1px solid #262c36',
              background: '#171b21',
              color: autoRefresh ? '#f5f7fb' : '#7b8494',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{isRefreshing ? '↻' : '⟳'}</span>
            {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          </button>

          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            border: '1px solid #262c36',
            background: '#171b21',
            display: 'grid',
            placeItems: 'center',
            color: '#c7cfdd',
          }}>◌</div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            border: '1px solid #262c36',
            background: '#171b21',
            display: 'grid',
            placeItems: 'center',
            color: '#c7cfdd',
          }}>◔</div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #fb7185)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 800,
          }}>S</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#7b8494', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Toronto Pulse Dashboard
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#f5f7fb', letterSpacing: '-0.04em', lineHeight: 1 }}>
            Toronto Mayoral Sentiment Tracker
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#9ca3af' }}>
            <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isRefreshing ? '#f59e0b' : '#10b981' }} />
            <span>{isRefreshing ? 'Refreshing…' : lastUpdated ? `Updated ${timeAgo}` : 'Loading…'}</span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#8df0c8',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Live stream
          </div>
        </div>
      </div>
    </header>
  );
}
