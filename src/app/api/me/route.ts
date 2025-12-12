import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface MeResponse {
  credits: number;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

// TODO: Replace with database lookup
// For now, all users start with 5 credits
const DEFAULT_CREDITS = 5;

/**
 * GET /api/me
 * 
 * Returns current user info and credits balance.
 * In production, this would lookup credits from database.
 */
export async function GET() {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: Get credits from database
    // const userRecord = await db.users.findUnique({ where: { clerkId: userId } });
    // const credits = userRecord?.credits ?? DEFAULT_CREDITS;
    const credits = DEFAULT_CREDITS;

    const response: MeResponse = {
      credits,
      user: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

