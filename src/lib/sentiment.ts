const GLOBAL_POSITIVE = [
  'good', 'great', 'strong', 'smart', 'effective', 'improved', 'improving', 'progress', 'popular',
  'support', 'backing', 'endorse', 'endorsed', 'approve', 'approved', 'right', 'love', 'liked',
  'winning', 'win', 'better', 'best', 'competent', 'leadership', 'solid', 'praised', 'hopeful',
  'promising', 'impressive', 'responsible', 'honest', 'trusted', 'trustworthy', 'clear plan'
];

const GLOBAL_NEGATIVE = [
  'bad', 'terrible', 'awful', 'incompetent', 'failed', 'failure', 'weak', 'worse', 'worst',
  'hate', 'angry', 'criticized', 'criticised', 'wrong', 'corrupt', 'clown', 'joke', 'embarrassing',
  'threatened', 'threaten', 'tax hike', 'raise taxes', 'property taxes', 'pander', 'pandering',
  'unsafe', 'disaster', 'mess', 'blame', 'out of touch', 'unpopular', 'frustrating', 'ridiculous',
  'shit hole', 'shithole', 'dump', 'ruined', 'disgusting', 'broken', 'pathetic', 'garbage',
  'trash', 'disgrace', 'horrible', 'brutal', 'clueless', 'liar', 'lying', 'dishonest', 'crooked',
  "won't visit", 'will not visit', 'never visit', "can't be serious", 'cannot be serious', 'useless'
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
  'chow tax hike', 'chow raise taxes', 'olivia chow ruined', 'under olivia chow', 'chow ruined',
  'olivia chow is the worst'
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

const NEGATION_PATTERNS = [
  /can't be serious/g,
  /cannot be serious/g,
  /not serious/g,
  /not good/g,
  /not great/g,
  /not better/g,
  /not right/g,
  /no good/g,
  /never good/g,
  /isn't good/g,
  /wasn't good/g,
  /don't support/g,
  /do not support/g,
  /won't support/g,
  /will not support/g,
];

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
}

function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, pattern) => acc + ((text.match(pattern) || []).length), 0);
}

export function getSentimentScore(text: string, posKw: string[], negKw: string[]): number {
  const lower = text.toLowerCase();
  let pos = countMatches(lower, [...GLOBAL_POSITIVE, ...posKw]);
  let neg = countMatches(lower, [...GLOBAL_NEGATIVE, ...negKw]);

  const negationHits = countPatternMatches(lower, NEGATION_PATTERNS);
  if (negationHits > 0) {
    pos = Math.max(0, pos - negationHits);
    neg += negationHits;
  }

  if ((lower.includes('under olivia chow') || lower.includes('under chow')) && neg > 0) {
    neg += 1;
  }

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
