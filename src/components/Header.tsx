'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  lastUpdated: number | null;
  autoRefresh: boolean;
  onToggleRefresh: () => void;
  onForceRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ lastUpdated, autoRefresh, onToggleRefresh, onForceRefresh, isRefreshing }: HeaderProps) {
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
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10, 15, 26, 0.9)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1f2937',
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🗳️</span>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#f9fafb',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}>
              Toronto Pulse
            </div>
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}>
              2026 Municipal Election Monitor
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px 20px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Last updated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#9ca3af' }}>
            <div
              className="pulse-dot"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isRefreshing ? '#f59e0b' : '#10b981',
              }}
            />
            <span>
              {isRefreshing ? 'Refreshing...' : lastUpdated ? `Updated ${timeAgo}` : 'Loading...'}
            </span>
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={onToggleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${autoRefresh ? '#374151' : '#1f2937'}`,
              background: autoRefresh ? '#1f2937' : 'transparent',
              color: autoRefresh ? '#10b981' : '#6b7280',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
            </svg>
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={onForceRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              background: isRefreshing ? 'rgba(31, 41, 55, 0.6)' : 'rgba(37, 99, 235, 0.12)',
              color: isRefreshing ? '#6b7280' : '#93c5fd',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4v6h6"/>
              <path d="M20 20v-6h-6"/>
              <path d="M20 9a8 8 0 0 0-13.66-4.66L4 6"/>
              <path d="M4 15a8 8 0 0 0 13.66 4.66L20 18"/>
            </svg>
            {isRefreshing ? 'Updating…' : 'Force update'}
          </button>

          {/* Live badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#10b981',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            <div className="pulse-dot" style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: '#10b981',
            }} />
            LIVE
          </div>
        </div>
      </div>
    </header>
  );
}
