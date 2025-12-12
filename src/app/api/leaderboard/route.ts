import { NextResponse } from 'next/server';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalRaised: number;
  createdAt: string;
}

// TODO: Replace with database lookup
// For now, return mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'user_1', userName: 'Sarah K.', totalRaised: 12500000, createdAt: new Date().toISOString() },
  { rank: 2, userId: 'user_2', userName: 'Alex M.', totalRaised: 10200000, createdAt: new Date().toISOString() },
  { rank: 3, userId: 'user_3', userName: 'Jordan L.', totalRaised: 8750000, createdAt: new Date().toISOString() },
  { rank: 4, userId: 'user_4', userName: 'Casey T.', totalRaised: 7200000, createdAt: new Date().toISOString() },
  { rank: 5, userId: 'user_5', userName: 'Morgan P.', totalRaised: 6100000, createdAt: new Date().toISOString() },
  { rank: 6, userId: 'user_6', userName: 'Taylor R.', totalRaised: 5800000, createdAt: new Date().toISOString() },
  { rank: 7, userId: 'user_7', userName: 'Jamie S.', totalRaised: 5200000, createdAt: new Date().toISOString() },
  { rank: 8, userId: 'user_8', userName: 'Riley W.', totalRaised: 4900000, createdAt: new Date().toISOString() },
  { rank: 9, userId: 'user_9', userName: 'Quinn H.', totalRaised: 4500000, createdAt: new Date().toISOString() },
  { rank: 10, userId: 'user_10', userName: 'Avery D.', totalRaised: 4200000, createdAt: new Date().toISOString() },
];

/**
 * GET /api/leaderboard
 * 
 * Returns top performers on the leaderboard.
 * In production, this would query from database sorted by totalRaised.
 */
export async function GET() {
  try {
    // TODO: Query from database
    // const leaderboard = await db.runs.findMany({
    //   where: { completedAt: { not: null } },
    //   orderBy: { totalRaised: 'desc' },
    //   take: 50,
    //   include: { user: true },
    // });

    return NextResponse.json(MOCK_LEADERBOARD);
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

