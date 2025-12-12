## 

You are implementing the **frontend only** for a Next.js (App Router) project. The backend is handled by my CTO and already exists (or will exist). **Do not implement backend logic** beyond calling the endpoints described below.

I will provide you a markdown document titled: **“Frontend Implementation Doc (Next.js \+ Clerk \+ ElevenLabs WS \+ Anam \+ Stripe Credits)”**.  
 You MUST follow that document as the source of truth for architecture, screens, file tree, guardrails, and the included code snippets (Clerk, ElevenLabs WS event handling, Anam basic integration).

### **Step 0 (mandatory): produce an implementation plan**

Before writing code, generate an implementation plan with milestones and a file-by-file checklist. Then implement milestone-by-milestone. After each milestone, stop and provide a short verification checklist.

---

# **Core app behavior**

## **Stages are fixed on the frontend**

Create a `stages.ts` constant with 5 fixed stages (id, name, objective, timeLimitSec). No endpoint for stages.

## **Run flow (state machine)**

IDLE → STAGE\_INTRO → LIVE → RESULT → (NEXT\_STAGE → STAGE\_INTRO) → SUMMARY

Hard rule:

* In LIVE, when the timer hits 0, immediately transition to RESULT after cleanup.

---

# **Screens required (as in the Frontend Implementation Doc)**

* `/` Landing (public)

* `/app` Dashboard (protected)

* `/app/run` Stage Intro (protected)

* `/app/run/live` LIVE (protected)

* `/app/run/result` Stage Result (protected)

* `/app/run/summary` Summary (protected)

Keep UI clean, YC-like, minimal Tailwind.

---

# **Integrations (must match the provided Frontend Implementation Doc)**

## **Clerk**

Use the exact Clerk snippets from the doc:

* install `@clerk/nextjs`

* middleware/proxy config

* `<ClerkProvider>` in `layout.tsx` and basic auth buttons  
   Protect `/app/*` routes.

## **ElevenLabs Agents WebSocket (LIVE core)**

Connect to the ElevenLabs Agents WebSocket exactly as described in the doc.  
 Implement handlers for the documented event types, including:

* `audio` chunks (base64)

* transcript events (`user_transcript`, agent response text)

* `interruption`

* `ping` → respond `pong` with event\_id

Do not invent turn-taking or interruption policies. Rely on ElevenLabs built-in behavior and react to events.

## **Anam (MANDATORY, not optional)**

Implement Anam “basic integration” exactly as in the doc:

* `<video>` element

* `createClient(sessionToken, { disableInputAudio: true })`

* `streamToVideoElement(...)`

* `createAgentAudioInputStream({ encoding: "pcm_s16le", sampleRate: 16000, channels: 1 })`

* Forward ElevenLabs `audio_event.audio_base_64` into `audioInputStream.sendAudioChunk(...)`

* On `agent_response`, call `audioInputStream.endSequence()`

* On `interruption`, call `audioInputStream.endSequence()`

## **Stripe credits (frontend only)**

Frontend redirects to checkout URL returned by backend.  
 Do not implement Stripe server code.

---

# **Transcript-based stage completion (IMPORTANT)**

During LIVE, collect transcript events from ElevenLabs WebSocket into an ordered transcript buffer:

`Turn[] = { speaker: "user" | "agent", text: string, timestamp?: number }`

When the stage ends (timer reaches 0 or user ends early):

1. Stop mic capture, close ElevenLabs WS, and end Anam audio sequence

2. Call backend endpoint:  
    `POST /api/run/stage/complete`  
    Body includes:  
    `{ runId, stageId, transcript: Turn[] }`  
    Backend returns:  
    `{ stars, moneyRaised, feedback, passFail, totalRaised }`

3. Navigate to RESULT and render that response

Do NOT score on frontend.

---

# **Backend endpoints (assume they exist; just call them)**

* `GET /api/me` → credits \+ user

* `GET /api/leaderboard`

* `POST /api/session/start` → `{ agentId, anamSessionToken, runId }` (or similar)

* `POST /api/billing/checkout` → `{ checkoutUrl }`

* `POST /api/run/stage/complete` → scoring response

If a response shape is slightly different, make the client typed but flexible and isolate in `lib/api.ts`.

---

# **Engineering guardrails**

* WebSocket logic must live in a single service module (not inside components).

* Only LIVE screen owns sockets/audio capture.

* Always cleanup on stage end or unmount.

* No secrets in frontend.

* Keep components small and predictable.

---

Now:

1. Create the implementation plan.

2. Implement Milestone 1: project skeleton \+ Clerk \+ protected routes \+ placeholder screens.  
    Then stop and show the verification checklist.

