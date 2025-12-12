# VC in the Box 🎯

A voice-first pitch practice game where you practice pitching to AI investors at different difficulty levels - from your supportive Mom to the Sharks.

## 🎮 The 5 Stages

| Stage | Investor | Time | Vibe |
|-------|----------|------|------|
| 1 | **Mom** | 45s | "You're not an idiot" - unconditional support |
| 2 | **Local Angel** | 2 min | Warm touch - invests in people first |
| 3 | **VC Single** | 90s | Professional - knows the metrics |
| 4 | **YC Partner** | 90s | Traction obsessed - show me the growth |
| 5 | **Shark Tank** | 2 min | Marketing focused - can this scale? |

Each stage has a unique Anam avatar and ElevenLabs agent personality.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Fill in your API keys (see below)

# Start development server
npm run dev
```

## 🔑 Required API Keys

### 1. Clerk Authentication

1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy keys to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### 2. Anam AI (Avatar)

1. Get API key from [lab.anam.ai](https://lab.anam.ai)
2. Add to `.env.local`:

```env
ANAM_API_KEY=your_key_here
```

Avatar IDs are already configured in `src/lib/stages.ts` - one avatar per stage:
- Stage 1 (Mom): `6dbc1e47-7768-403e-878a-94d7fcc3677b`
- Stage 2 (Angel): `19d18eb0-5346-4d50-a77f-26b3723ed79d`
- Stage 3 (VC): `6cc28442-cccd-42a8-b6e4-24b7210a09c5`
- Stage 4 (YC): `81b70170-2e80-4e4b-a6fb-e04ac110dc4b`
- Stage 5 (Shark): `e36f16d8-7ad1-423b-b9c9-70d49f5eaac6`

### 3. ElevenLabs Agents

Create 5 conversational AI agents at [elevenlabs.io/app/conversational-ai](https://elevenlabs.io/app/conversational-ai).

Each agent should have a unique personality matching the stage:

```env
ELEVENLABS_AGENT_MOM=agent_xxx
ELEVENLABS_AGENT_ANGEL=agent_xxx
ELEVENLABS_AGENT_VC=agent_xxx
ELEVENLABS_AGENT_YC=agent_xxx
ELEVENLABS_AGENT_SHARK=agent_xxx
```

#### Suggested Agent System Prompts

**Mom Agent:**
> You are a loving, supportive mother listening to your child explain their startup idea. You're enthusiastic, encouraging, and ask simple clarifying questions. Even if you don't fully understand the tech, you believe in them. Keep responses short and warm.

**Local Angel Agent:**
> You are a friendly local angel investor who's made some money and wants to help young founders. You invest in people first, ask about their story and passion. You're warm but practical. Keep responses conversational.

**VC Single Agent:**
> You are a professional venture capitalist evaluating a potential investment. You're polite but direct. You ask about market size, unit economics, competitive moat, and team. You push back on weak points. Keep responses concise.

**YC Partner Agent:**
> You are a Y Combinator partner during office hours. You're obsessed with traction and growth. Lead every question toward metrics: users, revenue, week-over-week growth, retention. You interrupt if answers are too long. Be direct and fast-paced.

**Shark Tank Agent:**
> You are a Shark Tank investor evaluating a deal on TV. You're theatrical, sometimes tough, but fair. You care about marketing potential, customer acquisition, and whether this can scale. You might make dramatic statements. Keep it entertaining.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── me/                 # GET /api/me - user profile + credits
│   │   ├── session/start/      # POST /api/session/start - create session
│   │   ├── run/stage/complete/ # POST /api/run/stage/complete - score stage
│   │   ├── leaderboard/        # GET/POST leaderboard
│   │   └── billing/            # Stripe checkout
│   ├── app/                    # Protected app routes
│   │   ├── page.tsx            # Dashboard
│   │   └── run/                # Game flow
│   │       ├── page.tsx        # Stage intro
│   │       ├── live/           # Live pitch page
│   │       ├── result/         # Stage result
│   │       └── summary/        # Run summary
│   └── page.tsx                # Landing page
├── lib/
│   ├── api.ts                  # Frontend API client
│   ├── runStore.ts             # Zustand state machine
│   └── stages.ts               # Stage config with avatar IDs
├── services/
│   ├── elevenlabsWs.ts         # ElevenLabs WebSocket
│   └── anam.ts                 # Anam avatar integration
└── middleware.ts               # Clerk auth middleware
```

## 🎯 Core Flow

1. **User signs in** via Clerk
2. **Dashboard** shows credits + stages
3. **Start stage** → Backend creates:
   - Anam session token (with stage-specific avatar)
   - Returns ElevenLabs agent ID for stage
4. **Live pitch** → Frontend:
   - Connects to ElevenLabs WebSocket
   - Streams mic audio to agent
   - Passes agent audio to Anam avatar (lip sync)
   - Collects transcript
5. **Stage complete** → Backend scores transcript
6. **Results** → Stars, money raised, feedback
7. **Next stage or Summary**

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | User profile + credits |
| POST | `/api/session/start` | Create session for stage |
| POST | `/api/run/stage/complete` | Score completed stage |
| GET | `/api/leaderboard` | Get top performers |
| POST | `/api/leaderboard/submit` | Submit run to leaderboard |
| POST | `/api/billing/checkout` | Create Stripe checkout |

## 🛠️ Tech Stack

- **Next.js 15** - App Router
- **Clerk** - Authentication
- **ElevenLabs** - Conversational AI agents
- **Anam AI** - Realistic avatar lip-sync
- **Zustand** - State management
- **Tailwind CSS** - Styling

## 📝 License

MIT
