import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface Turn {
  speaker: 'user' | 'agent';
  text: string;
  timestamp?: number;
}

interface StageCompleteRequest {
  runId: string;
  stageId: string;
  transcript: Turn[];
}

interface StageCompleteResponse {
  stars: number;
  moneyRaised: number;
  feedback: string[];
  passFail: 'pass' | 'fail';
  totalRaised: number;
}

// Scoring criteria for each stage - realistic funding amounts
const STAGE_CRITERIA: Record<string, { keywords: string[]; maxMoney: number; minMoney: number; minWords: number }> = {
  'mom': {
    // Mom gives encouragement money - a small "mom check"
    keywords: ['building', 'help', 'people', 'problem', 'solution', 'love', 'believe', 'excited'],
    maxMoney: 5000,      // Max $5k from mom
    minMoney: 500,       // Min $500
    minWords: 20,
  },
  'local-angel': {
    // Local angel - small personal investment
    keywords: ['vision', 'opportunity', 'market', 'team', 'passion', 'customers', 'growth', 'potential'],
    maxMoney: 50000,     // Max $50k from angel
    minMoney: 10000,     // Min $10k
    minWords: 60,
  },
  'vc-single': {
    // Seed VC - typical seed check
    keywords: ['revenue', 'tam', 'sam', 'metrics', 'unit economics', 'burn', 'runway', 'moat'],
    maxMoney: 500000,    // Max $500k
    minMoney: 100000,    // Min $100k
    minWords: 80,
  },
  'yc-traction': {
    // YC - standard deal + extra based on traction
    keywords: ['growth', 'week over week', 'users', 'revenue', 'retention', 'mrr', 'arr', 'momentum'],
    maxMoney: 1000000,   // Max $1M (YC deal + follow-on)
    minMoney: 250000,    // Min $250k (base YC deal)
    minWords: 80,
  },
  'shark-tank': {
    // Shark Tank - big deals
    keywords: ['marketing', 'brand', 'customers', 'sales', 'distribution', 'scale', 'viral', 'acquisition'],
    maxMoney: 2000000,   // Max $2M
    minMoney: 200000,    // Min $200k
    minWords: 100,
  },
};

// Feedback templates per stage
const STAGE_FEEDBACK: Record<string, { positive: string[]; constructive: string[] }> = {
  'mom': {
    positive: [
      'Your passion really came through!',
      'You explained it so clearly even mom gets it',
      'The personal connection to the problem is compelling',
      'Great energy - mom is proud!',
    ],
    constructive: [
      'Try to simplify the explanation even more',
      'Share more about why this matters to you',
      'Remember to breathe and slow down',
    ],
  },
  'local-angel': {
    positive: [
      'Your story really resonated',
      'The vision is inspiring and achievable',
      'Clear understanding of the opportunity',
      'Authentic and trustworthy presence',
    ],
    constructive: [
      'Be more specific about near-term milestones',
      'Share what keeps you up at night',
      'Connect your background to this problem more',
    ],
  },
  'vc-single': {
    positive: [
      'Strong command of the numbers',
      'Clear and concise pitch',
      'Compelling market opportunity',
      'Professional and confident delivery',
    ],
    constructive: [
      'Tighten up the unit economics explanation',
      'Address competitive landscape proactively',
      'Be more specific on use of funds',
    ],
  },
  'yc-traction': {
    positive: [
      'Impressive growth trajectory',
      'Clear focus on metrics that matter',
      'Strong evidence of product-market fit',
      'YC would be lucky to have you!',
    ],
    constructive: [
      'Lead with your best metric faster',
      'Explain the "why" behind the growth',
      'Show retention alongside acquisition',
    ],
  },
  'shark-tank': {
    positive: [
      'Great marketing instincts',
      'You understand your customer deeply',
      'The brand potential is massive',
      'Shark-worthy pitch!',
    ],
    constructive: [
      'Think bigger on distribution channels',
      'Show more customer testimonials',
      'Make the ask more dramatic',
    ],
  },
};

/**
 * POST /api/run/stage/complete
 * 
 * Scores a completed stage based on the transcript
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as StageCompleteRequest;
    const { runId, stageId, transcript } = body;

    if (!runId || !stageId || !transcript) {
      return NextResponse.json(
        { error: 'runId, stageId, and transcript are required' },
        { status: 400 }
      );
    }

    // Get scoring criteria for this stage
    const criteria = STAGE_CRITERIA[stageId] || STAGE_CRITERIA['mom'];
    const feedbackTemplates = STAGE_FEEDBACK[stageId] || STAGE_FEEDBACK['mom'];

    // Analyze transcript
    const userTurns = transcript.filter(t => t.speaker === 'user');
    const fullUserText = userTurns.map(t => t.text).join(' ').toLowerCase();
    
    // Count keyword matches
    let keywordMatches = 0;
    for (const keyword of criteria.keywords) {
      if (fullUserText.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }

    // Calculate engagement (number of exchanges)
    const engagementScore = Math.min(transcript.length / 8, 1);

    // Calculate verbosity
    const wordCount = fullUserText.split(/\s+/).filter(w => w.length > 0).length;
    const verbosityScore = Math.min(wordCount / criteria.minWords, 1);

    // Calculate overall score
    const keywordScore = keywordMatches / criteria.keywords.length;
    const overallScore = (keywordScore * 0.4) + (engagementScore * 0.3) + (verbosityScore * 0.3);

    // Convert to stars (1-5) with some randomness for fun
    const baseStars = Math.round(overallScore * 4) + 1;
    const stars = Math.max(1, Math.min(5, baseStars + (Math.random() > 0.7 ? 1 : 0)));

    // Calculate money raised based on score, within stage's min/max range
    const moneyRange = criteria.maxMoney - criteria.minMoney;
    const moneyRaised = Math.round(criteria.minMoney + (moneyRange * overallScore));

    // Determine pass/fail (need at least 2 stars to pass)
    const passFail: 'pass' | 'fail' = stars >= 2 ? 'pass' : 'fail';

    // Generate feedback
    const feedback: string[] = [];
    
    // Add positive feedback
    const numPositive = Math.min(Math.ceil(stars / 2), 2);
    const shuffledPositive = [...feedbackTemplates.positive].sort(() => Math.random() - 0.5);
    feedback.push(...shuffledPositive.slice(0, numPositive));

    // Add constructive feedback
    const numConstructive = stars <= 3 ? 2 : 1;
    const shuffledConstructive = [...feedbackTemplates.constructive].sort(() => Math.random() - 0.5);
    feedback.push(...shuffledConstructive.slice(0, numConstructive));

    // Calculate total raised (sum of this stage - in real app would be cumulative)
    const totalRaised = moneyRaised;

    const response: StageCompleteResponse = {
      stars,
      moneyRaised,
      feedback,
      passFail,
      totalRaised,
    };

    console.log('[Stage Complete]:', { 
      runId, 
      stageId, 
      stars, 
      moneyRaised: `$${(moneyRaised/1000000).toFixed(2)}M`,
      passFail,
      wordCount,
      keywordMatches: `${keywordMatches}/${criteria.keywords.length}`
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Stage Complete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
