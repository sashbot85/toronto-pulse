'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import KPIStrip from '@/components/KPIStrip';
import PollingChart from '@/components/PollingChart';
import SentimentChart from '@/components/SentimentChart';
import IssueTracker from '@/components/IssueTracker';
import LiveFeed from '@/components/LiveFeed';
import CandidateCards from '@/components/CandidateCards';
import GeoSentiment from '@/components/GeoSentiment';
import { RedditPost, RedditComment, Poll, SentimentData, FeedItem } from '@/lib/types';
import { mentionsChow, mentionsBradford, getItemSentiment } from '@/lib/sentiment';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function Home() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const fetchData = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsRefreshing(true);

    try {
      const [postsRes, pollsRes, sentimentRes] = await Promise.allSettled([
        fetch('/api/reddit/posts'),
        fetch('/api/polls'),
        fetch('/api/sentiment'),
      ]);

      if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
        const data = await postsRes.value.json();
        setPosts(data.posts || []);
        if (data.stale) setStale(true);
      }

      if (pollsRes.status === 'fulfilled' && pollsRes.value.ok) {
        const data = await pollsRes.value.json();
        setPolls(data.polls || []);
      }

      if (sentimentRes.status === 'fulfilled' && sentimentRes.value.ok) {
        const data = await sentimentRes.value.json();
        setSentiment(data);
      }

      // Fetch comments in background (slower)
      fetch('/api/reddit/comments')
        .then(r => r.json())
        .then(data => {
          setComments(data.comments || []);
        })
        .catch(() => {});

      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Build feed items
  const feedItems: FeedItem[] = [
    ...posts.map(p => ({
      type: 'post' as const,
      id: `post_${p.id}`,
      text: p.title,
      author: p.author,
      score: p.score,
      created_utc: p.created_utc,
      subreddit: p.subreddit,
      permalink: p.permalink,
      mentionsChow: mentionsChow(p.title + ' ' + p.selftext),
      mentionsBradford: mentionsBradford(p.title + ' ' + p.selftext),
      sentiment: getItemSentiment(p.title + ' ' + p.selftext),
    })),
    ...comments.map(c => ({
      type: 'comment' as const,
      id: `comment_${c.id}`,
      text: c.body,
      author: c.author,
      score: c.score,
      created_utc: c.created_utc,
      subreddit: undefined,
      permalink: c.permalink,
      mentionsChow: mentionsChow(c.body),
      mentionsBradford: mentionsBradford(c.body),
      sentiment: getItemSentiment(c.body),
    })),
  ].sort((a, b) => b.created_utc - a.created_utc);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a' }}>
      <Header
        lastUpdated={lastUpdated}
        autoRefresh={autoRefresh}
        onToggleRefresh={() => setAutoRefresh(v => !v)}
        isRefreshing={isRefreshing}
      />

      {/* Stale data warning */}
      {stale && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 0,
          padding: '10px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#f59e0b',
          fontWeight: 500,
        }}>
          ⚠️ Showing cached data — Reddit may be rate-limiting requests. Data may be up to 5 minutes old.
        </div>
      )}

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>

        {/* KPI Strip */}
        <KPIStrip sentiment={sentiment} loading={loading} />

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: '20px',
          marginBottom: '24px',
        }}
          className="main-grid"
        >
          {/* Left Column */}
          <div>
            <PollingChart polls={polls} loading={loading} />
            <SentimentChart sentiment={sentiment} loading={loading} />
            <IssueTracker
              sentiment={sentiment}
              loading={loading}
              onSelectIssue={setSelectedIssue}
              selectedIssue={selectedIssue}
            />
          </div>

          {/* Right Column */}
          <div>
            <LiveFeed items={feedItems} loading={loading} issueFilter={selectedIssue} />
          </div>
        </div>

        {/* Bottom Section */}
        <CandidateCards sentiment={sentiment} loading={loading} />
        <GeoSentiment sentiment={sentiment} loading={loading} />

        {/* Footer */}
        <footer style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #1f2937',
          textAlign: 'center',
          color: '#4b5563',
          fontSize: '12px',
        }}>
          <div style={{ marginBottom: '6px', fontWeight: 500 }}>
            Powered by Reddit Public Data • Sentiment analysis is keyword-based • Not affiliated with any candidate or campaign
          </div>
          <div style={{ color: '#374151' }}>
            Data sources: r/toronto • r/CanadaPolitics • r/TorontoPolitics • Polling: Liaison Strategies, Pallas Data
          </div>
          {lastUpdated && (
            <div style={{ marginTop: '8px', color: '#374151' }}>
              Last full refresh: {new Date(lastUpdated).toLocaleString('en-CA', { timeZone: 'America/Toronto' })} ET
            </div>
          )}
        </footer>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
