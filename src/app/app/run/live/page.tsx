'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRunStore } from '@/lib/runStore';
import { api, Turn } from '@/lib/api';
import { STAGES, getStageIndex } from '@/lib/stages';
import { connectElevenLabs, ElevenLabsConnection } from '@/services/elevenlabsWs';
import { initializeAnam, AnamConnection, createAudioPlayer } from '@/services/anam';

type StatusIndicator = 'connecting' | 'listening' | 'speaking' | 'thinking' | 'disconnected';

export default function LivePage() {
  const router = useRouter();
  const {
    state,
    currentStageId,
    runId,
    agentId,
    anamSessionToken,
    transcript,
    addTranscriptTurn,
    completeStage,
  } = useRunStore();

  const currentStage = currentStageId 
    ? STAGES.find((s) => s.id === currentStageId) 
    : null;
  
  const stageIndex = currentStageId ? getStageIndex(currentStageId) : 0;

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(currentStage?.timeLimitSec ?? 60);
  const [status, setStatus] = useState<StatusIndicator>('connecting');
  // Push-to-talk: Start NOT recording, user clicks to record
  const [isRecording, setIsRecording] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Connection refs
  const elevenLabsRef = useRef<ElevenLabsConnection | null>(null);
  const anamRef = useRef<AnamConnection | null>(null);
  const audioPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCleanedUp = useRef(false);
  // Track recording state for use in callbacks (avoids stale closure)
  const isRecordingRef = useRef(false);
  // Ref to call handleEndStage from timer without dependency issues
  const handleEndStageRef = useRef<() => void>(() => {});

  // Cleanup function - runs on unmount or when connections need to be closed
  const cleanup = useCallback(() => {
    if (hasCleanedUp.current) {
      console.log('[LIVE] Already cleaned up, skipping');
      return;
    }
    hasCleanedUp.current = true;
    
    console.log('[LIVE] Running cleanup...');
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Close ElevenLabs WebSocket and stop microphone
    if (elevenLabsRef.current) {
      console.log('[LIVE] Cleanup: Closing ElevenLabs WebSocket');
      elevenLabsRef.current.disconnect();
      elevenLabsRef.current = null;
    }

    // End Anam audio sequence and disconnect
    if (anamRef.current) {
      console.log('[LIVE] Cleanup: Closing Anam connection');
      anamRef.current.endSequence();
      anamRef.current.disconnect();
      anamRef.current = null;
    }

    // Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
    }

    setStatus('disconnected');
  }, []);

  // End stage handler
  const handleEndStage = useCallback(async () => {
    if (isEnding) {
      console.log('[LIVE] Already ending, ignoring duplicate call');
      return;
    }
    setIsEnding(true);

    console.log('[LIVE] === ENDING STAGE ===');
    console.log('[LIVE] ElevenLabs ref exists:', !!elevenLabsRef.current);
    console.log('[LIVE] Anam ref exists:', !!anamRef.current);

    // Stop timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('[LIVE] Timer stopped');
    }

    // Explicitly close ElevenLabs WebSocket connection and stop microphone
    if (elevenLabsRef.current) {
      console.log('[LIVE] Calling ElevenLabs disconnect (stops mic + closes WS)...');
      try {
        elevenLabsRef.current.disconnect();
        console.log('[LIVE] ElevenLabs disconnect() called successfully');
      } catch (e) {
        console.error('[LIVE] Error disconnecting ElevenLabs:', e);
      }
      elevenLabsRef.current = null;
    } else {
      console.warn('[LIVE] ElevenLabs ref was already null!');
    }

    // End Anam session
    if (anamRef.current) {
      console.log('[LIVE] Disconnecting Anam...');
      try {
        anamRef.current.endSequence();
        anamRef.current.disconnect();
        console.log('[LIVE] Anam disconnected');
      } catch (e) {
        console.error('[LIVE] Error disconnecting Anam:', e);
      }
      anamRef.current = null;
    }

    // Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
      console.log('[LIVE] Audio player stopped');
    }

    // Mark as cleaned up
    hasCleanedUp.current = true;
    setStatus('disconnected');
    console.log('[LIVE] Cleanup complete, microphone should be stopped');

    // Small delay to ensure connections are fully closed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Submit transcript and get results
    try {
      if (runId && currentStageId) {
        console.log('[LIVE] Submitting transcript for scoring...');
        const result = await api.completeStage({
          runId,
          stageId: currentStageId,
          transcript,
        });
        completeStage(result);
      }
    } catch (error) {
      console.error('Failed to complete stage:', error);
      // Create a basic result so user can continue
      completeStage({
        stars: 3,
        moneyRaised: 500000,
        feedback: ['Stage completed - scoring unavailable'],
        passFail: 'pass',
        totalRaised: 500000,
      });
    }

    console.log('[LIVE] Navigating to results...');
    router.push('/app/run/result');
  }, [isEnding, runId, currentStageId, transcript, completeStage, router]);

  // Keep ref updated for timer to use
  handleEndStageRef.current = handleEndStage;

  // Initialize connections
  useEffect(() => {
    // Reset cleanup flag on mount so cleanup can run again
    hasCleanedUp.current = false;
    
    if (!currentStage) {
      console.log('[LIVE] No current stage');
      return;
    }
    
    if (!agentId || !anamSessionToken) {
      console.log('[LIVE] Missing agentId or anamSessionToken - check environment config');
      setConnectionError('Session not properly initialized. Please go back and try again.');
      setStatus('disconnected');
      return;
    }

    let mounted = true;

    async function initConnections() {
      try {
        setStatus('connecting');
        
        // Small delay to ensure any previous microphone is fully released
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!mounted) return;
        
        // Initialize audio player for playing AI voice
        audioPlayerRef.current = createAudioPlayer();
        console.log('[LIVE] Audio player created');
        
        // Initialize Anam avatar (handles video + lip-sync)
        console.log('[LIVE] Initializing Anam...');
        anamRef.current = await initializeAnam(anamSessionToken!, 'anam-video');
        
        // Connect to ElevenLabs
        console.log('[LIVE] Connecting to ElevenLabs...');
        elevenLabsRef.current = await connectElevenLabs(agentId!, {
          onReady: () => {
            if (!mounted) return;
            console.log('[LIVE] ElevenLabs ready');
            setStatus('listening');
          },
          
          onAudio: (base64Audio) => {
            if (!mounted) return;
            setStatus('speaking');
            
            // Auto-stop recording when agent is speaking (push-to-talk)
            if (isRecordingRef.current) {
              setIsRecording(false);
              isRecordingRef.current = false;
              elevenLabsRef.current?.setMuted(true);
              console.log('[LIVE] Agent speaking - recording auto-stopped');
            }
            
            // Forward audio to Anam for lip-sync AND audio playback
            // Anam handles both video + audio through the video element
            if (anamRef.current) {
              anamRef.current.sendAudioChunk(base64Audio);
            } else {
              // Fallback: play audio directly if Anam not connected
              audioPlayerRef.current?.playChunk(base64Audio);
            }
          },
          
          onUserTranscript: (text) => {
            if (!mounted) return;
            addTranscriptTurn({
              speaker: 'user',
              text,
              timestamp: Date.now(),
            });
          },
          
          onAgentResponse: (text) => {
            if (!mounted) return;
            // End audio sequence when agent finishes
            anamRef.current?.endSequence();
            setStatus('listening');
            
            // Agent finished - user can now click to record their response
            console.log('[LIVE] Agent finished speaking - click mic to record your response');
            
            addTranscriptTurn({
              speaker: 'agent',
              text,
              timestamp: Date.now(),
            });
          },
          
          onInterrupt: () => {
            if (!mounted) return;
            // Handle barge-in - end current lip-sync
            anamRef.current?.endSequence();
            setStatus('listening');
          },
          
          onError: (error) => {
            console.error('[LIVE] Connection error:', error);
            if (!mounted) return;
            setConnectionError(error.message);
          },
          
          onDisconnect: () => {
            if (!mounted) return;
            setStatus('disconnected');
          },
        });
        
      } catch (error) {
        console.error('[LIVE] Failed to initialize:', error);
        if (mounted) {
          setConnectionError((error as Error).message);
          setStatus('disconnected');
        }
      }
    }

    initConnections();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [currentStage, agentId, anamSessionToken, addTranscriptTurn, cleanup]);

  // Initialize timer - only depends on currentStage, not handleEndStage
  useEffect(() => {
    if (!currentStage) return;

    setTimeRemaining(currentStage.timeLimitSec);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer hit 0 - end stage via ref to avoid dependency issues
          handleEndStageRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentStage]); // Only re-run when stage changes, not when handleEndStage changes

  // Redirect if not in LIVE state
  useEffect(() => {
    if (state !== 'LIVE') {
      router.push('/app/run');
    }
  }, [state, router]);

  // Handle push-to-talk: click to start/stop recording
  const handleRecordToggle = () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    isRecordingRef.current = newRecordingState;
    
    // Toggle audio stream to ElevenLabs (muted = NOT recording)
    if (elevenLabsRef.current) {
      elevenLabsRef.current.setMuted(!newRecordingState);
    }
    
    console.log('[LIVE] Recording:', newRecordingState ? 'STARTED' : 'STOPPED');
  };

  if (!currentStage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-8 h-8 border-2 border-yc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'listening': return 'Listening';
      case 'speaking': return 'Speaking';
      case 'thinking': return 'Thinking...';
      case 'disconnected': return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting': return 'bg-yellow-500';
      case 'listening': return 'bg-green-500 animate-pulse';
      case 'speaking': return 'bg-yc-orange animate-pulse';
      case 'thinking': return 'bg-blue-500 animate-pulse';
      case 'disconnected': return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">Stage {stageIndex + 1}</span>
          <span className="text-white font-medium">{currentStage.name}</span>
        </div>
        
        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
          timeRemaining <= 10 ? 'bg-red-500/20' : 'bg-white/10'
        }`}>
          <svg className={`w-5 h-5 ${timeRemaining <= 10 ? 'text-red-500' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-2xl font-mono font-bold ${
            timeRemaining <= 10 ? 'text-red-500' : 'text-white'
          }`}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-white/60 text-sm">{getStatusText()}</span>
        </div>
      </header>

      {/* Connection error banner */}
      {connectionError && (
        <div className="px-6 py-3 bg-red-500/20 border-b border-red-500/30">
          <p className="text-red-400 text-sm text-center">
            Connection error: {connectionError}. Running in demo mode.
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video/Avatar area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            {/* Video element for Anam avatar */}
            <video
              id="anam-video"
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted={false}
            />
            
            {/* Placeholder when video not ready */}
            {status === 'connecting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 animate-pulse">
                  <svg className="w-12 h-12 text-yc-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-white/60">Connecting to investor...</p>
              </div>
            )}

            {/* Demo avatar placeholder when not connected */}
            {(status !== 'connecting' && !anamRef.current) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-orange-400/40 to-orange-600/20 flex items-center justify-center mb-4 mx-auto ${
                    status === 'speaking' ? 'animate-pulse-glow' : ''
                  }`}>
                    <svg className="w-16 h-16 text-yc-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-white font-medium">AI Investor</p>
                  <p className="text-white/40 text-sm">Demo Mode</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript panel */}
        <div className="lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-white/80 font-medium">Transcript</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px] lg:max-h-none">
            {transcript.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">
                Conversation will appear here...
              </p>
            ) : (
              transcript.map((turn, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${turn.speaker === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    turn.speaker === 'user' ? 'bg-yc-orange' : 'bg-white/10'
                  }`}>
                    {turn.speaker === 'user' ? (
                      <span className="text-white text-xs font-bold">You</span>
                    ) : (
                      <span className="text-white/60 text-xs font-bold">VC</span>
                    )}
                  </div>
                  <div className={`flex-1 p-3 rounded-xl ${
                    turn.speaker === 'user' 
                      ? 'bg-orange-500/20 text-white' 
                      : 'bg-white/10 text-white/90'
                  }`}>
                    <p className="text-sm">{turn.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Objective reminder */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <p className="text-white/40 text-xs mb-1">Objective</p>
            <p className="text-white/80 text-sm">{currentStage.objective}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <footer className="flex items-center justify-center gap-4 px-6 py-6 border-t border-white/10">
        {/* Push-to-talk record button */}
        <button
          onClick={handleRecordToggle}
          disabled={status === 'speaking'}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/50' 
              : 'bg-white/10 hover:bg-white/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            /* Recording - show stop icon */
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            /* Not recording - show mic icon */
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
        
        {/* Recording indicator text */}
        <span className={`text-sm ${isRecording ? 'text-red-400' : 'text-white/60'}`}>
          {isRecording ? 'Recording... Click to stop' : 'Click mic to speak'}
        </span>

        {/* End early */}
        <button
          onClick={handleEndStage}
          disabled={isEnding}
          className="h-14 px-6 bg-red-500/20 text-red-400 font-medium rounded-full hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {isEnding ? 'Ending...' : 'End Stage Early'}
        </button>
      </footer>
    </div>
  );
}
