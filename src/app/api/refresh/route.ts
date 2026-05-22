import { NextResponse } from 'next/server';
import { generatePulseData } from '@/lib/pulse-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

let lastRefreshStartedAt = 0;
const MIN_REFRESH_GAP_MS = 10 * 60 * 1000;

export async function POST() {
  const now = Date.now();

  if (lastRefreshStartedAt && now - lastRefreshStartedAt < MIN_REFRESH_GAP_MS) {
    const waitSeconds = Math.ceil((MIN_REFRESH_GAP_MS - (now - lastRefreshStartedAt)) / 1000);
    return NextResponse.json(
      {
        error: 'Refresh is cooling down.',
        retryAfterSeconds: waitSeconds,
      },
      { status: 429 }
    );
  }

  lastRefreshStartedAt = now;

  try {
    const data = await generatePulseData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[TorontoPulse] Manual refresh failed:', error);
    return NextResponse.json(
      { error: 'Manual refresh failed.' },
      { status: 500 }
    );
  }
}
