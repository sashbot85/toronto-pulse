export const CHOW_POSITIVE = [
  'good mayor', 'support chow', 'voting chow', 'chow is right',
  'approve', 'great job', 'doing well', 'better than', 're-elect',
  'good leadership', 'love chow', 'chow doing', 'olivia is',
  'chow has', 'chow will', 'backing chow', 'chow plan'
];

export const CHOW_NEGATIVE = [
  'chow sucks', 'worst mayor', 'fire chow', 'chow failed',
  'terrible', 'incompetent', 'vote her out', 'disappointed',
  'disaster', 'hate chow', 'chow is bad', 'chow is wrong',
  'against chow', 'dump chow', 'chow is the worst', 'recall chow'
];

export const BRADFORD_POSITIVE = [
  'support bradford', 'voting bradford', 'bradford is right',
  'fresh start', 'new leadership', 'better option', 'good platform',
  'love bradford', 'brad is', 'bradford has', 'backing bradford',
  'bradford plan', 'go bradford', 'vote bradford'
];

export const BRADFORD_NEGATIVE = [
  'bradford sucks', 'unknown', 'no experience', 'who is bradford',
  "can't win", 'weak candidate', 'hate bradford', 'against bradford',
  'bradford is bad', 'bradford failed', 'bradford is wrong',
  'no bradford', 'dump bradford', 'brad sucks'
];

export function mentionsChow(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('chow') || lower.includes('olivia');
}

export function mentionsBradford(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('bradford') || lower.includes('brad ');
}

export function getSentiment(text: string, posKw: string[], negKw: string[]): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of posKw) if (lower.includes(kw)) score++;
  for (const kw of negKw) if (lower.includes(kw)) score--;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

export function getItemSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  if (mentionsChow(text)) {
    return getSentiment(text, CHOW_POSITIVE, CHOW_NEGATIVE);
  }
  if (mentionsBradford(text)) {
    return getSentiment(text, BRADFORD_POSITIVE, BRADFORD_NEGATIVE);
  }
  return 'neutral';
}
