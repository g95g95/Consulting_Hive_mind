# E2E Testing Guide

This guide explains how to run the fully automated E2E test suite for Consulting Hive Mind.

## Prerequisites

1. **Database**: PostgreSQL database accessible (Supabase or local)
2. **Environment**: `.env` file with all required variables
3. **Dependencies**: Run `npm install` to install Playwright and test dependencies

## Quick Start

```bash
# Run all E2E tests (includes automatic database seeding)
npm run test:e2e

# Run tests with UI for debugging
npm run test:e2e:ui

# Run tests in headed browser mode
npm run test:e2e:headed
```

## Test Architecture

### Test Data Seeding

The E2E tests use deterministic test data that is seeded automatically before each test run.

**Test Users:**

| User | Email | Role | Purpose |
|------|-------|------|---------|
| Elena Client | e2e-client@test.local | CLIENT | Testing client-only flows |
| Marco Consultant | e2e-consultant@test.local | CONSULTANT | Testing consultant-only flows |
| Sofia Both | e2e-both@test.local | BOTH | Testing dual-role functionality |
| New User | e2e-new@test.local | CLIENT | Testing onboarding flow |

**Pre-seeded Data:**
- Open request (PUBLISHED status)
- Request with pending offer (MATCHING status)
- Paid engagement with messages, notes, checklist
- Unpaid engagement for payment testing
- Approved Hive Mind items (pattern, prompt, stack)
- Pending pattern for moderation testing

### Page Object Model

Tests use the Page Object Model pattern for maintainability:

```
e2e/
├── page-objects/
│   ├── base.page.ts         # Common page utilities
│   ├── dashboard.page.ts    # Dashboard interactions
│   ├── directory.page.ts    # Directory & profiles
│   ├── requests.page.ts     # Request flows
│   ├── engagement.page.ts   # Engagement workspace
│   └── hive-mind.page.ts    # Hive Mind library
├── fixtures/
│   ├── test-data.ts         # Test data definitions
│   └── index.ts             # Playwright fixtures
└── *.spec.ts                # Test specifications
```

### Test Specifications

| File | Coverage | Tests |
|------|----------|-------|
| `dashboard.spec.ts` | Dashboard display, role-based content, quick actions | 12 |
| `directory.spec.ts` | Search, filtering, consultant profiles, booking | 19 |
| `request-creation.spec.ts` | Multi-step wizard, validation, AI refinement | 22 |
| `offers-flow.spec.ts` | Consultant offers, client review, status badges | 14 |
| `engagement.spec.ts` | Workspace tabs, chat, notes, checklist, transfer pack | 22 |
| `hive-mind.spec.ts` | Library view, filtering, contributions | 20 |

**Total: ~109 automated tests**

## Running Specific Tests

```bash
# Run single spec file
npx playwright test e2e/dashboard.spec.ts

# Run tests matching pattern
npx playwright test -g "Dashboard"

# Run in specific browser
npx playwright test --project=chromium
```

## Manual Seeding

If you need to seed the database without running tests:

```bash
# Seed E2E test data
npm run test:e2e:seed

# Clean E2E test data only
npm run test:e2e:clean
```

## Authentication

Tests use Clerk's testing mode via `setupClerkTestingToken()`. This bypasses real authentication while still exercising the full auth flow.

```typescript
test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
  // Tests run as authenticated user
});
```

## Debugging Failed Tests

1. **UI Mode**: `npm run test:e2e:ui` - Interactive debugging with time-travel
2. **Headed Mode**: `npm run test:e2e:headed` - Watch browser in real-time
3. **Trace Viewer**: After failure, open `playwright-report/index.html`
4. **Screenshots**: Check `test-results/` for failure screenshots

## CI/CD Integration

For CI pipelines, add these environment variables:
- `CI=true` - Enables CI-specific behaviors
- `DATABASE_URL` - Test database connection
- `DIRECT_URL` - Direct database connection for migrations
- `CLERK_SECRET_KEY` - Clerk API key for testing mode
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key

Example GitHub Actions step:
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CI: true
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Troubleshooting

### Database Connection Errors
Ensure `DATABASE_URL` and `DIRECT_URL` are set correctly in `.env`.

### Clerk Setup Errors
Verify `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are valid.

### Flaky Tests
If tests fail intermittently:
1. Increase timeouts in `playwright.config.ts`
2. Add explicit waits (`await page.waitForLoadState('networkidle')`)
3. Check for race conditions in test data

### Missing Test Data
Run `npm run test:e2e:seed` to manually reset test data.
