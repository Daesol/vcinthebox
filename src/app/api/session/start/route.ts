import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { STAGES, getStageById } from '@/lib/stages';

// ElevenLabs Agent IDs for each stage
// TODO: Replace with your actual agent IDs from ElevenLabs dashboard
const STAGE_AGENT_IDS: Record<string, string> = {
  'mom': process.env.ELEVENLABS_AGENT_MOM || '',
  'local-angel': process.env.ELEVENLABS_AGENT_ANGEL || '',
  'vc-single': process.env.ELEVENLABS_AGENT_VC || '',
  'yc-traction': process.env.ELEVENLABS_AGENT_YC || '',
  'shark-tank': process.env.ELEVENLABS_AGENT_SHARK || '',
};

const ANAM_API_KEY = process.env.ANAM_API_KEY;

interface SessionStartRequest {
  stageId: string;
}

interface SessionStartResponse {
  agentId: string;
  anamSessionToken: string;
  runId: string;
}

/**
 * POST /api/session/start
 * 
 * Creates a new session for a stage:
 * 1. Validates user is authenticated
 * 2. Gets the ElevenLabs agent ID for the stage
 * 3. Creates an Anam session token with the stage-specific avatar
 * 4. Returns session data to client
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
    const body = await request.json() as SessionStartRequest;
    const { stageId } = body;

    if (!stageId) {
      return NextResponse.json(
        { error: 'stageId is required' },
        { status: 400 }
      );
    }

    // Get stage config (includes avatar ID)
    const stage = getStageById(stageId);
    if (!stage) {
      return NextResponse.json(
        { error: 'Invalid stageId' },
        { status: 400 }
      );
    }

    // Get agent ID for this stage
    const agentId = STAGE_AGENT_IDS[stageId];
    if (!agentId) {
      console.warn(`[Session] No agent ID configured for stage: ${stageId}`);
    }

    // Create Anam session token with stage-specific avatar
    let anamSessionToken = '';
    
    if (ANAM_API_KEY && stage.avatarId) {
      try {
        console.log(`[Session] Creating Anam session for avatar: ${stage.avatarId}`);
        
        const anamResponse = await fetch('https://api.anam.ai/v1/auth/session-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANAM_API_KEY}`,
          },
          body: JSON.stringify({
            personaConfig: {
              avatarId: stage.avatarId,
              enableAudioPassthrough: true, // Required for ElevenLabs integration
            },
          }),
        });

        if (!anamResponse.ok) {
          const errorText = await anamResponse.text();
          console.error('[Session] Anam API error:', anamResponse.status, errorText);
          throw new Error(`Anam API error: ${anamResponse.status}`);
        }

        const anamData = await anamResponse.json();
        anamSessionToken = anamData.sessionToken;
        console.log('[Session] Anam session token created successfully');
      } catch (error) {
        console.error('[Session] Failed to create Anam session:', error);
        // Continue without Anam - will show placeholder in UI
      }
    } else {
      console.warn('[Session] ANAM_API_KEY not configured or no avatarId for stage');
    }

    // Generate run ID
    const runId = `run_${userId}_${Date.now()}`;

    // TODO: Store run in database
    // await db.runs.create({ runId, userId, stageId, startedAt: new Date() });

    const response: SessionStartResponse = {
      agentId: agentId || '',
      anamSessionToken,
      runId,
    };

    console.log('[Session] Started:', { 
      runId, 
      stageId, 
      stageName: stage.name,
      avatarId: stage.avatarId,
      hasAgentId: !!agentId, 
      hasAnamToken: !!anamSessionToken 
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Session] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
