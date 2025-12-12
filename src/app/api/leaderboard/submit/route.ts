import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface SubmitRequest {
  runId: string;
}

/**
 * POST /api/leaderboard/submit
 * 
 * Submits a completed run to the leaderboard.
 * In production, this would:
 * 1. Verify the run belongs to the user
 * 2. Calculate total raised across all stages
 * 3. Insert/update leaderboard entry
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
    const body = await request.json() as SubmitRequest;
    const { runId } = body;

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      );
    }

    // Get user info for leaderboard entry
    const user = await currentUser();
    const userName = user?.firstName 
      ? `${user.firstName} ${user.lastName?.[0] || ''}.`
      : 'Anonymous';

    // TODO: Verify run belongs to user and get total raised
    // const run = await db.runs.findUnique({ where: { id: runId, userId } });
    // if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    // const totalRaised = run.totalRaised;

    // TODO: Create/update leaderboard entry
    // await db.leaderboard.upsert({
    //   where: { runId },
    //   create: { runId, userId, userName, totalRaised },
    //   update: { totalRaised },
    // });

    console.log('[Leaderboard Submit]:', { runId, userId, userName });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Leaderboard Submit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

