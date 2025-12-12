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
  // Mic mute state - mic always captures, this just controls if audio is sent
  const [isMuted, setIsMuted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Connection refs
  const elevenLabsRef = useRef<ElevenLabsConnection | null>(null);
  const anamRef = useRef<AnamConnection | null>(null);
  const audioPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCleanedUp = useRef(false);
  // Track mute state for use in callbacks (avoids stale closure)
  const isMutedRef = useRef(false);
  // Ref to call handleEndStage from timer without dependency issues
  const handleEndStageRef = useRef<() => void>(() => {});
  // Track if we've received audio for the current agent response
  const audioReceivedForCurrentResponse = useRef(false);

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
        
        // Reset audio tracking
        audioReceivedForCurrentResponse.current = false;
        
        // Small delay to ensure any previous microphone is fully released
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!mounted) return;
        
        // Initialize audio player for playing AI voice
        audioPlayerRef.current = createAudioPlayer();
        console.log('[LIVE] Audio player created');
        
        // Initialize Anam avatar (handles video + lip-sync)
        console.log('[LIVE] Initializing Anam...');
        anamRef.current = await initializeAnam(anamSessionToken!, 'anam-video');
        console.log('[LIVE] Anam initialized and ready');
        
        // Small delay to ensure Anam video element is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!mounted) return;
        
        // Connect to ElevenLabs
        console.log('[LIVE] Connecting to ElevenLabs...');
        elevenLabsRef.current = await connectElevenLabs(agentId!, {
          onReady: () => {
            if (!mounted) return;
            console.log('[LIVE] ElevenLabs ready - mic always capturing, VAD enabled');
            setStatus('thinking'); // Show "thinking" while AI prepares to speak
            
            // Trigger AI to start speaking immediately
            // Ensure Anam is ready before triggering
            setTimeout(() => {
              if (elevenLabsRef.current && anamRef.current && mounted) {
                console.log('[LIVE] Both ElevenLabs and Anam ready - triggering AI greeting');
                elevenLabsRef.current.triggerGreeting();
              } else {
                console.warn('[LIVE] Cannot trigger greeting - missing refs:', {
                  elevenLabs: !!elevenLabsRef.current,
                  anam: !!anamRef.current,
                  mounted
                });
              }
            }, 500);
          },
          
          onAudio: (base64Audio) => {
            if (!mounted) return;
            audioReceivedForCurrentResponse.current = true;
            setStatus('speaking');
            
            // Auto-mute user mic when agent is speaking (prevents feedback)
            if (!isMutedRef.current) {
              setIsMuted(true);
              isMutedRef.current = true;
              elevenLabsRef.current?.setMuted(true);
              console.log('[LIVE] Agent speaking - user mic auto-muted');
            }
            
            // Forward audio to Anam for lip-sync AND audio playback
            // Anam handles both video + audio through the video element
            if (anamRef.current) {
              try {
                anamRef.current.sendAudioChunk(base64Audio);
              } catch (e) {
                console.error('[LIVE] Error sending audio to Anam:', e);
                // Fallback: play audio directly if Anam fails
                audioPlayerRef.current?.playChunk(base64Audio);
              }
            } else {
              console.warn('[LIVE] Anam not connected - using fallback audio player');
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
            console.log('[LIVE] Agent response received:', text.substring(0, 50) + '...');
            
            // Check if we received audio for this response
            if (!audioReceivedForCurrentResponse.current) {
              console.warn('[LIVE] ⚠️ Agent response received but NO audio chunks were received! This may indicate an issue.');
            } else {
              console.log('[LIVE] ✓ Agent response received with audio chunks');
            }
            
            // Reset flag for next response
            audioReceivedForCurrentResponse.current = false;
            
            // End audio sequence when agent finishes
            if (anamRef.current) {
              try {
                anamRef.current.endSequence();
              } catch (e) {
                console.error('[LIVE] Error ending Anam sequence:', e);
              }
            }
            
            setStatus('listening');
            
            // Agent finished - auto-unmute mic so user can speak
            // ElevenLabs VAD will detect when user starts talking
            if (elevenLabsRef.current) {
              setIsMuted(false);
              isMutedRef.current = false;
              elevenLabsRef.current.setMuted(false);
              console.log('[LIVE] Agent finished - mic unmuted, VAD will detect your speech');
            }
            
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

  // Handle mic mute toggle - mic always captures, this just controls if audio is sent
  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState;
    
    // Toggle audio stream to ElevenLabs
    if (elevenLabsRef.current) {
      elevenLabsRef.current.setMuted(newMutedState);
    }
    
    console.log('[LIVE] Mic muted:', newMutedState);
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

  // Calculate timer progress for visual indicator
  const timerProgress = currentStage ? (timeRemaining / currentStage.timeLimitSec) * 100 : 100;

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden relative">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header - glassmorphism */}
      <header className="flex-shrink-0 relative z-10 flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-xl border-b border-white/10">
        {/* Stage info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-orange-600/10 rounded-full border border-orange-500/20">
            <span className="text-orange-400 text-xs font-bold">STAGE {stageIndex + 1}</span>
          </div>
          <span className="text-white font-semibold tracking-tight">{currentStage.name}</span>
        </div>
        
        {/* Timer - prominent display */}
        <div className="flex items-center gap-3">
          <div className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
            timeRemaining <= 10 
              ? 'bg-red-500/20 border border-red-500/30' 
              : 'bg-white/5 border border-white/10'
          }`}>
            {/* Progress bar behind timer */}
            <div 
              className={`absolute left-0 top-0 h-full rounded-2xl transition-all duration-1000 ${
                timeRemaining <= 10 ? 'bg-red-500/20' : 'bg-orange-500/10'
              }`}
              style={{ width: `${timerProgress}%` }}
            />
            <span className={`relative text-2xl font-mono font-bold tracking-wider ${
              timeRemaining <= 10 ? 'text-red-400' : 'text-white'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-white/70 text-xs font-medium uppercase tracking-wider">{getStatusText()}</span>
        </div>
      </header>

      {/* Connection error banner */}
      {connectionError && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-500/10 backdrop-blur border-b border-red-500/20">
          <p className="text-red-400 text-xs text-center font-medium">⚠️ {connectionError}</p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative z-10">
        {/* Video/Avatar area */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-0">
          <div className="relative w-full max-w-2xl aspect-video group">
            {/* Glow effect behind video */}
            <div className={`absolute -inset-1 rounded-2xl blur-xl transition-all duration-500 ${
              status === 'speaking' 
                ? 'bg-gradient-to-r from-orange-500/40 to-purple-500/40 animate-pulse' 
                : 'bg-gradient-to-r from-orange-500/20 to-purple-500/20'
            }`} />
            
            {/* Video container */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <video
                id="anam-video"
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={false}
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              
              {/* Connecting placeholder */}
              {status === 'connecting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-4 text-white/60 text-sm font-medium">Connecting to investor...</p>
                </div>
              )}

              {/* Demo mode placeholder */}
              {(status !== 'connecting' && !anamRef.current) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="text-center">
                    <div className={`relative w-24 h-24 mx-auto mb-4 ${status === 'speaking' ? 'animate-pulse' : ''}`}>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 blur-lg opacity-50" />
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
                        <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-white font-semibold">AI Investor</p>
                    <p className="text-white/40 text-xs mt-1">Demo Mode</p>
                  </div>
                </div>
              )}

              {/* Speaking indicator overlay */}
              {status === 'speaking' && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-white text-xs font-medium">Speaking</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transcript panel - glassmorphism */}
        <div className="hidden lg:flex lg:w-80 bg-white/5 backdrop-blur-xl border-l border-white/10 flex-col min-h-0">
          <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm tracking-wide">Live Transcript</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcript.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-white/40 text-sm">Conversation will appear here...</p>
              </div>
            ) : (
              transcript.map((turn, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${turn.speaker === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
                >
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    turn.speaker === 'user' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {turn.speaker === 'user' ? 'Y' : 'VC'}
                  </div>
                  <div className={`flex-1 px-3 py-2 rounded-xl text-sm ${
                    turn.speaker === 'user' 
                      ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-white border border-orange-500/20' 
                      : 'bg-white/5 text-white/90 border border-white/5'
                  }`}>
                    {turn.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Objective - compact */}
          <div className="flex-shrink-0 p-3 border-t border-white/10 bg-gradient-to-r from-orange-500/5 to-purple-500/5">
            <p className="text-orange-400/80 text-xs font-semibold uppercase tracking-wider mb-1">Objective</p>
            <p className="text-white/60 text-xs leading-relaxed">{currentStage.objective}</p>
          </div>
        </div>
      </div>

      {/* Controls - sleek footer */}
      <footer className="flex-shrink-0 relative z-10 flex items-center justify-center gap-6 px-4 py-4 bg-gradient-to-t from-slate-950 to-transparent">
        {/* Mic mute button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleMuteToggle}
            disabled={status === 'speaking'}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isMuted 
                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
          >
            {/* Pulse rings when muted */}
            {isMuted && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                <span className="absolute -inset-2 rounded-full border-2 border-red-500/50 animate-pulse" />
              </>
            )}
            
            {isMuted ? (
              /* Muted - show crossed out mic */
              <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              /* Unmuted - show regular mic */
              <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <span className={`text-xs font-medium ${isMuted ? 'text-red-400' : 'text-white/50'}`}>
            {isMuted ? 'Muted' : 'Listening'}
          </span>
        </div>

        {/* End button */}
        <button
          onClick={handleEndStage}
          disabled={isEnding}
          className="h-10 px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium rounded-full transition-all disabled:opacity-50"
        >
          {isEnding ? 'Ending...' : 'End Stage'}
        </button>
      </footer>
    </div>
  );
}
