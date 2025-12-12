/**
 * Anam Avatar Service
 * 
 * Handles avatar rendering with audio passthrough for lip-sync.
 * Reference: https://docs.anam.ai
 */

import { createClient, AnamClient, AgentAudioInputStream } from '@anam-ai/js-sdk';

export interface AnamConnection {
  client: AnamClient;
  audioInputStream: AgentAudioInputStream;
  disconnect: () => void;
  sendAudioChunk: (base64Audio: string) => void;
  endSequence: () => void;
}

/**
 * Initialize Anam avatar with audio passthrough mode
 * 
 * @param sessionToken - Token from backend with enableAudioPassthrough: true
 * @param videoElementId - ID of the <video> element to stream to
 */
export async function initializeAnam(
  sessionToken: string,
  videoElementId: string
): Promise<AnamConnection> {
  console.log('[Anam] Initializing client with session token...');
  
  // Create client with input audio disabled (ElevenLabs handles mic)
  const client = createClient(sessionToken, {
    disableInputAudio: true,
  });
  console.log('[Anam] Client created');

  // Stream avatar to video element
  const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
  if (!videoElement) {
    throw new Error(`[Anam] Video element '${videoElementId}' not found`);
  }
  console.log('[Anam] Found video element, streaming...');
  
  await client.streamToVideoElement(videoElementId);
  console.log('[Anam] Avatar streaming to video element');

  // Create audio input stream for lip-sync
  // ElevenLabs sends PCM16LE at 16kHz mono
  console.log('[Anam] Creating audio input stream for lip-sync...');
  const audioInputStream = client.createAgentAudioInputStream({
    encoding: 'pcm_s16le',
    sampleRate: 16000,
    channels: 1,
  });
  console.log('[Anam] Audio input stream created successfully');

  // Track audio chunks for debugging
  let anamChunkCount = 0;
  
  return {
    client,
    audioInputStream,
    disconnect: () => disconnectAnam(client),
    sendAudioChunk: (base64Audio: string) => {
      anamChunkCount++;
      // Log every 20th chunk to show audio is being sent to Anam
      if (anamChunkCount % 20 === 1) {
        console.log(`[Anam] Sending audio chunk #${anamChunkCount} for lip-sync, size: ${base64Audio.length} chars`);
      }
      try {
        audioInputStream.sendAudioChunk(base64Audio);
      } catch (e) {
        console.error('[Anam] Error sending audio chunk:', e);
      }
    },
    endSequence: () => {
      console.log('[Anam] Ending audio sequence');
      audioInputStream.endSequence();
    },
  };
}

/**
 * Clean up Anam client
 */
function disconnectAnam(client: AnamClient) {
  console.log('[Anam] Disconnecting...');
  try {
    // The client doesn't have a direct disconnect method
    // But we should clean up any resources
    // The connection will be closed when the component unmounts
  } catch (e) {
    console.warn('[Anam] Error during disconnect:', e);
  }
}

/**
 * Play audio locally (optional - for hearing the agent)
 * This is useful if you want the user to hear the agent's voice
 * while Anam lip-syncs to it
 */
export function createAudioPlayer(): {
  playChunk: (base64Audio: string) => void;
  stop: () => void;
} {
  let audioContext: AudioContext | null = null;
  let nextPlayTime = 0;
  const SAMPLE_RATE = 16000;

  return {
    playChunk: (base64Audio: string) => {
      try {
        if (!audioContext) {
          audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        }

        // Decode base64 to ArrayBuffer
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert PCM16 to Float32
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768;
        }

        // Create audio buffer
        const audioBuffer = audioContext.createBuffer(1, float32.length, SAMPLE_RATE);
        audioBuffer.copyToChannel(float32, 0);

        // Schedule playback
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        const currentTime = audioContext.currentTime;
        if (nextPlayTime < currentTime) {
          nextPlayTime = currentTime;
        }

        source.start(nextPlayTime);
        nextPlayTime += audioBuffer.duration;
      } catch (e) {
        console.error('[AudioPlayer] Error playing chunk:', e);
      }
    },
    stop: () => {
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
      nextPlayTime = 0;
    },
  };
}

