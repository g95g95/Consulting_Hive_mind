# Consulting Hive Mind

A modern, AI-native, members-only platform that connects clients with independent experts for paid, time-boxed consults. The platform's purpose is to transfer competence inward so clients become autonomous.

---

## Quick Start (5 minuti)

### 1. Crea gli account gratuiti necessari:
- **Clerk** (autenticazione): https://clerk.com → crea progetto → copia le API keys
- **Supabase** (database): https://supabase.com → crea progetto → copia connection string

### 2. Esegui questi comandi:
```bash
npm install
npm run setup        # Ti guida nella configurazione
npm run db:setup     # Crea le tabelle nel database
npm run dev          # Avvia l'app
```

### 3. Apri http://localhost:3000

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

### AI Capabilities
- Request refinement and structuring
- Consultant matching with explanations
- Transfer pack generation
- PII/secrets redaction for Hive Mind contributions

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk
- **Payments**: Stripe
- **AI**: Anthropic Claude + OpenAI (configurable)
- **Deployment**: PWA-ready

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Clerk account
- Stripe account
- Anthropic/OpenAI API keys

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Consulting_Hive_mind
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with:
- Clerk credentials
- Database URL
- Stripe keys
- AI provider keys

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Seed the database (optional):
```bash
npx prisma db seed
```

7. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Environment Variables

See `.env.example` for all required variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI Providers
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

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
│   ├── sign-in/              # Auth pages
│   └── sign-up/
├── components/
│   ├── engagement/           # Engagement workspace components
│   ├── reviews/              # Review components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── ai/                   # AI provider adapter
│   ├── auth.ts               # Auth utilities
│   └── db.ts                 # Prisma client
└── middleware.ts             # Route protection
```

## Documentation

- [Auth Providers Setup](docs/AUTH_PROVIDERS.md)
- [Technical Decisions](DECISIONS.md)
- [Manifesto](docs/MANIFESTO.md)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT
