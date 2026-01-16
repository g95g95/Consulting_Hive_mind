# CLAUDE.md — Consulting Hive Mind

> **Development philosophy**: See `~/.claude/CLAUDE.md`
> **Product requirements**: See `docs/PRODUCT_SPEC.md`

## Project Overview

| Attribute | Value |
|-----------|-------|
| Name | Consulting Hive Mind |
| Type | Members-only consulting platform |
| Stack | Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui |
| Database | PostgreSQL (Supabase) + Prisma |
| Auth | Clerk (Google/LinkedIn/Facebook OAuth) |
| Payments | Stripe Checkout |
| AI | Gemini (multi-agent orchestration) |
| Monitoring | Sentry + PostHog |

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public: sign-in, sign-up
│   ├── (protected)/              # Gated: requires auth
│   │   ├── app/                  # Main app routes
│   │   │   ├── directory/        # Consultant directory
│   │   │   ├── requests/         # Request management
│   │   │   ├── engagements/      # Engagement workspaces
│   │   │   ├── hive/             # Hive libraries
│   │   │   └── admin/            # Admin panel
│   │   └── onboarding/           # Post-signup flow
│   └── api/                      # API routes
│       ├── ai/                   # AI orchestration endpoints
│       ├── webhooks/             # Clerk/Stripe webhooks
│       └── ...                   # CRUD endpoints
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   └── ...                       # Feature components
├── lib/
│   ├── ai/
│   │   ├── orchestrator.ts       # Central agent coordination
│   │   ├── agents/               # Specialized agents
│   │   ├── providers/            # LLM providers (Gemini, etc.)
│   │   └── tools/                # Tool registry + handlers
│   ├── db.ts                     # Prisma client
│   ├── stripe/                   # Payment logic
│   └── auth.ts                   # Auth utilities
├── types/                        # TypeScript definitions
└── middleware.ts                 # Route protection
prisma/
├── schema.prisma                 # Database schema
└── seed.ts                       # Test data
docs/                             # Documentation
tasks/                            # Task tracking (todo.md)
tests/                            # Vitest tests
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed with test data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate` | Create + run migrations |

## Environment Variables

### Database (Supabase)
- `DATABASE_URL` — Pooled connection (port 6543)
- `DIRECT_URL` — Direct connection (port 5432, migrations)

### Auth (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

### AI (Gemini)
- `GEMINI_API_KEY` — Google AI API key
- `GEMINI_MODEL` — Model (default: gemini-2.0-flash)

### Payments (Stripe)
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Email (Resend)
- `RESEND_API_KEY`
- `FROM_EMAIL`

### Monitoring
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`

## AI Architecture

| Agent | Location | Purpose |
|-------|----------|---------|
| IntakeAgent | `src/lib/ai/agents/intake.ts` | Transform messy requests → structured scopes |
| MatcherAgent | `src/lib/ai/agents/matcher.ts` | Score consultant-request matches |
| TransferAgent | `src/lib/ai/agents/transfer.ts` | Generate knowledge transfer packs |
| RedactionAgent | `src/lib/ai/agents/redaction.ts` | Detect and redact PII/secrets |
| HiveContributionAgent | `src/lib/ai/agents/hive-contribution.ts` | Refine hive library contributions |

**Orchestrator**: `src/lib/ai/orchestrator.ts` — Intent detection → agent selection → tool execution

**Detailed docs**: `docs/ORCHESTRATORE.md`

## Access Control (Enforced in middleware.ts)

| User State | Can Access |
|------------|------------|
| Unauthenticated | Landing, `/sign-in`, `/sign-up` |
| Authenticated (member) | Directory, requests, hive library, own profile |
| Engagement participant | Workspace artifacts for that engagement |
| Admin | Moderation logs, dispute resolution |

## Testing

- **Framework**: Vitest
- **Location**: `tests/`
- **Run all**: `npm test`
- **Coverage**: `npm run test:coverage`

## Project-Specific Notes

1. **Hive contributions** always pass through `RedactionAgent` before storage
2. **Transfer packs** are mandatory for engagement closure
3. **Clerk webhooks** sync user data to local database
4. **Stripe webhooks** create entitlements on payment success
5. Update `docs/learnt.md` when discovering recurring bug patterns
6. Run regression tests (`npm test`) when fixing bugs
