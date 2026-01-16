# Product Specification — Consulting Hive Mind

> A modern, AI-native, **members-only** platform connecting clients with independent experts for paid, time-boxed consultations.

## Vision

The platform's purpose is to **transfer competence inward** so clients become autonomous. The platform is scaffolding, not a toll bridge.

---

## 1. Core Identity: The Hive Wall

**This is not a public marketplace. Anonymous browsing is forbidden.**

All meaningful resources exist inside the hive and require authentication.

### Public (Outside the Hive)
- Landing page + manifesto (load from `docs/MANIFESTO.md`)
- Pricing teaser (optional)
- Sign-in / Sign-up
- Test account: username `user`, password `user`

### Gated (Inside the Hive)
- Consultant directory + profiles
- Requests + matching + booking
- Engagement workspaces
- Hive mind libraries (patterns/prompts/stacks)
- Reviews and reputation

**Enforce with middleware-based protection**, not UI hiding.

---

## 2. Authentication: Clerk + Social Providers

### Required Providers
- Google OAuth
- LinkedIn OAuth
- Meta/Facebook OAuth

### Implementation
- Clerk for auth and session management
- `/sign-in` and `/sign-up` routes using Clerk components
- `middleware.ts` protects all internal routes
- Post-signup: route to `/onboarding` for role selection
- Clerk `userId` is primary identity key in database

See `docs/AUTH_PROVIDERS.md` for OAuth setup.

---

## 3. Monetization

**Primary**: Pay-per-consult via Stripe Checkout

- Session SKUs: 30 / 60 / 90 minutes
- Optional fixed-price audit SKUs
- Entitlements based on payment success

Subscriptions: postponed to later stage.

---

## 4. Domain Scope

Support all AI/IT sectors via flexible taxonomy + AI classification:

- Domain tags: LLMs, MLOps, data, security, infra, product architecture, ERP integration, etc.
- AI suggests tags + clarifying questions during intake
- Do not block requests that don't fit a narrow vertical

---

## 5. MVP Flows

### 5.1 Auth Gating
No internal access without login.

### 5.2 Onboarding (post-login)
- Role selection: Consultant / Client / Both
- Consultant profile: skills, rate, availability, bio, languages, consent, references
- Client profile: organization + billing info + preferences

### 5.3 Request Intake Wizard
- Input: messy problem description
- Output: AI-refined structured scope
  - Summary, constraints, desired outcome
  - Suggested duration
  - Sensitive-data warning

### 5.4 Matching & Booking
- Client can book consultant directly or publish request
- Consultants accept/decline
- AI suggests matches with explanations

### 5.5 Engagement Workspace
- Chat + agenda + checklist + notes + links
- Video link field (external provider)

### 5.6 Payments
- Stripe Checkout + webhook verification
- Create entitlements on success
- Lock workspace if unpaid

### 5.7 Closure & Transfer (Mandatory)
"Transfer Pack" generator:
- Summary
- Decisions
- Runbook
- Next steps
- Internalization checklist

### 5.8 Reviews
- Client → Consultant rating
- Consultant → Client/Request rating (anti-abuse)

### 5.9 Hive Mind (Members-Only)
- Pattern Library (anonymized)
- Prompt Library (sanitized)
- Stack Templates (text-based)

**Contributions MUST go through redaction.**

---

## 6. Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Clerk auth
- Stripe payments
- Sentry
- PostHog analytics (with consent)

### Mobile Path
- MVP as responsive web + PWA
- Domain logic modular for future React Native/Expo

---

## 7. Data Model (Prisma)

### User & Organization
- User (maps to Clerk userId)
- Organization
- Membership/Role

### Profiles
- ConsultantProfile
- ClientProfile

### Skills & Availability
- SkillTag
- ConsultantSkill
- Availability
- Reference

### Requests & Matching
- Request
- Offer/Match
- Booking
- Engagement

### Engagement Artifacts
- Message
- Note
- ArtifactLink

### Payments
- ProductSKU
- Payment (Stripe refs)
- Entitlement

### Hive Mind
- Pattern
- Prompt
- StackTemplate

### Audit & Safety
- Review
- ConsentLog
- RedactionJob
- AuditLog

---

## 8. Deliverables

- [x] Full repo + file tree
- [x] Prisma schema + migrations + seed
- [x] Clerk integration + middleware gating + onboarding
- [x] Stripe checkout + webhook verification
- [x] AI adapter + redaction pipeline
- [x] Core pages (landing, auth, onboarding, directory, profile, request wizard, booking, workspace, checkout, transfer pack, hive, admin)
- [x] README + DECISIONS.md + AUTH_PROVIDERS.md
