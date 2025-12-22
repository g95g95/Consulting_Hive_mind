# Consulting Hive Mind

A modern, AI-native, members-only platform that connects clients with independent experts for paid, time-boxed consults. The platform's purpose is to transfer competence inward so clients become autonomous.

---

## Avvio Locale (Local Development)

### Prerequisiti

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL** - locale o [Supabase](https://supabase.com) (gratuito)

### 1. Crea gli account gratuiti necessari

| Servizio | URL | Cosa ti serve |
|----------|-----|---------------|
| **Clerk** (auth) | https://clerk.com | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` |
| **Supabase** (db) | https://supabase.com | Connection string PostgreSQL |
| **Google AI** | https://aistudio.google.com | `GEMINI_API_KEY` |
| **Stripe** (pagamenti) | https://stripe.com | `STRIPE_SECRET_KEY` + `PUBLISHABLE_KEY` (opzionale per dev) |

### 2. Clona e installa

```bash
git clone <repository-url>
cd Consulting_Hive_mind
npm install
```

### 3. Configura le variabili d'ambiente

```bash
cp .env.example .env.local
```

Modifica `.env.local` con le tue credenziali:

```env
# Database (obbligatorio)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Clerk Auth (obbligatorio)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# AI Provider (almeno uno obbligatorio)
AI_PROVIDER=gemini                    # gemini | anthropic | openai
GEMINI_API_KEY=AIzaSyxxxxx
# ANTHROPIC_API_KEY=sk-ant-xxxxx      # alternativa
# OPENAI_API_KEY=sk-xxxxx             # alternativa

# Stripe (opzionale per dev)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup database

```bash
# Genera Prisma client e crea le tabelle
npm run db:setup

# (Opzionale) Popola con dati di test
npm run db:seed
```

### 5. Avvia il server di sviluppo

```bash
npm run dev
```

### 6. Apri l'app

Vai su **http://localhost:3000**

---

## Comandi Utili

```bash
npm run dev          # Avvia server di sviluppo (http://localhost:3000)
npm run build        # Build per produzione
npm run start        # Avvia server produzione (dopo build)
npm run db:studio    # Apri Prisma Studio (GUI database)
npm run db:seed      # Popola database con dati test
npm test             # Esegui test
npm run test:watch   # Test in watch mode
```

---

## Troubleshooting Locale

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "Database connection failed"
- Verifica che `DATABASE_URL` in `.env.local` sia corretto
- Per Supabase: usa la connection string "Session pooler" (porta 5432)

### "CLERK_SECRET_KEY is required"
- Assicurati di aver copiato `.env.example` in `.env.local`
- Verifica che le chiavi Clerk siano corrette

### "AI Provider not configured"
- Imposta almeno una API key: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, o `OPENAI_API_KEY`
- Imposta `AI_PROVIDER` al provider corrispondente

---

## Quick Start Alternativo (Setup Wizard)

```bash
npm install
npm run setup        # Ti guida nella configurazione interattiva
npm run db:setup
npm run dev
```

**Per istruzioni dettagliate passo-passo**: vedi [docs/SETUP_GUIDA_COMPLETA.md](docs/SETUP_GUIDA_COMPLETA.md)

---

## Features

### Core Platform
- **Members-Only Access**: All meaningful resources require authentication
- **Multi-Role Support**: Users can be Consultants, Clients, or Both
- **AI-Powered Matching**: Smart consultant suggestions with explanations

### Authentication (Clerk)
- Google OAuth
- LinkedIn OAuth
- Meta/Facebook OAuth
- Email/Password

### Key Flows
1. **Onboarding**: Role selection + profile setup
2. **Request Intake**: AI-refined structured scope from messy problems
3. **Matching & Booking**: Direct booking or request publishing
4. **Engagement Workspace**: Chat, agenda, checklist, notes, video links
5. **Payments**: Stripe Checkout for 30/60/90 min sessions
6. **Transfer Pack**: AI-generated summary, decisions, runbook, next steps
7. **Reviews**: Bidirectional ratings (client <-> consultant)
8. **Hive Mind**: Anonymized patterns, prompts, and stack templates

### AI Architecture (Gemini-Powered)

The platform uses a **multi-agent orchestrated architecture**:

| Agent | Purpose |
|-------|---------|
| **IntakeAgent** | Transform messy requests into structured scopes |
| **MatcherAgent** | Score consultant-request matches with explanations |
| **TransferAgent** | Generate knowledge transfer packs |
| **RedactionAgent** | Detect and redact PII/secrets |
| **HiveContributionAgent** | Refine and improve hive library contributions |

See [docs/ORCHESTRATORE.md](docs/ORCHESTRATORE.md) for detailed AI documentation.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk
- **Payments**: Stripe
- **AI**: Google Gemini (primary), Anthropic/OpenAI (supported)
- **Deployment**: PWA-ready, Vercel-optimized

---

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase)
- Clerk account
- Stripe account (for payments)
- Google AI API key (for Gemini)

### Step-by-Step Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Consulting_Hive_mind
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env.local
```

4. **Edit `.env.local` with your credentials:**
```env
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# AI Provider (Gemini - recommended)
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash
```

5. **Setup database:**
```bash
npm run db:setup     # Generate Prisma client + push schema
npm run db:seed      # Seed with test data (includes 10 hive examples)
```

6. **Start the development server:**
```bash
npm run dev
```

7. **Open http://localhost:3000**

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Testing the AI Features

#### 1. Test Request Refinement
```bash
curl -X POST http://localhost:3000/api/ai/refine-request \
  -H "Content-Type: application/json" \
  -d '{"rawDescription": "I need help with my ML pipeline, its slow and expensive"}'
```

#### 2. Test Contribution Refinement
```bash
curl -X POST http://localhost:3000/api/ai/refine-contribution \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pattern",
    "title": "My Pattern",
    "content": "Some content about a pattern I discovered..."
  }'
```

#### 3. Test the Orchestrator
```bash
# List available intents
curl http://localhost:3000/api/ai/orchestrate

# Process an intent
curl -X POST http://localhost:3000/api/ai/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "refine_request",
    "context": {"rawDescription": "Help me with Kubernetes"}
  }'
```

### Manual Testing Flow

1. **Sign up** at `/sign-up` with Google/email
2. **Complete onboarding** at `/onboarding` - select "Both" role
3. **Create a request** at `/app/requests/new`
4. **Browse the hive** at `/app/hive` (10 seeded examples)
5. **Contribute to hive** - the AI will refine your contribution
6. **Check transfer pack generation** after completing an engagement

### Test User (Development Only)

After running `npm run db:seed`, you can test with:
- Username: `user`
- Password: `user`

> Note: This only works if you've configured Clerk to allow username/password auth.

---

## Environment Variables

### Required

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...          # For Prisma migrations

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# AI Provider
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash        # or gemini-2.5-pro, gemini-1.5-pro
```

### Optional

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Alternative AI Providers
AI_PROVIDER=gemini                   # gemini (default), anthropic, openai
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Monitoring
SENTRY_DSN=https://...
NEXT_PUBLIC_POSTHOG_KEY=phc_...

# Debug
IS_DEBUG=true
FILE_LOG_PATH=C:/logs/hivemind
```

### Available Gemini Models

| Model | Description |
|-------|-------------|
| `gemini-2.0-flash` | Default, fast and balanced |
| `gemini-2.5-pro` | Best quality, slower |
| `gemini-1.5-pro` | Stable, good quality |
| `gemini-1.5-flash` | Fastest, lower cost |

---

## Deployment

### Deploy to Vercel

1. **Push to GitHub**

2. **Import in Vercel:**
   - Go to https://vercel.com/new
   - Import your repository
   - Vercel auto-detects Next.js

3. **Configure environment variables:**
   - Add all variables from `.env.local` to Vercel dashboard
   - Use production Clerk/Stripe keys

4. **Deploy!**

### Production Checklist

- [ ] Switch Clerk to production keys
- [ ] Switch Stripe to live keys
- [ ] Set `GEMINI_MODEL` to preferred model
- [ ] Configure Stripe webhook endpoint
- [ ] Set up Sentry for error tracking
- [ ] Configure PostHog for analytics
- [ ] Update `NEXT_PUBLIC_APP_URL`

### Database Migration (Production)

```bash
# Generate migration
npx prisma migrate dev --name your_migration_name

# Apply to production
npx prisma migrate deploy
```

---

## Project Structure

```
src/
├── app/
│   ├── (protected)/          # Authenticated routes
│   │   ├── app/              # Main application
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── bookings/     # Booking management
│   │   │   ├── directory/    # Consultant directory
│   │   │   ├── engagements/  # Engagement workspaces
│   │   │   ├── hive/         # Hive Mind library
│   │   │   ├── profile/      # User profile
│   │   │   └── requests/     # Request management
│   │   └── onboarding/       # Onboarding flow
│   ├── api/                  # API routes
│   │   ├── ai/               # AI endpoints
│   │   │   ├── orchestrate/  # Central AI orchestration
│   │   │   ├── refine-request/
│   │   │   └── refine-contribution/
│   │   ├── hive/             # Hive library API
│   │   └── ...
│   ├── sign-in/              # Auth pages
│   └── sign-up/
├── components/
│   ├── engagement/           # Engagement workspace components
│   ├── reviews/              # Review components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── ai/                   # AI system
│   │   ├── orchestrator.ts   # Central orchestrator
│   │   ├── agents/           # Specialized agents
│   │   ├── providers/        # Gemini, Anthropic, OpenAI
│   │   └── tools/            # Tool registry & handlers
│   ├── auth.ts               # Auth utilities
│   └── db.ts                 # Prisma client
└── middleware.ts             # Route protection
```

---

## Documentation

- [AI Orchestrator Guide](docs/ORCHESTRATORE.md) - Detailed AI architecture
- [Auth Providers Setup](docs/AUTH_PROVIDERS.md) - Configure OAuth providers
- [Technical Decisions](DECISIONS.md) - Architecture decisions
- [Manifesto](docs/MANIFESTO.md) - Platform philosophy
- [Setup Guide (Italian)](docs/SETUP_GUIDA_COMPLETA.md) - Step-by-step setup

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:setup` | Generate Prisma + push schema |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run setup` | Interactive setup wizard |

---

## License

MIT
