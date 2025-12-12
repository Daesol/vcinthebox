\# ElevenLabs Agents

\> Add visual AI avatars to ElevenLabs Conversational AI agents using Anam's audio passthrough mode.

\<Note\>\*\*Beta Feature\*\*: The ElevenLabs integration uses Anam's audio passthrough mode, which is currently in beta. APIs may change as we continue to improve the integration.\</Note\>

Combine \[ElevenLabs Conversational AI\](https://elevenlabs.io/conversational-ai) with Anam avatars to create engaging voice agents with real-time lip-sync. ElevenLabs handles the intelligence (speech recognition, LLM, and voice synthesis), while Anam provides the visual presence.

\<Frame\>  
  \<iframe width="560" height="315" src="https://www.youtube.com/embed/07nyP8nYzg0" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /\>  
\</Frame\>

\<Card title="View Example" icon="github" href="https://github.com/anam-org/11labs\_agent\_demo"\>  
  Full source code for the ElevenLabs conversational agent with Anam avatar.  
\</Card\>

\#\# How It Works

The integration uses Anam's \*\*audio passthrough\*\* mode, where Anam renders an avatar that lip-syncs to audio you provide—without using Anam's own AI or microphone input.

\<Frame\>  
  \<img src="https://mintcdn.com/anam/2nHPhouImh2qBLQ2/images/audio\_passthrough2.png?fit=max\&auto=format\&n=2nHPhouImh2qBLQ2\&q=85\&s=0949c9e72a7a08b380fd343989da8195" data-og-width="794" width="794" data-og-height="606" height="606" data-path="images/audio\_passthrough2.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anam/2nHPhouImh2qBLQ2/images/audio\_passthrough2.png?w=280\&fit=max\&auto=format\&n=2nHPhouImh2qBLQ2\&q=85\&s=f55ad48cfc6244af581365a10a2d6ded 280w, https://mintcdn.com/anam/2nHPhouImh2qBLQ2/images/audio\_passthrough2.png?w=560\&fit=max\&auto=format\&n=2nHPhouImh2qBLQ2\&q=85\&s=2f2f1167fb9078994f1aae980173302b 560w, https://mintcdn.com/anam/2nHPhouImh2qBLQ2/images/audio\_passthrough2.png?w=840\&fit=max\&auto=format\&n=2nHPhouImh2qBLQ2\&q=85\&s=4039ee07c4852a5e684d6ab2513f95a5 840w, https://mintcdn.com/anam/2nHPhouImh2qBLQ2/images/audio\_passthrough2.png?w=1100\&fit=max\&auto=format\&n=2nHPhouImh2qBLQ2\&q=85\&s=594f9aa223e70e3549e3b22df04197ce 1100w, https://mintcdn.com/anam/2nHPhouImh2qBLQ2/images/audio\_passthrough2.png?w=1650\&fit=max\&auto=format\&n=2nHPhouImh2qBLQ2\&q=85\&s=85fffa68cb48719c35d691edde0598e8 1650w, https://mintcdn.com/anam/2nHPhouImh2qBLQ2/images/audio\_passthrough2.png?w=2500\&fit=max\&auto=format\&n=2nHPhouImh2qBLQ2\&q=85\&s=e26e7940d055b61ef624ea0a71fa0aed 2500w" /\>  
\</Frame\>

\<Tip\>\*\*Bring Your Own Voice\*\*: ElevenLabs provides best-in-class voice synthesis. Anam adds the visual layer—so you get the best of both worlds.\</Tip\>

\#\# Quick Start

\#\#\# Prerequisites

\* \[ElevenLabs\](https://elevenlabs.io) account with a configured Conversational AI agent  
\* \[Anam\](https://anam.ai) account with API access  
\* Node.js or Bun runtime

\#\#\# Installation

\`\`\`bash  theme={"dark"}  
npm install @anam-ai/js-sdk chatdio  
\`\`\`

\#\#\# Basic Integration

Here's the core pattern for connecting ElevenLabs to Anam:

\`\`\`typescript  theme={"dark"}  
import { createClient } from "@anam-ai/js-sdk";

// 1\. Create Anam client with audio passthrough session  
const anamClient \= createClient(sessionToken, {  
  disableInputAudio: true, // ElevenLabs handles microphone  
});  
await anamClient.streamToVideoElement("video-element");

// 2\. Create agent audio input stream  
const audioInputStream \= anamClient.createAgentAudioInputStream({  
  encoding: "pcm\_s16le",  
  sampleRate: 16000,  
  channels: 1,  
});

// 3\. Connect to ElevenLabs and forward audio  
const ws \= new WebSocket(\`wss://api.elevenlabs.io/v1/convai/conversation?agent\_id=${agentId}\`);

ws.onmessage \= (event) \=\> {  
  const msg \= JSON.parse(event.data);

  if (msg.type \=== "audio" && msg.audio\_event?.audio\_base\_64) {  
    // Forward audio chunks to Anam for lip-sync  
    audioInputStream.sendAudioChunk(msg.audio\_event.audio\_base\_64);  
  }

  if (msg.type \=== "agent\_response") {  
    // Signal end of audio sequence  
    audioInputStream.endSequence();  
  }

  if (msg.type \=== "interruption") {  
    // Handle barge-in  
    audioInputStream.endSequence();  
  }  
};  
\`\`\`

\#\# Full Example

\#\#\# Project Structure

\`\`\`  
src/  
├── client.ts          \# Main client orchestration  
├── elevenlabs.ts      \# ElevenLabs WebSocket handling  
└── routes/  
    └── api/  
        └── config.ts  \# Server-side session token endpoint  
\`\`\`

\#\#\# Server: Create Anam Session

Your server creates an Anam session token with \`enableAudioPassthrough: true\`:

\`\`\`typescript config.ts theme={"dark"}  
const response \= await fetch("https://api.anam.ai/v1/auth/session-token", {  
  method: "POST",  
  headers: {  
    "Content-Type": "application/json",  
    Authorization: \`Bearer ${ANAM\_API\_KEY}\`,  
  },  
  body: JSON.stringify({  
    personaConfig: {  
      avatarId: AVATAR\_ID,  
      enableAudioPassthrough: true, // Enable external audio input  
    },  
  }),  
});

const { sessionToken } \= await response.json();  
\`\`\`

\#\#\# Client: ElevenLabs Module

Handle the WebSocket connection and microphone capture:

\`\`\`typescript elevenlabs.ts theme={"dark"}  
import { MicrophoneCapture, arrayBufferToBase64 } from "chatdio";

const SAMPLE\_RATE \= 16000;

export interface ElevenLabsCallbacks {  
  onReady?: () \=\> void;  
  onAudio?: (base64Audio: string) \=\> void;  
  onUserTranscript?: (text: string) \=\> void;  
  onAgentResponse?: (text: string) \=\> void;  
  onInterrupt?: () \=\> void;  
  onDisconnect?: () \=\> void;  
}

export async function connectElevenLabs(agentId: string, callbacks: ElevenLabsCallbacks) {  
  const ws \= new WebSocket(\`wss://api.elevenlabs.io/v1/convai/conversation?agent\_id=${agentId}\`);

  // Set up microphone capture  
  const mic \= new MicrophoneCapture({  
    sampleRate: SAMPLE\_RATE,  
    echoCancellation: true,  
    noiseSuppression: true,  
  });

  mic.on("data", (data: ArrayBuffer) \=\> {  
    if (ws.readyState \=== WebSocket.OPEN) {  
      ws.send(  
        JSON.stringify({  
          user\_audio\_chunk: arrayBufferToBase64(data),  
        })  
      );  
    }  
  });

  ws.onopen \= async () \=\> {  
    await mic.start();  
    callbacks.onReady?.();  
  };

  ws.onmessage \= (event) \=\> {  
    const msg \= JSON.parse(event.data);

    switch (msg.type) {  
      case "audio":  
        callbacks.onAudio?.(msg.audio\_event.audio\_base\_64);  
        break;  
      case "agent\_response":  
        callbacks.onAgentResponse?.(msg.agent\_response\_event.agent\_response);  
        break;  
      case "user\_transcript":  
        callbacks.onUserTranscript?.(msg.user\_transcription\_event.user\_transcript);  
        break;  
      case "interruption":  
        callbacks.onInterrupt?.();  
        break;  
      case "ping":  
        ws.send(JSON.stringify({ type: "pong", event\_id: msg.ping\_event.event\_id }));  
        break;  
    }  
  };

  ws.onclose \= () \=\> {  
    mic.stop();  
    callbacks.onDisconnect?.();  
  };  
}  
\`\`\`

\#\#\# Client: Main Integration

Wire everything together:

\`\`\`typescript client.ts theme={"dark"}  
import { createClient } from "@anam-ai/js-sdk";  
import { connectElevenLabs } from "./elevenlabs";

async function startConversation() {  
  // Get session config from your server  
  const { anamSessionToken, elevenLabsAgentId } \= await fetch("/api/config").then((r) \=\> r.json());

  // Initialize Anam avatar (disable input audio since ElevenLabs handles mic)  
  const anamClient \= createClient(anamSessionToken, {  
    disableInputAudio: true,  
  });  
  await anamClient.streamToVideoElement("anam-video");

  // Create agent audio input stream  
  const audioInputStream \= anamClient.createAgentAudioInputStream({  
    encoding: "pcm\_s16le",  
    sampleRate: 16000,  
    channels: 1,  
  });

  // Connect to ElevenLabs  
  await connectElevenLabs(elevenLabsAgentId, {  
    onAudio: (audio) \=\> {  
      audioInputStream.sendAudioChunk(audio);  
    },  
    onAgentResponse: () \=\> {  
      audioInputStream.endSequence();  
    },  
    onInterrupt: () \=\> {  
      audioInputStream.endSequence();  
    },  
  });  
}  
\`\`\`

\#\# Configuration

\#\#\# Environment Variables

\<Steps\>  
  \<Step title="Get your API credentials"\>  
    You'll need credentials from both services:

    | Service        | Where to get it                                          |  
    | \-------------- | \-------------------------------------------------------- |  
    | \*\*Anam\*\*       | \[lab.anam.ai\](https://lab.anam.ai) → Settings → API Keys |  
    | \*\*ElevenLabs\*\* | \[elevenlabs.io\](https://elevenlabs.io) → Agents          |  
  \</Step\>

  \<Step title="Set environment variables"\>  
    \`\`\`bash .env theme={"dark"}  
    \# Anam credentials  
    ANAM\_API\_KEY=your\_anam\_api\_key  
    ANAM\_AVATAR\_ID=your\_avatar\_id

    \# ElevenLabs credentials  
    ELEVENLABS\_AGENT\_ID=your\_agent\_id  
    \`\`\`  
  \</Step\>  
\</Steps\>

\#\#\# ElevenLabs Agent Setup

When configuring your ElevenLabs agent, set the output audio format to match Anam's expectations:

| Setting         | Value      |  
| \--------------- | \---------- |  
| \*\*Format\*\*      | PCM 16-bit |  
| \*\*Sample Rate\*\* | 16000 Hz   |  
| \*\*Channels\*\*    | Mono       |

\<Warning\>Mismatched audio formats will cause lip-sync issues. Ensure your ElevenLabs agent outputs PCM16 at 16kHz.\</Warning\>

\#\#\# Choosing an Avatar

\<CardGroup cols={2}\>  
  \<Card title="Stock Avatars" icon="users" href="/resources/avatar-gallery"\>  
    Browse ready-to-use avatars in our gallery. Copy the avatar ID directly into your config.  
  \</Card\>

  \<Card title="Custom Avatars" icon="wand-magic-sparkles" href="https://lab.anam.ai/avatars"\>  
    Create your own personalized avatar in Anam Lab with custom appearance and style.  
  \</Card\>  
\</CardGroup\>

\#\# Audio Passthrough API

\#\#\# createAgentAudioInputStream()

Creates a stream for sending audio chunks to the avatar for lip-sync.

\`\`\`typescript  theme={"dark"}  
const audioInputStream \= anamClient.createAgentAudioInputStream({  
  encoding: "pcm\_s16le",  
  sampleRate: 16000,  
  channels: 1,  
});  
\`\`\`

\<ParamField body="encoding" type="string" required\>  
  Audio encoding format. Currently supports \`pcm\_s16le\` (16-bit signed little-endian PCM).  
\</ParamField\>

\<ParamField body="sampleRate" type="number" required\>  
  Sample rate in Hz. Should match your ElevenLabs agent output (typically 16000).  
\</ParamField\>

\<ParamField body="channels" type="number" required\>  
  Number of audio channels. Use \`1\` for mono.  
\</ParamField\>

\#\#\# sendAudioChunk()

Send a base64-encoded audio chunk for lip-sync rendering.

\`\`\`typescript  theme={"dark"}  
audioInputStream.sendAudioChunk(base64AudioData);  
\`\`\`

\<Tip\>Audio chunks can be sent \*\*faster than realtime\*\*. Anam buffers them internally and renders lip-sync at the correct pace.\</Tip\>

\#\#\# endSequence()

Signal that the current audio sequence has ended. This helps Anam optimize lip-sync timing and handle transitions.

\`\`\`typescript  theme={"dark"}  
audioInputStream.endSequence();  
\`\`\`

Call this when:

\* ElevenLabs sends the \`agent\_response\` event (agent finished speaking)  
\* ElevenLabs sends the \`interruption\` event (user barged in)

\#\# Handling Interruptions

When a user speaks while the agent is talking (barge-in), ElevenLabs sends an \`interruption\` event. Handle it by ending the current audio sequence:

\`\`\`typescript  theme={"dark"}  
onInterrupt: () \=\> {  
  audioInputStream.endSequence();  
},  
\`\`\`

This signals Anam to stop the current lip-sync animation and prepare for new audio.

\#\# Troubleshooting

\<AccordionGroup\>  
  \<Accordion title="Avatar lips not moving"\>  
    \* Verify audio format matches (PCM16, 16kHz, mono)  
    \* Check that \`sendAudioChunk()\` is receiving data  
    \* Ensure the audio input stream was created successfully  
    \* Look for errors in browser console  
  \</Accordion\>

  \<Accordion title="Audio/lip-sync out of sync"\>  
    \* Call \`endSequence()\` when agent responses complete  
    \* Ensure you're handling interruptions correctly  
    \* Check network latency to both services  
  \</Accordion\>

  \<Accordion title="No audio from agent"\>  
    \* Verify your ElevenLabs agent is configured correctly  
    \* Check the WebSocket connection is established  
    \* Look for \`audio\` events in the message handler  
    \* Confirm your agent ID is correct  
  \</Accordion\>

  \<Accordion title="Microphone not working"\>  
    \* Check browser permissions for microphone access  
    \* Ensure \`echoCancellation\` is enabled to prevent feedback  
    \* Verify the microphone is sending data at 16kHz  
  \</Accordion\>

  \<Accordion title="Session token errors"\>  
    \* Verify your \`ANAM\_API\_KEY\` is valid  
    \* Check that \`enableAudioPassthrough: true\` is set in the session request  
    \* Ensure the avatar ID exists in your account  
  \</Accordion\>  
\</AccordionGroup\>

\#\# Use Cases

\<AccordionGroup\>  
  \<Accordion title="Customer Support" icon="headset"\>  
    Deploy ElevenLabs' powerful conversational AI with a friendly visual presence for customer service interactions.  
  \</Accordion\>

  \<Accordion title="Sales Demos" icon="presentation-screen"\>  
    Create engaging product demonstrations where an avatar explains features while responding to questions.  
  \</Accordion\>

  \<Accordion title="Virtual Receptionists" icon="building"\>  
    Greet visitors with a lifelike avatar powered by ElevenLabs' natural voice synthesis.  
  \</Accordion\>

  \<Accordion title="Educational Content" icon="graduation-cap"\>  
    Build interactive tutors that respond to student questions with expressive avatar animations.  
  \</Accordion\>

  \<Accordion title="Accessibility" icon="universal-access"\>  
    Provide visual lip-sync cues for users who benefit from seeing speech, not just hearing it.  
  \</Accordion\>  
\</AccordionGroup\>

\#\# Resources

\<CardGroup cols={2}\>  
  \<Card title="ElevenLabs Docs" icon="book" href="https://elevenlabs.io/docs/conversational-ai/overview"\>  
    Official ElevenLabs Conversational AI documentation  
  \</Card\>

  \<Card title="Demo Repository" icon="github" href="https://github.com/anam-ai/elevenlabs-demo"\>  
    Full source code for this integration  
  \</Card\>

  \<Card title="Avatar Gallery" icon="images" href="/resources/avatar-gallery"\>  
    Browse available stock avatars  
  \</Card\>

  \<Card title="Anam Lab" icon="flask" href="https://lab.anam.ai"\>  
    Create custom avatars for your brand  
  \</Card\>  
\</CardGroup\>

\#\# Support

\<CardGroup cols={2}\>  
  \<Card title="Join Slack" icon="slack" href="https://join.slack.com/t/anamcommunity/shared\_invite/zt-3bzumzewn-htlJt\~vEC2si2kMtHyfYng"\>  
    Join our community for help and discussions  
  \</Card\>

  \<Card title="Report Issues" icon="github" href="https://github.com/anam-ai/elevenlabs-demo/issues"\>  
    Report bugs or request features on GitHub  
  \</Card\>  
\</CardGroup\>

\---

\> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.anam.ai/llms.txt  
