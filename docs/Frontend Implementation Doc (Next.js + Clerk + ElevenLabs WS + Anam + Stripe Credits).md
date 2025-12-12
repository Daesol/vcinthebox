

# **Frontend Implementation Doc (Next.js \+ Clerk \+ ElevenLabs WS \+ Anam \+ Stripe Credits)**

## **1\) Product summary**

A YC-style, voice-first pitching game with **5 fixed stages**. Each stage is a **timed, conversational back-and-forth** between user and AI investor. During LIVE, audio goes both ways via ElevenLabs Agent WebSocket. An Anam avatar lip-syncs to AI audio using audio passthrough. When the timer reaches 0, the round **immediately transitions to RESULT**. Users spend credits to play, and can buy credits via Stripe Checkout.

## **2\) Fixed stage config (frontend constant, no endpoint)**

Create `src/lib/stages.ts`:

* 5 stages

* Each stage: `id`, `name`, `objective`, `timeLimitSec`

Frontend uses this to render UI and drive the run flow.

## **3\) Required screens (routes) and acceptance criteria**

### **A) `/` Landing (public)**

Required:

* YC-style hero copy

* CTA “Start a Run”  
   Behavior:

* If user is signed out, CTA opens Clerk sign-in.

* If signed in, CTA goes to `/app`.

### **B) `/app` Dashboard (protected)**

Required:

* Credits balance

* “Start a Run” (disabled if credits \<= 0\)

* “Buy Credits” button (Stripe checkout redirect)

* Leaderboard preview (top N)

* Stage list preview (from stages constant)

Data sources:

* `GET /api/me` for `{credits, user}`

* `GET /api/leaderboard` for preview

### **C) `/app/run` Stage Intro (protected)**

Required:

* Stage name

* Objective

* Time limit

* “Begin” button

Behavior on Begin:

* Calls backend to start stage session:

  * Get ElevenLabs session info (agentId and auth method your backend chooses)

  * Get Anam session token

* Navigate to `/app/run/live?stage=<id>`

### **D) `/app/run/live` LIVE Round (protected, core)**

Required:

* Always visible Anam `<video>` element

* Timer countdown (dominant)

* Stage objective visible

* Status indicator driven by ElevenLabs events (listening/speaking/thinking)

* Transcript/captions panel (recommended for judge clarity)

* Controls: mic mute, “End early” optional

Hard rule:

* When timer hits 0: stop mic capture, close WS, end Anam audio sequence, transition to RESULT.

### **E) `/app/run/result` Stage Result (protected)**

Required:

* ⭐ stars out of 5

* 💰 money raised in this stage

* Feedback bullets (3–5)

* Total raised so far

* CTA: “Next Stage” or “Finish Run” or “Try Again” depending on pass/fail & stage index

Data:

* `POST /api/run/stage/complete` returns `{stars, moneyRaised, feedback, passFail, totalRaised}`

### **F) `/app/run/summary` Run Summary (protected)**

Required:

* Total money raised

* Stage breakdown (optional)

* “Submit to Leaderboard” button

* Leaderboard view w/ user highlight

* “Start New Run”

---

## **4\) Run state machine (frontend)**

Implement a single run controller state machine:

`IDLE → STAGE_INTRO → LIVE → RESULT → (NEXT_STAGE → STAGE_INTRO) → SUMMARY`

Rules:

* Only LIVE owns audio \+ sockets.

* Leaving LIVE always triggers cleanup.

* Timer expiry forces transition LIVE → RESULT.

---

## **5\) File tree (recommended)**

Use Next.js App Router.

src/  
  app/  
    layout.tsx  
    page.tsx  
    app/  
      layout.tsx  
      page.tsx                \# dashboard  
      run/  
        page.tsx              \# stage intro  
        live/page.tsx         \# LIVE  
        result/page.tsx       \# stage result  
        summary/page.tsx      \# summary  
  components/  
    Hero.tsx  
    StageCard.tsx  
    Timer.tsx  
    TranscriptPanel.tsx  
    AvatarVideo.tsx  
    CreditBadge.tsx  
    LeaderboardPreview.tsx  
  lib/  
    stages.ts  
    runStore.ts              \# run state machine  
    api.ts                   \# typed fetch wrappers  
  services/  
    elevenlabsWs.ts          \# connect \+ handle events  
    anam.ts                  \# createClient \+ audio passthrough stream  
    audioPlayer.ts           \# optional if you also play AI audio locally  
  middleware.ts (or proxy.ts)

---

## **6\) Clerk setup (copy/paste exact snippets)**

### **Install**

npm install @clerk/nextjs

### **Env vars**

NEXT\_PUBLIC\_CLERK\_PUBLISHABLE\_KEY=pk\_test\_dW5pZmllZC1mb3gtNTIuY2xlcmsuYWNjb3VudHMuZGV2JA  
CLERK\_SECRET\_KEY=••••••••••••••••••••••••••••••••••••••••••••••••••

### **Middleware / proxy file**

If Next.js ≤ 15, name it `middleware.ts`. Otherwise `proxy.ts`. Snippet:

import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config \= {  
  matcher: \[  
    // Skip Next.js internals and all static files, unless found in search params  
    '/((?\!\_next|\[^?\]\*\\\\.(?:html?|css|js(?\!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).\*)',  
    // Always run for API routes  
    '/(api|trpc)(.\*)',  
  \],  
};

### **Wrap app with ClerkProvider**

Paste into `src/app/layout.tsx`:

import { type Metadata } from 'next'  
import {  
  ClerkProvider,  
  SignInButton,  
  SignUpButton,  
  SignedIn,  
  SignedOut,  
  UserButton,  
} from '@clerk/nextjs'  
import { Geist, Geist\_Mono } from 'next/font/google'  
import './globals.css'

const geistSans \= Geist({  
  variable: '--font-geist-sans',  
  subsets: \['latin'\],  
})

const geistMono \= Geist\_Mono({  
  variable: '--font-geist-mono',  
  subsets: \['latin'\],  
})

export const metadata: Metadata \= {  
  title: 'Clerk Next.js Quickstart',  
  description: 'Generated by create next app',  
}

export default function RootLayout({  
  children,  
}: Readonly\<{  
  children: React.ReactNode  
}\>) {  
  return (  
    \<ClerkProvider\>  
      \<html lang="en"\>  
        \<body className={\`${geistSans.variable} ${geistMono.variable} antialiased\`}\>  
          \<header className="flex justify-end items-center p-4 gap-4 h-16"\>  
            \<SignedOut\>  
              \<SignInButton /\>  
              \<SignUpButton\>  
                \<button className="bg-\[\#6c47ff\] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"\>  
                  Sign Up  
                \</button\>  
              \</SignUpButton\>  
            \</SignedOut\>  
            \<SignedIn\>  
              \<UserButton /\>  
            \</SignedIn\>  
          \</header\>  
          {children}  
        \</body\>  
      \</html\>  
    \</ClerkProvider\>  
  )  
}

---

## **7\) ElevenLabs WebSocket integration**

### **WebSocket endpoint**

Connect to:

* `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`

(Shown in Anam’s integration example and matches the Agents WebSocket spec context.)

### **Event types you must handle**

From the AsyncAPI schema, the server can send:

* `conversation_initiation_metadata`

* `user_transcript`

* `agent_response`

* `audio` (base64 chunks)

* `interruption`

* `ping`

* `client_tool_call`

* `contextual_update`

* `vad_score`

* `internal_tentative_agent_response`

### **Client-to-server messages you may send**

The publish schema includes:

* `user_audio_chunk` (base64)

* `pong`

* `conversation_initiation_client_data`

* `client_tool_result`

* `contextual_update`

* `user_message`

* `user_activity`

### **Implementation guardrails**

* Treat ElevenLabs as authoritative for **turn-taking \+ interruption**.

* When you receive `interruption`, immediately end current Anam lip-sync sequence (see Anam section).

* Respond to `ping` with `pong` using `event_id`.

---

## **8\) Anam integration (basic integration, mandatory)**

### **Install**

npm install @anam-ai/js-sdk chatdio

### **Basic integration pattern (copy/paste)**

This is the core wiring: Anam streams avatar to video, and you forward ElevenLabs audio chunks to Anam’s audio passthrough stream.

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

### **Server requirement (your CTO owns)**

Backend must mint Anam session token with `enableAudioPassthrough: true`:

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

Critical audio format constraint:

* PCM 16-bit, 16kHz, mono (must match ElevenLabs output) or lip-sync will be off.

---

## **9\) Stripe credits (frontend instructions)**

Frontend does not run Stripe logic. It only redirects.

Implement:

* “Buy Credits” button calls `POST /api/billing/checkout` → `{ checkoutUrl }`

* `window.location.href = checkoutUrl`

Dashboard gating:

* If credits \<= 0, disable “Start a Run” and show “Buy Credits”.

---

## **10\) LIVE timer behavior (hard requirement)**

On LIVE entry:

* Start countdown from `stage.timeLimitSec`.

* Start WebSocket session \+ mic capture (if required).

* Start Anam stream to video.

On timer end:

* Stop mic capture immediately.

* Close WS.

* Call `audioInputStream.endSequence()` as cleanup.

* Navigate to RESULT and fetch stage results from backend.

No exceptions. No “grace period”.

---

## **11\) Cursor guardrails (tell Cursor exactly what NOT to do)**

* Do not create dynamic stage endpoints. Stages are fixed in frontend constant.

* Do not keep WS connection alive across screens.

* Do not store API keys in frontend.

* Do not invent interruption logic beyond responding to the ElevenLabs `interruption` event.

* Do not mount multiple Anam clients at once.

---

## **12\) Minimal backend contract required (so frontend can work)**

Even with fixed stages, backend must provide:

1. `GET /api/me` → `{ credits, user }`

2. `POST /api/session/start` (for a stage) → `{ agentId, elevenWsAuth?, anamSessionToken }`

3. `POST /api/run/stage/complete` → `{ stars, moneyRaised, feedback, passFail, totalRaised }`

4. `POST /api/billing/checkout` → `{ checkoutUrl }`

5. `GET /api/leaderboard` and `POST /api/leaderboard/submit`

