/**
 * ElevenLabs WebSocket Service
 * 
 * Handles real-time voice conversations with ElevenLabs Agents.
 * Reference: https://elevenlabs.io/docs/agents-platform/api-reference/agents-platform/websocket
 */

import { MicrophoneCapture, arrayBufferToBase64 } from 'chatdio';

const SAMPLE_RATE = 16000;
const WS_BASE_URL = 'wss://api.elevenlabs.io/v1/convai/conversation';

export interface ElevenLabsCallbacks {
  onReady?: () => void;
  onAudio?: (base64Audio: string, eventId?: number) => void;
  onUserTranscript?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
  onInterrupt?: (eventId?: number) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onConversationInit?: (conversationId: string) => void;
}

export interface ElevenLabsConnection {
  ws: WebSocket;
  mic: MicrophoneCapture;
  disconnect: () => void;
  sendUserMessage: (text: string) => void;
  setMuted: (muted: boolean) => void;
}

/**
 * Connect to ElevenLabs Agents WebSocket
 * Handles microphone capture and message routing
 */
export async function connectElevenLabs(
  agentId: string,
  callbacks: ElevenLabsCallbacks
): Promise<ElevenLabsConnection> {
  const wsUrl = `${WS_BASE_URL}?agent_id=${agentId}`;
  const ws = new WebSocket(wsUrl);
  
  // Track if we've already cleaned up to prevent double-stop
  let isDisconnected = false;
  // Start muted - push-to-talk mode, user clicks to record
  let isMuted = true;
  
  // Set up microphone capture with echo cancellation
  const mic = new MicrophoneCapture({
    sampleRate: SAMPLE_RATE,
    echoCancellation: true,
    noiseSuppression: true,
  });

  // Track audio sending for debugging
  let audioChunkCount = 0;
  
  // Stream mic audio to WebSocket (only when not muted)
  mic.on('data', (data: ArrayBuffer) => {
    if (ws.readyState === WebSocket.OPEN && !isDisconnected && !isMuted) {
      audioChunkCount++;
      // Log every 50th chunk to show audio is being sent
      if (audioChunkCount % 50 === 1) {
        console.log(`[ElevenLabs] Sending user audio chunk #${audioChunkCount}, size: ${data.byteLength} bytes`);
      }
      ws.send(
        JSON.stringify({
          user_audio_chunk: arrayBufferToBase64(data),
        })
      );
    }
  });

  // Mute control - allows pausing audio input without stopping the mic
  const setMuted = (muted: boolean) => {
    isMuted = muted;
    console.log('[ElevenLabs] Mic muted:', muted);
  };

  mic.on('error', (error: Error) => {
    console.error('[ElevenLabs] Microphone error:', error);
    callbacks.onError?.(error);
  });

  // Cleanup function that only runs once
  const cleanupOnce = () => {
    if (isDisconnected) {
      console.log('[ElevenLabs] Already disconnected, skipping cleanup');
      return;
    }
    isDisconnected = true;
    
    console.log('[ElevenLabs] Closing connection and stopping microphone...');
    
    // Remove event listeners to prevent further data sending
    try {
      if (typeof mic.removeAllListeners === 'function') {
        mic.removeAllListeners('data');
        mic.removeAllListeners('error');
        console.log('[ElevenLabs] Removed mic event listeners');
      }
    } catch (e) {
      console.warn('[ElevenLabs] Error removing listeners:', e);
    }
    
    // Stop microphone
    try {
      mic.stop();
      console.log('[ElevenLabs] Microphone stopped');
    } catch (e) {
      console.warn('[ElevenLabs] Error stopping mic:', e);
    }
    
    // Close WebSocket with normal closure code
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      console.log('[ElevenLabs] Closing WebSocket (state:', ws.readyState, ')');
      ws.close(1000, 'Stage ended'); // 1000 = normal closure
    } else {
      console.log('[ElevenLabs] WebSocket already closed (state:', ws.readyState, ')');
    }
  };

  return new Promise((resolve, reject) => {
    ws.onopen = async () => {
      console.log('[ElevenLabs] WebSocket connected');
      try {
        await mic.start();
        console.log('[ElevenLabs] Microphone started');
        callbacks.onReady?.();
        
        resolve({
          ws,
          mic,
          disconnect: cleanupOnce,
          sendUserMessage: (text: string) => sendUserMessage(ws, text),
          setMuted,
        });
      } catch (error) {
        console.error('[ElevenLabs] Failed to start microphone:', error);
        callbacks.onError?.(error as Error);
        reject(error);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg, ws, callbacks);
      } catch (error) {
        console.error('[ElevenLabs] Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[ElevenLabs] WebSocket error:', error);
      callbacks.onError?.(new Error('WebSocket connection error'));
      reject(new Error('WebSocket connection error'));
    };

    ws.onclose = (event) => {
      console.log('[ElevenLabs] WebSocket closed:', event.code, event.reason);
      // Don't call mic.stop() here - let cleanupOnce handle it
      // This prevents double-stop which can corrupt mic state
      if (!isDisconnected) {
        isDisconnected = true;
        try {
          mic.stop();
        } catch (e) {
          // Ignore - mic might already be stopped
        }
      }
      callbacks.onDisconnect?.();
    };

    // Timeout for connection
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket connection timeout'));
      }
    }, 10000);
  });
}

/**
 * Handle incoming messages from ElevenLabs
 */
function handleMessage(
  msg: Record<string, unknown>,
  ws: WebSocket,
  callbacks: ElevenLabsCallbacks
) {
  const type = msg.type as string;

  switch (type) {
    case 'conversation_initiation_metadata': {
      const metadata = msg.conversation_initiation_metadata_event as {
        conversation_id?: string;
      };
      if (metadata?.conversation_id) {
        console.log('[ElevenLabs] Conversation started:', metadata.conversation_id);
        callbacks.onConversationInit?.(metadata.conversation_id);
      }
      break;
    }

    case 'audio': {
      const audioEvent = msg.audio_event as {
        audio_base_64?: string;
        event_id?: number;
      };
      if (audioEvent?.audio_base_64) {
        callbacks.onAudio?.(audioEvent.audio_base_64, audioEvent.event_id);
      }
      break;
    }

    case 'agent_response': {
      const responseEvent = msg.agent_response_event as {
        agent_response?: string;
      };
      if (responseEvent?.agent_response) {
        console.log('[ElevenLabs] Agent response:', responseEvent.agent_response);
        callbacks.onAgentResponse?.(responseEvent.agent_response);
      }
      break;
    }

    case 'user_transcript': {
      const transcriptEvent = msg.user_transcription_event as {
        user_transcript?: string;
      };
      if (transcriptEvent?.user_transcript) {
        console.log('[ElevenLabs] User transcript:', transcriptEvent.user_transcript);
        callbacks.onUserTranscript?.(transcriptEvent.user_transcript);
      }
      break;
    }

    case 'interruption': {
      const interruptEvent = msg.interruption_event as {
        event_id?: number;
      };
      console.log('[ElevenLabs] Interruption detected');
      callbacks.onInterrupt?.(interruptEvent?.event_id);
      break;
    }

    case 'ping': {
      // Respond to ping with pong to keep connection alive
      const pingEvent = msg.ping_event as {
        event_id?: number;
      };
      if (pingEvent?.event_id !== undefined) {
        ws.send(
          JSON.stringify({
            type: 'pong',
            event_id: pingEvent.event_id,
          })
        );
      }
      break;
    }

    case 'agent_response_correction': {
      // Handle corrected responses if needed
      const correctionEvent = msg.agent_response_correction_event as {
        original_agent_response?: string;
        corrected_agent_response?: string;
      };
      if (correctionEvent?.corrected_agent_response) {
        console.log('[ElevenLabs] Response corrected:', correctionEvent.corrected_agent_response);
      }
      break;
    }

    case 'internal_tentative_agent_response': {
      // Tentative response (can be used for UI feedback)
      break;
    }

    case 'vad_score': {
      // Voice activity detection score (can be used for UI feedback)
      break;
    }

    default:
      console.log('[ElevenLabs] Unknown message type:', type);
  }
}

/**
 * Send a text message to the agent (alternative to voice)
 */
function sendUserMessage(ws: WebSocket, text: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'user_message',
        text,
      })
    );
  }
}
