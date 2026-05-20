import { NextResponse } from 'next/server';

const POLLS = [
  { date: '2025-12-15', source: 'Liaison Strategies', chow: 55, bradford: 18, other: 27, type: 'approval' },
  { date: '2026-03-10', source: 'Pallas Data', chow: 35, bradford: 29, other: 36, type: 'horserace' },
  { date: '2026-03-10', source: 'Pallas Data (decided)', chow: 47, bradford: 38, other: 15, type: 'horserace' },
  { date: '2026-05-11', source: 'Liaison Strategies', chow: 50, bradford: 37, other: 13, type: 'horserace' },
  { date: '2026-05-11', source: 'Liaison Strategies (all)', chow: 38, bradford: 28, other: 34, type: 'horserace' },
];

export async function GET() {
  return NextResponse.json({ polls: POLLS });
}
