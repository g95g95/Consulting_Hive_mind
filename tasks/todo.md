# Consulting Hive Mind - MVP Implementation Plan

## Phase 1: Project Setup & Infrastructure
- [ ] 1.1 Initialize Next.js 14 App Router project with TypeScript
- [ ] 1.2 Configure Tailwind CSS + shadcn/ui
- [ ] 1.3 Setup Prisma with PostgreSQL connection
- [ ] 1.4 Create .env.example with all required variables
- [ ] 1.5 Setup project folder structure

## Phase 2: Database Schema (Prisma)
- [ ] 2.1 Create User model (maps to Clerk userId)
- [ ] 2.2 Create Organization and Membership models
- [ ] 2.3 Create ConsultantProfile and ClientProfile models
- [ ] 2.4 Create SkillTag, ConsultantSkill, Availability, Reference models
- [ ] 2.5 Create Request, Offer, Booking, Engagement models
- [ ] 2.6 Create Message, Note, ArtifactLink models
- [ ] 2.7 Create Review model
- [ ] 2.8 Create ProductSKU, Payment, Entitlement models
- [ ] 2.9 Create Pattern, Prompt, StackTemplate models (Hive Mind)
- [ ] 2.10 Create ConsentLog, RedactionJob, AuditLog models
- [ ] 2.11 Generate Prisma client and create seed file

## Phase 3: Authentication (Clerk)
- [ ] 3.1 Install and configure Clerk for Next.js
- [ ] 3.2 Create middleware.ts for route protection
- [ ] 3.3 Create /sign-in page with Clerk components
- [ ] 3.4 Create /sign-up page with Clerk components
- [ ] 3.5 Add test user support (username: user, password: user)

## Phase 4: Public Pages (Outside the Hive)
- [ ] 4.1 Create Landing page with manifesto
- [ ] 4.2 Create pricing teaser section
- [ ] 4.3 Setup responsive layout with header/footer

## Phase 5: Onboarding Flow
- [ ] 5.1 Create /onboarding page with role selection
- [ ] 5.2 Create consultant profile form (skills, rate, availability, bio, languages)
- [ ] 5.3 Create client profile form (organization, billing info)
- [ ] 5.4 Persist profiles to database with Clerk userId

## Phase 6: Protected App Routes (Inside the Hive)
- [ ] 6.1 Create /app layout with navigation
- [ ] 6.2 Create /app/directory - Consultant directory
- [ ] 6.3 Create /app/directory/[id] - Consultant profile view
- [ ] 6.4 Create /app/profile - User's own profile management

## Phase 7: Request Intake Wizard
- [ ] 7.1 Create /app/requests/new - Multi-step wizard
- [ ] 7.2 Implement AI refinement for messy problem → structured scope
- [ ] 7.3 Generate summary, constraints, desired outcome, suggested duration
- [ ] 7.4 Add sensitive data warning detection

## Phase 8: Matching & Booking
- [ ] 8.1 Create /app/requests - Request listing
- [ ] 8.2 Create /app/requests/[id] - Request detail with matching
- [ ] 8.3 Implement AI-powered match suggestions with explanations
- [ ] 8.4 Create booking flow (consultant accept/decline)

## Phase 9: Payments (Stripe)
- [ ] 9.1 Setup Stripe SDK and environment variables
- [ ] 9.2 Create ProductSKU seeds (30/60/90 min sessions)
- [ ] 9.3 Create /api/checkout endpoint for Stripe Checkout
- [ ] 9.4 Create /api/webhooks/stripe endpoint for webhook verification
- [ ] 9.5 Create checkout success/cancel pages
- [ ] 9.6 Implement entitlement creation on payment success

## Phase 10: Engagement Workspace
- [ ] 10.1 Create /app/engagements - Engagement listing
- [ ] 10.2 Create /app/engagements/[id] - Workspace with tabs
- [ ] 10.3 Implement chat/messages functionality
- [ ] 10.4 Add agenda, checklist, notes, links sections
- [ ] 10.5 Add video link field (external provider)
- [ ] 10.6 Implement workspace locking if unpaid

## Phase 11: Closure & Transfer Pack
- [ ] 11.1 Create transfer pack generator UI
- [ ] 11.2 Implement AI-assisted summary, decisions, runbook generation
- [ ] 11.3 Add next steps and internalization checklist
- [ ] 11.4 Enforce mandatory transfer on engagement closure

## Phase 12: Reviews
- [ ] 12.1 Create review submission for client→consultant
- [ ] 12.2 Create review submission for consultant→client
- [ ] 12.3 Display reviews on profiles

## Phase 13: Hive Mind Libraries
- [ ] 13.1 Create /app/hive - Library hub
- [ ] 13.2 Create Pattern Library (anonymized)
- [ ] 13.3 Create Prompt Library (sanitized)
- [ ] 13.4 Create Stack Templates section
- [ ] 13.5 Implement contribution flow with mandatory redaction

## Phase 14: AI Adapter & Safety
- [ ] 14.1 Create AI provider adapter (Anthropic + OpenAI)
- [ ] 14.2 Implement redaction/anonymization pipeline
- [ ] 14.3 Add PII/secrets detection
- [ ] 14.4 Ensure redaction gate before hive library saves

## Phase 15: Admin & Final Touches
- [ ] 15.1 Create minimal /app/admin for dispute handling
- [ ] 15.2 Add Sentry error tracking
- [ ] 15.3 Add analytics consent (PostHog)
- [ ] 15.4 Create PWA manifest for mobile
- [ ] 15.5 Final README update

---

## E2E UI Testing Implementation (Jan 2026)

### Phase 1 - Initial Setup (Completed Previously)
- [x] Playwright + Clerk testing packages
- [x] Basic config and 38 tests with conditional skips

### Phase 2 - Fully Automated E2E Tests (Jan 2026)

#### Problem
The original 38 tests used `if (visible)` conditionals that skipped tests when data wasn't present, making them non-deterministic and unreliable.

#### Solution
Complete rewrite with:
1. **Deterministic test data seeding** via `prisma/seed-e2e.ts`
2. **Page Object Model** for maintainability
3. **Role-based fixtures** for testing different user types
4. **Automatic seeding** in `e2e/global-setup.ts`

#### Files Created/Modified

**Test Infrastructure:**
- `e2e/fixtures/test-data.ts` - Test user and data definitions
- `prisma/seed-e2e.ts` - Database seeder with cleanup + seed functions
- `e2e/fixtures/index.ts` - Playwright fixtures for role-based testing
- `e2e/global-setup.ts` - Auto-seeds database before tests

**Page Objects (6 files):**
- `e2e/page-objects/base.page.ts` - Common utilities
- `e2e/page-objects/dashboard.page.ts` - Dashboard interactions
- `e2e/page-objects/directory.page.ts` - Directory + profile pages
- `e2e/page-objects/requests.page.ts` - Request flows
- `e2e/page-objects/engagement.page.ts` - Engagement workspace
- `e2e/page-objects/hive-mind.page.ts` - Hive Mind library
- `e2e/page-objects/index.ts` - Exports

**Test Specifications (6 files, ~109 tests):**
| File | Tests | Coverage |
|------|-------|----------|
| `dashboard.spec.ts` | 12 | Role-based dashboard display |
| `directory.spec.ts` | 19 | Search, filtering, profiles |
| `request-creation.spec.ts` | 22 | Multi-step wizard, validation |
| `offers-flow.spec.ts` | 14 | Consultant offers, client review |
| `engagement.spec.ts` | 22 | Workspace tabs, chat, notes |
| `hive-mind.spec.ts` | 20 | Library, filtering, contributions |

**Documentation:**
- `docs/E2E_TESTING.md` - Complete guide for running tests

**NPM Scripts Added:**
```bash
npm run test:e2e        # Run all (auto-seeds database)
npm run test:e2e:ui     # Interactive UI mode
npm run test:e2e:headed # Visible browser
npm run test:e2e:seed   # Manual seed only
npm run test:e2e:clean  # Clean E2E data only
```

#### Test Users
| User | Role | Email |
|------|------|-------|
| Elena Client | CLIENT | e2e-client@test.local |
| Marco Consultant | CONSULTANT | e2e-consultant@test.local |
| Sofia Both | BOTH | e2e-both@test.local |
| New User | CLIENT (not onboarded) | e2e-new@test.local |

#### Pre-seeded Data
- Open request (PUBLISHED)
- Request with pending offer (MATCHING)
- Paid engagement with messages, notes, checklist
- Unpaid engagement
- Approved Hive Mind items (pattern, prompt, stack)
- Pending pattern for moderation testing

---

## Review Section

### Summary
Implemented fully automated E2E test suite with ~109 tests covering all major user flows. Tests are deterministic through database seeding, use Page Object Model for maintainability, and run automatically with `npm run test:e2e`.

### Key Improvements
1. **No more conditional skips** - All tests run with guaranteed data
2. **Role-based testing** - Test flows as CLIENT, CONSULTANT, or BOTH user
3. **Automatic seeding** - Database seeded before each test run
4. **Page Objects** - Centralized selectors for easy maintenance
5. **Documentation** - Complete guide in `docs/E2E_TESTING.md`

### To Run
```bash
npm run test:e2e
```
