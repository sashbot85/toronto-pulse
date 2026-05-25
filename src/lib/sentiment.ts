export type WeightedRule = {
  term: string;
  weight: number;
};

const GLOBAL_POSITIVE: WeightedRule[] = [
  { term: 'good', weight: 1 },
  { term: 'great', weight: 2 },
  { term: 'excellent', weight: 2 },
  { term: 'strong', weight: 1 },
  { term: 'smart', weight: 1 },
  { term: 'effective', weight: 2 },
  { term: 'improved', weight: 1 },
  { term: 'improving', weight: 1 },
  { term: 'progress', weight: 1 },
  { term: 'popular', weight: 1 },
  { term: 'support', weight: 1 },
  { term: 'backing', weight: 1 },
  { term: 'endorse', weight: 1 },
  { term: 'endorsed', weight: 1 },
  { term: 'approve', weight: 1 },
  { term: 'approved', weight: 1 },
  { term: 'right', weight: 1 },
  { term: 'love', weight: 2 },
  { term: 'liked', weight: 1 },
  { term: 'winning', weight: 2 },
  { term: 'win', weight: 1 },
  { term: 'better', weight: 1 },
  { term: 'best', weight: 2 },
  { term: 'competent', weight: 2 },
  { term: 'leadership', weight: 1 },
  { term: 'solid', weight: 1 },
  { term: 'praised', weight: 1 },
  { term: 'hopeful', weight: 1 },
  { term: 'promising', weight: 1 },
  { term: 'impressive', weight: 2 },
  { term: 'responsible', weight: 1 },
  { term: 'honest', weight: 1 },
  { term: 'trusted', weight: 1 },
  { term: 'trustworthy', weight: 2 },
  { term: 'clear plan', weight: 2 },
  { term: 'good policy', weight: 2 },
  { term: 'good job', weight: 2 },
  { term: 'doing well', weight: 2 },
  { term: 'well done', weight: 2 },
  { term: 'fresh start', weight: 1 },
  { term: 'common sense', weight: 1 },
  { term: 'on the right track', weight: 2 },
  { term: 'capable', weight: 2 },
  { term: 'serious leader', weight: 2 },
];

const GLOBAL_NEGATIVE: WeightedRule[] = [
  { term: 'bad', weight: 1 },
  { term: 'terrible', weight: 2 },
  { term: 'awful', weight: 2 },
  { term: 'incompetent', weight: 2 },
  { term: 'failed', weight: 2 },
  { term: 'failure', weight: 2 },
  { term: 'weak', weight: 1 },
  { term: 'worse', weight: 1 },
  { term: 'worst', weight: 2 },
  { term: 'hate', weight: 2 },
  { term: 'angry', weight: 1 },
  { term: 'criticized', weight: 1 },
  { term: 'criticised', weight: 1 },
  { term: 'wrong', weight: 1 },
  { term: 'corrupt', weight: 3 },
  { term: 'clown', weight: 2 },
  { term: 'joke', weight: 2 },
  { term: 'embarrassing', weight: 2 },
  { term: 'threatened', weight: 2 },
  { term: 'threaten', weight: 1 },
  { term: 'tax hike', weight: 2 },
  { term: 'raise taxes', weight: 2 },
  { term: 'property taxes', weight: 1 },
  { term: 'pander', weight: 1 },
  { term: 'pandering', weight: 2 },
  { term: 'unsafe', weight: 2 },
  { term: 'disaster', weight: 3 },
  { term: 'mess', weight: 2 },
  { term: 'blame', weight: 1 },
  { term: 'out of touch', weight: 2 },
  { term: 'unpopular', weight: 1 },
  { term: 'frustrating', weight: 1 },
  { term: 'ridiculous', weight: 2 },
  { term: 'shit hole', weight: 4 },
  { term: 'shithole', weight: 4 },
  { term: 'dump', weight: 2 },
  { term: 'ruined', weight: 3 },
  { term: 'disgusting', weight: 2 },
  { term: 'broken', weight: 2 },
  { term: 'pathetic', weight: 2 },
  { term: 'garbage', weight: 2 },
  { term: 'trash', weight: 2 },
  { term: 'disgrace', weight: 2 },
  { term: 'horrible', weight: 2 },
  { term: 'brutal', weight: 2 },
  { term: 'clueless', weight: 2 },
  { term: 'liar', weight: 3 },
  { term: 'lying', weight: 2 },
  { term: 'dishonest', weight: 2 },
  { term: 'crooked', weight: 3 },
  { term: "won't visit", weight: 3 },
  { term: 'will not visit', weight: 3 },
  { term: 'never visit', weight: 3 },
  { term: "can't be serious", weight: 3 },
  { term: 'cannot be serious', weight: 3 },
  { term: 'useless', weight: 2 },
  { term: 'scandal', weight: 2 },
  { term: 'embarrassment', weight: 2 },
  { term: 'tone deaf', weight: 2 },
  { term: 'chaos', weight: 2 },
  { term: 'crime is up', weight: 3 },
  { term: 'city is ruined', weight: 4 },
  { term: 'city is broken', weight: 3 },
  { term: 'not safe', weight: 3 },
  { term: 'not working', weight: 2 },
  { term: 'fed up', weight: 2 },
  { term: 'sick of', weight: 2 },
  { term: 'disaster mayor', weight: 4 },
  { term: 'shit mayor', weight: 4 },
];

export const CHOW_POSITIVE: WeightedRule[] = [
  { term: 'support chow', weight: 2 },
  { term: 'voting chow', weight: 2 },
  { term: 'chow is right', weight: 2 },
  { term: 'good mayor', weight: 2 },
  { term: 're elect chow', weight: 3 },
  { term: 're-elect chow', weight: 3 },
  { term: 'olivia chow is right', weight: 3 },
  { term: 'chow doing well', weight: 2 },
  { term: 'backing chow', weight: 2 },
  { term: 'chow plan', weight: 1 },
  { term: 'mayor chow', weight: 1 },
  { term: 'olivia is right', weight: 2 },
  { term: 'chow leadership', weight: 2 },
  { term: 'olivia chow has done a good job', weight: 4 },
  { term: 'chow has done a good job', weight: 4 },
  { term: 'trust chow', weight: 3 },
  { term: 'like olivia chow', weight: 3 },
  { term: 'love olivia chow', weight: 4 },
  { term: 'chow is doing a good job', weight: 4 },
];

export const CHOW_NEGATIVE: WeightedRule[] = [
  { term: 'chow sucks', weight: 4 },
  { term: 'worst mayor', weight: 4 },
  { term: 'fire chow', weight: 4 },
  { term: 'chow failed', weight: 3 },
  { term: 'vote her out', weight: 3 },
  { term: 'hate chow', weight: 3 },
  { term: 'chow is bad', weight: 3 },
  { term: 'chow is wrong', weight: 2 },
  { term: 'against chow', weight: 2 },
  { term: 'dump chow', weight: 3 },
  { term: 'recall chow', weight: 4 },
  { term: 'olivia chow threatened', weight: 2 },
  { term: 'olivia chow made sure', weight: 1 },
  { term: 'mean comments', weight: 1 },
  { term: 'chow tax hike', weight: 3 },
  { term: 'chow raise taxes', weight: 3 },
  { term: 'olivia chow ruined', weight: 4 },
  { term: 'under olivia chow', weight: 2 },
  { term: 'chow ruined', weight: 4 },
  { term: 'olivia chow is the worst', weight: 4 },
  { term: 'olivia chow has ruined', weight: 4 },
  { term: 'chow has ruined', weight: 4 },
  { term: 'olivia chow disaster', weight: 4 },
  { term: 'disaster under olivia chow', weight: 5 },
  { term: 'chow needs to go', weight: 4 },
  { term: 'chow must go', weight: 4 },
  { term: 'done with chow', weight: 3 },
  { term: 'sick of chow', weight: 3 },
  { term: 'fed up with chow', weight: 4 },
];

export const BRADFORD_POSITIVE: WeightedRule[] = [
  { term: 'support bradford', weight: 2 },
  { term: 'voting bradford', weight: 2 },
  { term: 'bradford is right', weight: 2 },
  { term: 'fresh start', weight: 1 },
  { term: 'new leadership', weight: 1 },
  { term: 'better option', weight: 2 },
  { term: 'good platform', weight: 2 },
  { term: 'love bradford', weight: 3 },
  { term: 'backing bradford', weight: 2 },
  { term: 'vote bradford', weight: 3 },
  { term: 'trust bradford', weight: 3 },
  { term: 'bradford has a plan', weight: 3 },
  { term: 'bradford is the better choice', weight: 4 },
];

export const BRADFORD_NEGATIVE: WeightedRule[] = [
  { term: 'bradford sucks', weight: 4 },
  { term: 'who is bradford', weight: 2 },
  { term: 'no experience', weight: 2 },
  { term: "can't win", weight: 2 },
  { term: 'weak candidate', weight: 2 },
  { term: 'hate bradford', weight: 3 },
  { term: 'against bradford', weight: 2 },
  { term: 'bradford is bad', weight: 3 },
  { term: 'bradford failed', weight: 3 },
  { term: 'brad sucks', weight: 3 },
  { term: 'bradford incompetent', weight: 3 },
  { term: 'rain on our parade', weight: 2 },
  { term: 'pander', weight: 1 },
  { term: 'pandering', weight: 2 },
  { term: 'bradford is the worst', weight: 4 },
  { term: 'bradford must go', weight: 4 },
  { term: 'fed up with bradford', weight: 4 },
  { term: 'done with bradford', weight: 3 },
];

const NEGATION_PATTERNS = [
  /can't be serious/g,
  /cannot be serious/g,
  /not serious/g,
  /not good/g,
  /not great/g,
  /not better/g,
  /not the best/g,
  /not right/g,
  /no good/g,
  /never good/g,
  /isn't good/g,
  /wasn't good/g,
  /don't support/g,
  /do not support/g,
  /won't support/g,
  /will not support/g,
  /don't trust/g,
  /do not trust/g,
  /not competent/g,
  /not effective/g,
];

const INTENSIFIERS = ['very', 'really', 'so', 'extremely', 'totally', 'absolutely'];

function normalizeText(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[@#]/g, ' ')
    .replace(/[^a-z0-9'\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countRuleMatches(text: string, rules: WeightedRule[]): number {
  let score = 0;
  for (const { term, weight } of rules) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}(?=$|[^a-z0-9])`, 'g');
    const matches = text.match(pattern);
    if (matches) score += matches.length * weight;
  }
  return score;
}

function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, pattern) => acc + ((text.match(pattern) || []).length), 0);
}

function applyIntensifiers(text: string, rules: WeightedRule[]): number {
  let bonus = 0;
  for (const { term } of rules) {
    for (const word of INTENSIFIERS) {
      const pattern = new RegExp(`(^|[^a-z0-9])${word} ${escapeRegex(term)}(?=$|[^a-z0-9])`, 'g');
      const matches = text.match(pattern);
      if (matches) bonus += matches.length;
    }
  }
  return bonus;
}

export function mentionsChow(text: string): boolean {
  const lower = normalizeText(text);
  return lower.includes(' chow ') || lower.includes(' olivia ');
}

export function mentionsBradford(text: string): boolean {
  const lower = normalizeText(text);
  return lower.includes(' bradford ') || lower.includes(' brad ');
}

export function getSentimentScore(text: string, posKw: WeightedRule[], negKw: WeightedRule[]): number {
  const lower = normalizeText(text);
  let pos = countRuleMatches(lower, [...GLOBAL_POSITIVE, ...posKw]);
  let neg = countRuleMatches(lower, [...GLOBAL_NEGATIVE, ...negKw]);

  pos += applyIntensifiers(lower, [...GLOBAL_POSITIVE, ...posKw]);
  neg += applyIntensifiers(lower, [...GLOBAL_NEGATIVE, ...negKw]);

  const negationHits = countPatternMatches(lower, NEGATION_PATTERNS);
  if (negationHits > 0) {
    pos = Math.max(0, pos - negationHits);
    neg += negationHits * 2;
  }

  if ((lower.includes(' under olivia chow ') || lower.includes(' under chow ')) && neg > 0) {
    neg += 2;
  }

  if ((lower.includes(' under bradford ') || lower.includes(' under brad ')) && neg > 0) {
    neg += 2;
  }

  return pos - neg;
}

export function getSentiment(text: string, posKw: WeightedRule[], negKw: WeightedRule[]): 'positive' | 'negative' | 'neutral' {
  const score = getSentimentScore(text, posKw, negKw);
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

export function getItemSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const chow = mentionsChow(text) ? getSentimentScore(text, CHOW_POSITIVE, CHOW_NEGATIVE) : 0;
  const brad = mentionsBradford(text) ? getSentimentScore(text, BRADFORD_POSITIVE, BRADFORD_NEGATIVE) : 0;
  const score = chow + brad;

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}
