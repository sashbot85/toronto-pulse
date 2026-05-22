const GLOBAL_POSITIVE = [
  'good', 'great', 'strong', 'smart', 'effective', 'improved', 'improving', 'progress', 'popular',
  'support', 'backing', 'endorse', 'endorsed', 'approve', 'approved', 'right', 'love', 'liked',
  'winning', 'win', 'better', 'best', 'serious', 'competent', 'leadership', 'solid', 'praised'
];

const GLOBAL_NEGATIVE = [
  'bad', 'terrible', 'awful', 'incompetent', 'failed', 'failure', 'weak', 'worse', 'worst',
  'hate', 'angry', 'criticized', 'criticised', 'wrong', 'corrupt', 'clown', 'joke', 'embarrassing',
  'threatened', 'threaten', 'tax hike', 'raise taxes', 'property taxes', 'pander', 'pandering',
  'unsafe', 'disaster', 'mess', 'blame', 'out of touch', 'unpopular', 'frustrating', 'ridiculous'
];

export const CHOW_POSITIVE = [
  'support chow', 'voting chow', 'chow is right', 'good mayor', 're-elect chow',
  'olivia chow is right', 'chow doing well', 'backing chow', 'chow plan', 'mayor chow',
  'olivia is right', 'chow leadership'
];

export const CHOW_NEGATIVE = [
  'chow sucks', 'worst mayor', 'fire chow', 'chow failed', 'vote her out',
  'hate chow', 'chow is bad', 'chow is wrong', 'against chow', 'dump chow',
  'recall chow', 'olivia chow threatened', 'olivia chow made sure', 'mean comments',
  'chow tax hike', 'chow raise taxes'
];

export const BRADFORD_POSITIVE = [
  'support bradford', 'voting bradford', 'bradford is right', 'fresh start', 'new leadership',
  'better option', 'good platform', 'love bradford', 'backing bradford', 'vote bradford'
];

export const BRADFORD_NEGATIVE = [
  'bradford sucks', 'who is bradford', 'no experience', "can't win", 'weak candidate',
  'hate bradford', 'against bradford', 'bradford is bad', 'bradford failed', 'brad sucks',
  'bradford incompetent', 'rain on our parade', 'pander', 'pandering'
];

export function mentionsChow(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('chow') || lower.includes('olivia');
}

export function mentionsBradford(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('bradford') || lower.includes('brad ');
}

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
}

export function getSentimentScore(text: string, posKw: string[], negKw: string[]): number {
  const pos = countMatches(text, [...GLOBAL_POSITIVE, ...posKw]);
  const neg = countMatches(text, [...GLOBAL_NEGATIVE, ...negKw]);
  return pos - neg;
}

export function getSentiment(text: string, posKw: string[], negKw: string[]): 'positive' | 'negative' | 'neutral' {
  const score = getSentimentScore(text, posKw, negKw);
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

export function getItemSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const chow = mentionsChow(lower) ? getSentimentScore(lower, CHOW_POSITIVE, CHOW_NEGATIVE) : 0;
  const brad = mentionsBradford(lower) ? getSentimentScore(lower, BRADFORD_POSITIVE, BRADFORD_NEGATIVE) : 0;
  const score = chow + brad;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}
