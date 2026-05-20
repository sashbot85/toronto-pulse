'use client';

import { SentimentData } from '@/lib/types';

interface GeoSentimentProps {
  sentiment: SentimentData | null;
  loading: boolean;
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

export default function GeoSentiment({ sentiment, loading }: GeoSentimentProps) {
  const geoData = sentiment?.geoData || [];

  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '16px',
      padding: '24px',
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f9fafb' }}>
          Geographic Sentiment Map
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7b8494' }}>
          Borough-level discussion detected across the social stream
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : geoData.length === 0 ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '13px',
          background: '#0d1424',
          borderRadius: '10px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
          Geographic data will appear as borough mentions are detected in Reddit posts
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 80px',
            gap: '8px',
            padding: '0 12px',
            marginBottom: '4px',
          }}>
            <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Borough</div>
            <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, textAlign: 'center' }}>Posts</div>
            <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, textAlign: 'right' }}>Sentiment</div>
          </div>

          {geoData.map((geo) => {
            const color = getSentimentColor(geo.sentiment);
            return (
              <div key={geo.area} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 80px',
                gap: '8px',
                padding: '10px 12px',
                background: '#0d1424',
                borderRadius: '10px',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>{geo.area}</div>
                <div className="font-mono-num" style={{ fontSize: '14px', fontWeight: 700, color: '#9ca3af', textAlign: 'center' }}>
                  {geo.count}
                </div>
                <div style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  fontSize: '11px',
                  fontWeight: 600,
                  color,
                  textAlign: 'center',
                }}>
                  {getSentimentLabel(geo.sentiment)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
