You are a principal engineer + product architect shipping a production-grade MVP in 72 hours. Build a modern, AI-native, **members-only** platform that connects (1) clients (PMIs/companies/entrepreneurs) with (2) independent experts (freelancers or employed people with spare capacity) for **paid, time-boxed consults**. The platform’s deeper purpose is to transfer competence inward so clients become autonomous; the platform is **scaffolding**, not a toll bridge.

### 1) Core identity: the hive wall (non-negotiable)

This is not a public marketplace. **Anonymous browsing is forbidden.**
 All meaningful resources exist inside the hive and require authentication.

Outside the hive (public):

- Landing page + manifesto (you can load the manifesto directly from docs/MANIFESTO.md)
- Pricing teaser (optional)
- Sign-in / Sign-up
- Just for testing if a user tipyes user as username and user as password can log in

Inside the hive (gated):

- Consultant directory + profiles
- Requests + matching + booking
- Engagement workspaces
- Hive mind libraries (patterns/prompts/stacks)
- Reviews and reputation

Enforce this with **middleware-based protection**, not only UI hiding.

------

### 2) Auth (must implement first): Clerk + Social Providers

Use **Clerk** for authentication and session management. Require sign-in to access any internal route.

Must support:

- **Google OAuth**
- **LinkedIn OAuth**
- **Meta/Facebook OAuth**

Implementation requirements:

- Add Clerk to Next.js App Router project
- Provide `/sign-in` and `/sign-up` routes using Clerk components
- Protect routes with `middleware.ts` so internal pages are inaccessible without a session
- After sign-up, route users to `/onboarding` to select role(s): Consultant / Client / Both
- Persist Clerk `userId` in the database as the primary identity key

Add `.env.example` including:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

Also create `docs/AUTH_PROVIDERS.md` explaining how to enable Google/LinkedIn/Facebook inside Clerk dashboard and which OAuth credentials must be created.

------

### 3) MVP monetization

Primary: **pay-per-consult** via Stripe Checkout

- Session SKUs: 30/60/90 minutes
- Optional fixed-price audit SKUs
- Entitlements based on payment success

Subscriptions: postpone (later-stage only).

------

### 4) Domain scope: “everything” without dying

Support all AI/IT sectors from day one by implementing a flexible taxonomy + AI classification:

- Domain tags (LLMs, MLOps, data, security, infra, product architecture, ERP integration, etc.)
- AI suggests tags + clarifying questions during intake
   Do not block requests because they don’t fit a narrow vertical.

------

### 5) Must-have flows (ship in 72 hours)

1. **Auth gating** (Clerk): no internal access without login.
2. **Onboarding** (post-login):
   - role selection: consultant/client/both
   - consultant profile: skills, rate, availability, bio, languages, consent settings, optional references
   - client profile: organization + billing info + preferences
3. **Request intake wizard**:
   - messy problem → AI-refined structured scope
   - output: summary, constraints, desired outcome, suggested duration, sensitive-data warning
4. **Matching & booking**:
   - client can book a consultant directly or publish a request
   - consultants accept/decline
   - AI suggests matches with “why”
5. **Engagement workspace**:
   - chat + agenda + checklist + notes + links
   - video link field (external provider)
6. **Payments**:
   - Stripe Checkout + webhook verification
   - create entitlements and lock workspace if unpaid
7. **Closure & transfer (mandatory)**:
   - “Transfer Pack” generator: summary, decisions, runbook, next steps, internalization checklist
8. **Reviews**:
   - client→consultant rating
   - consultant→client/request rating (anti-abuse)
9. **Hive mind (members-only)**:
   - Pattern Library (anonymized)
   - Prompt Library (sanitized)
   - Stack Templates (text-based)
      Contributions MUST go through redaction.

------

### 6) AI requirements

**IMPLEMENTED: Agentic Architecture with Gemini**

The platform uses a multi-agent orchestrated architecture powered by Google Gemini API.

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                           │
│                   (src/lib/ai/orchestrator.ts)              │
│                                                             │
│  Intent Detection → Agent Selection → Tool Execution        │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ IntakeAgent │     │MatcherAgent│     │TransferAgent│
│ (refinement)│     │  (scoring)  │     │ (knowledge) │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                ┌─────────────────────┐
                │   RedactionAgent    │
                │    (PII/secrets)    │
                └─────────────────────┘
```

#### Specialized Agents

| Agent | Location | Purpose |
|-------|----------|---------|
| IntakeAgent | `src/lib/ai/agents/intake.ts` | Transform messy requests into structured scopes |
| MatcherAgent | `src/lib/ai/agents/matcher.ts` | Score consultant-request matches with explanations |
| TransferAgent | `src/lib/ai/agents/transfer.ts` | Generate knowledge transfer packs |
| RedactionAgent | `src/lib/ai/agents/redaction.ts` | Detect and redact PII/secrets |
| HiveContributionAgent | `src/lib/ai/agents/hive-contribution.ts` | Refine and improve hive library contributions |

#### Agent Capabilities

**IntakeAgent** (`src/lib/ai/agents/intake.ts`)
- `refine(rawDescription)`: Trasforma descrizioni grezze in scope strutturati
- `classifyDomain(summary)`: Classifica domini e suggerisce skill
- `detectSensitiveData(content)`: Rileva dati sensibili nel contenuto

**MatcherAgent** (`src/lib/ai/agents/matcher.ts`)
- `findMatches(requestId, details)`: Trova e valuta match consultant-request
- `calculateScore(request, consultant)`: Calcola score singolo con spiegazione

**TransferAgent** (`src/lib/ai/agents/transfer.ts`)
- `generate(engagementData)`: Genera Transfer Pack completo
- `generateSummary(context)`: Genera solo executive summary
- `extractDecisions(notes, messages)`: Estrae decisioni chiave
- `generateRunbook(decisions, outcome)`: Genera runbook step-by-step
- `generateChecklist(summary, decisions)`: Genera checklist di internalizzazione

**RedactionAgent** (`src/lib/ai/agents/redaction.ts`)
- `redact(content, type)`: Redazione completa con dual-pass (regex + AI)
- `detectSensitiveData(content)`: Quick check senza redazione

**HiveContributionAgent** (`src/lib/ai/agents/hive-contribution.ts`)
- `refine(type, input)`: Raffina contribuzione completa (titolo, descrizione, tag, contenuto)
- `assessQuality(type, content)`: Quick quality check senza refinement completo
- `suggestTags(content)`: Suggerisce tag dalla tassonomia
- `improveMetadata(type, title, description, preview)`: Migliora solo titolo e descrizione

#### Tool Registry

Tools are defined in `src/lib/ai/tools/registry.ts` with handlers in `handlers.ts`:

**Intake Tools:**
- `refine_request`: Trasforma descrizioni grezze in scope
- `classify_domain`: Classifica in categorie di dominio
- `detect_sensitive_data`: Rileva PII/segreti

**Matching Tools:**
- `search_consultants`: Cerca consultant per criteri
- `calculate_match_score`: Calcola score match
- `generate_match_explanation`: Genera spiegazione human-readable

**Transfer Tools:**
- `summarize_engagement`: Genera executive summary
- `extract_decisions`: Estrae decisioni dall'engagement
- `generate_runbook`: Genera istruzioni step-by-step

**Redaction Tools:**
- `redact_pii`: Redazione PII (nomi, email, telefoni, SSN)
- `redact_secrets`: Redazione segreti (API keys, password, token)
- `anonymize_content`: Anonimizzazione completa per hive library

**Hive Tools:**
- `search_patterns`: Cerca nella pattern library
- `search_prompts`: Cerca nella prompt library

#### API Endpoints

| Endpoint | Agent | Purpose |
|----------|-------|---------|
| `POST /api/ai/orchestrate` | All | Central orchestration endpoint |
| `GET /api/ai/orchestrate` | - | API discovery (lista intent disponibili) |
| `POST /api/ai/refine-request` | IntakeAgent | Request refinement diretto |
| `POST /api/ai/refine-contribution` | HiveContributionAgent | Raffina contribuzione hive |
| `POST /api/offers` | MatcherAgent | Auto-calcola match score su offerta |
| `POST /api/hive/contribute` | RedactionAgent | Auto-redazione prima del salvataggio |
| `POST /api/engagements/[id]/transfer-pack` | TransferAgent | Genera Transfer Pack |

#### Configuration

```env
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash  # default, configurabile (es. gemini-2.5-pro, gemini-1.5-pro)
GOOGLE_AI_API_KEY=AIza...      # alternativo a GEMINI_API_KEY
```

#### Intent System

L'Orchestrator supporta 6 intent principali:
- `refine_request`: Raffina richieste grezze (→ IntakeAgent)
- `match_consultants`: Trova match consultant (→ MatcherAgent)
- `generate_transfer_pack`: Genera Transfer Pack (→ TransferAgent)
- `redact_content`: Redazione contenuto sensibile (→ RedactionAgent)
- `search_hive`: Cerca nella hive library (→ HiveAgent)
- `refine_contribution`: Raffina contribuzioni hive (→ HiveContributionAgent)

#### Safety (MANDATORY)

- All hive contributions go through RedactionAgent
- Regex + AI dual-pass for PII detection
- `requiresManualReview` flag for uncertain redactions
- Raw engagement content stored only for participants
- Temperature bassa (0.3) per redazione conservativa
- Confidence levels: high/medium/low per audit

#### Documentazione Dettagliata

Per una documentazione completa dell'architettura AI, vedere:
- `docs/ORCHESTRATORE.md`: Guida completa all'orchestratore e agli agenti

------

### 7) Tech stack (shipping + modernity)

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Postgres + Prisma
- Clerk auth
- Stripe payments
- Sentry
- Analytics (PostHog or Plausible) with consent

Mobile path:

- MVP as responsive web + PWA
- keep domain logic modular so React Native/Expo can reuse it later

------

### 8) Access control rules (must be enforced in code)

- Unauthenticated users can only see landing + auth pages
- Only members can see directory, requests, hive library
- Only engagement participants can access workspace artifacts
- Admin has minimal access to handle disputes and moderation logs

------

### 9) Data model (minimum viable, Prisma)

Include tables:

- User (maps to Clerk `userId`), Organization, Membership/Role
- ConsultantProfile, ClientProfile
- SkillTag, ConsultantSkill, Availability, Reference
- Request, Offer/Match, Booking, Engagement
- Message, Note, ArtifactLink
- Review
- ProductSKU, Payment (Stripe refs), Entitlement
- Pattern, Prompt, StackTemplate
- ConsentLog, RedactionJob, AuditLog

------

### 10) Deliverables

Generate:

- full repo + file tree
- Prisma schema + migrations + seed
- Clerk integration + middleware gating + onboarding route logic
- Stripe checkout + webhook verification
- AI adapter + redaction pipeline
- core pages: landing, sign-in/up, onboarding, directory, profile, request wizard, booking, engagement workspace, checkout success/cancel, transfer pack, hive library, minimal admin
- README + DECISIONS.md + docs/AUTH_PROVIDERS.md

Proceed without asking for more questions; if ambiguous, choose the pragmatic MVP option and document it in DECISIONS.md.



## Best Practices

1. First think through the problem, read the codebase for relevant files, and write a plan to `tasks/todo.md`.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made.
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the `tasks/todo.md` file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY.
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY.
10. Always,Always update the CLAUDE.md file upon modification of the logic of the program or of its workflow .
11. If, following a request of mine, you happen to notice a recurrent pattern leading to a bug, please note it into the file docs/learnt.md
12. Always run regression tests whenever I ask you to fix a bug and store what yo uhave learnt inside the docs/learnt.md file
