/**
 * CODE VERIFICATION TESTS
 *
 * Questi test verificano la logica del codice senza necessità di
 * connessione al database o autenticazione.
 *
 * Eseguire con: npm run test
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

// Helper per leggere file
const readFile = (relativePath: string) => {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8')
}

const fileExists = (relativePath: string) => {
  return fs.existsSync(path.join(ROOT, relativePath))
}

// ============================================
// 1. MIDDLEWARE & ROUTE PROTECTION
// ============================================

describe('MW - Middleware & Route Protection', () => {
  const middleware = readFile('src/middleware.ts')

  it('MW-001: Route "/" is public', () => {
    expect(middleware).toContain("'/'")
    expect(middleware).toContain('isPublicRoute')
  })

  it('MW-002: Route "/sign-in" is public', () => {
    expect(middleware).toContain("'/sign-in(.*)'")
  })

  it('MW-003: Route "/sign-up" is public', () => {
    expect(middleware).toContain("'/sign-up(.*)'")
  })

  it('MW-004: Route "/api/webhooks" is public', () => {
    expect(middleware).toContain("'/api/webhooks(.*)'")
  })

  it('MW-005: Non-public routes call auth.protect()', () => {
    expect(middleware).toContain('auth.protect()')
  })

  it('MW-006: Middleware uses Clerk', () => {
    expect(middleware).toContain('clerkMiddleware')
    expect(middleware).toContain('@clerk/nextjs/server')
  })
})

// ============================================
// 2. ROLE-BASED ACCESS CONTROL
// ============================================

describe('RBAC - Role-Based Access Control', () => {

  it('RBAC-001: CONSULTANT without client profile cannot access /app/requests/new', () => {
    const layout = readFile('src/app/(protected)/app/requests/new/layout.tsx')
    expect(layout).toContain('user?.role === "CONSULTANT"')
    expect(layout).toContain('redirect("/app/requests")')
    // But consultant WITH client profile can book
    expect(layout).toContain('clientProfile')
  })

  it('RBAC-002: Dashboard shows different content based on role', () => {
    const dashboard = readFile('src/app/(protected)/app/page.tsx')
    expect(dashboard).toContain('showClientsInDirectory')
    expect(dashboard).toContain('user.role === "CONSULTANT"')
  })

  it('RBAC-003: Sidebar hides "New Request" for CONSULTANT', () => {
    const sidebar = readFile('src/components/app-sidebar.tsx')
    expect(sidebar).toContain('user.role === "CLIENT" || user.role === "BOTH"')
    expect(sidebar).toContain('/app/requests/new')
  })

  it('RBAC-004: Directory shows both consultants and clients for consultants via tabs', () => {
    const directory = readFile('src/app/(protected)/app/directory/page.tsx')
    expect(directory).toContain('isConsultant')
    expect(directory).toContain('Available Consultants')
    expect(directory).toContain('Clients')
    expect(directory).toContain('TabsList')
  })

  it('RBAC-005: Offers API checks consultant role', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('user.role !== "CONSULTANT" && user.role !== "BOTH"')
    expect(offers).toContain('Only consultants can make offers')
  })
})

// ============================================
// 3. API VALIDATION & ERROR HANDLING
// ============================================

describe('API - Validation & Error Handling', () => {

  it('API-001: Hive contribute requires type, title, content', () => {
    const contribute = readFile('src/app/api/hive/contribute/route.ts')
    expect(contribute).toContain('!type || !title || !content')
    expect(contribute).toContain('Missing required fields')
    expect(contribute).toContain('status: 400')
  })

  it('API-002: Offers API returns 401 for unauthenticated', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('if (!user)')
    expect(offers).toContain('status: 401')
  })

  it('API-003: Offers API returns 403 for non-consultants', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('status: 403')
  })

  it('API-004: Offers API returns 404 for missing request', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('Request not found')
    expect(offers).toContain('status: 404')
  })

  it('API-005: Offers API prevents duplicate offers', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('existingOffer')
    expect(offers).toContain('already made an offer')
  })

  it('API-006: Checkout API returns 401 for unauthenticated', () => {
    const checkout = readFile('src/app/api/checkout/route.ts')
    expect(checkout).toContain('if (!user)')
    expect(checkout).toContain('status: 401')
  })

  it('API-007: Checkout API returns 403 if not booking client', () => {
    const checkout = readFile('src/app/api/checkout/route.ts')
    expect(checkout).toContain('booking.clientId !== user.id')
    expect(checkout).toContain('status: 403')
  })

  it('API-008: Checkout API returns 404 for missing booking', () => {
    const checkout = readFile('src/app/api/checkout/route.ts')
    expect(checkout).toContain('Booking not found')
    expect(checkout).toContain('status: 404')
  })

  it('API-009: Requests API returns 401 for unauthenticated', () => {
    const requests = readFile('src/app/api/requests/route.ts')
    expect(requests).toContain('if (!user)')
    expect(requests).toContain('status: 401')
  })
})

// ============================================
// 4. STRIPE WEBHOOK SECURITY
// ============================================

describe('SEC - Stripe Webhook Security', () => {
  const webhook = readFile('src/app/api/webhooks/stripe/route.ts')

  it('SEC-001: Webhook verifies signature', () => {
    expect(webhook).toContain('stripe.webhooks.constructEvent')
    expect(webhook).toContain('stripe-signature')
  })

  it('SEC-002: Webhook returns 400 for missing signature', () => {
    expect(webhook).toContain('No signature')
    expect(webhook).toContain('status: 400')
  })

  it('SEC-003: Webhook returns 400 for invalid signature', () => {
    expect(webhook).toContain('Invalid signature')
    expect(webhook).toContain('status: 400')
  })

  it('SEC-004: Webhook handles checkout.session.completed', () => {
    expect(webhook).toContain('checkout.session.completed')
    expect(webhook).toContain('payment_status === "paid"')
  })

  it('SEC-005: Webhook handles checkout.session.expired', () => {
    expect(webhook).toContain('checkout.session.expired')
    expect(webhook).toContain('CANCELLED')
  })

  it('SEC-006: Webhook handles payment_intent.payment_failed', () => {
    expect(webhook).toContain('payment_intent.payment_failed')
    expect(webhook).toContain('FAILED')
  })

  it('SEC-007: Webhook creates audit log on payment', () => {
    expect(webhook).toContain('PAYMENT_COMPLETED')
    expect(webhook).toContain('auditLog.create')
  })
})

// ============================================
// 5. DATABASE SCHEMA VALIDATION
// ============================================

describe('DB - Database Schema', () => {
  const schema = readFile('prisma/schema.prisma')

  it('DB-001: User has clerkId unique constraint', () => {
    expect(schema).toContain('clerkId')
    expect(schema).toContain('@unique')
  })

  it('DB-002: User has email unique constraint', () => {
    expect(schema).toMatch(/email\s+String\s+@unique/)
  })

  it('DB-003: UserRole enum has all roles', () => {
    expect(schema).toContain('CLIENT')
    expect(schema).toContain('CONSULTANT')
    expect(schema).toContain('BOTH')
    expect(schema).toContain('ADMIN')
  })

  it('DB-004: ConsultantProfile has userId unique', () => {
    expect(schema).toMatch(/model ConsultantProfile[\s\S]*?userId\s+String\s+@unique/)
  })

  it('DB-005: ConsultantProfile has consentDirectory field', () => {
    expect(schema).toContain('consentDirectory')
  })

  it('DB-006: ConsultantProfile has consentHiveMind field', () => {
    expect(schema).toContain('consentHiveMind')
  })

  it('DB-007: Offer has composite unique on requestId_consultantId', () => {
    expect(schema).toContain('@@unique([requestId, consultantId])')
  })

  it('DB-008: Request has all status values', () => {
    expect(schema).toContain('DRAFT')
    expect(schema).toContain('PUBLISHED')
    expect(schema).toContain('MATCHING')
    expect(schema).toContain('BOOKED')
  })

  it('DB-009: Payment has stripeSessionId', () => {
    expect(schema).toContain('stripeSessionId')
  })

  it('DB-010: StackTemplate has tech fields', () => {
    expect(schema).toContain('uiTech')
    expect(schema).toContain('backendTech')
    expect(schema).toContain('databaseTech')
    expect(schema).toContain('releaseTech')
  })

  it('DB-011: HiveItemStatus has PENDING_REVIEW', () => {
    expect(schema).toContain('PENDING_REVIEW')
    expect(schema).toContain('APPROVED')
    expect(schema).toContain('REJECTED')
  })

  it('DB-012: Pattern, Prompt, StackTemplate have engagementId', () => {
    expect(schema).toMatch(/model Pattern[\s\S]*?engagementId\s+String\?/)
    expect(schema).toMatch(/model Prompt[\s\S]*?engagementId\s+String\?/)
    expect(schema).toMatch(/model StackTemplate[\s\S]*?engagementId\s+String\?/)
  })

  it('DB-013: Engagement has patterns, prompts, stacks relations', () => {
    expect(schema).toMatch(/model Engagement[\s\S]*?patterns\s+Pattern\[\]/)
    expect(schema).toMatch(/model Engagement[\s\S]*?prompts\s+Prompt\[\]/)
    expect(schema).toMatch(/model Engagement[\s\S]*?stacks\s+StackTemplate\[\]/)
  })
})

// ============================================
// 6. BUSINESS LOGIC VERIFICATION
// ============================================

describe('BIZ - Business Logic', () => {

  it('BIZ-001: Request budget converted to cents', () => {
    const requests = readFile('src/app/api/requests/route.ts')
    expect(requests).toContain('parseInt(budget) * 100')
  })

  it('BIZ-002: Offer proposed rate converted to cents', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('parseInt(proposedRate) * 100')
  })

  it('BIZ-003: Request status changes to MATCHING on first offer', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('status: "MATCHING"')
    expect(offers).toContain('req.status === "PUBLISHED"')
  })

  it('BIZ-004: Only open requests accept offers', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('status !== "PUBLISHED" && req.status !== "MATCHING"')
  })

  it('BIZ-005: Direct booking creates offer and sets isPublic=false', () => {
    const requests = readFile('src/app/api/requests/route.ts')
    expect(requests).toContain('consultantId')
    expect(requests).toContain('isPublic: false')
  })

  it('BIZ-006: Webhook updates booking status to CONFIRMED', () => {
    const webhook = readFile('src/app/api/webhooks/stripe/route.ts')
    expect(webhook).toContain('status: "CONFIRMED"')
  })

  it('BIZ-007: Webhook creates entitlement based on duration', () => {
    const webhook = readFile('src/app/api/webhooks/stripe/route.ts')
    expect(webhook).toContain('SESSION_30')
    expect(webhook).toContain('SESSION_60')
    expect(webhook).toContain('SESSION_90')
  })

  it('BIZ-008: Hive contributions default to PENDING_REVIEW', () => {
    const contribute = readFile('src/app/api/hive/contribute/route.ts')
    expect(contribute).toContain('status: "PENDING_REVIEW"')
  })

  it('BIZ-009: Hive contributions create audit log', () => {
    const contribute = readFile('src/app/api/hive/contribute/route.ts')
    expect(contribute).toContain('HIVE_CONTRIBUTION')
    expect(contribute).toContain('auditLog.create')
  })

  it('BIZ-010: Offers API creates audit log', () => {
    const offers = readFile('src/app/api/offers/route.ts')
    expect(offers).toContain('OFFER_CREATED')
    expect(offers).toContain('auditLog.create')
  })
})

// ============================================
// 7. DIRECTORY QUERY LOGIC
// ============================================

describe('DIR - Directory Query Logic', () => {
  const directory = readFile('src/app/(protected)/app/directory/page.tsx')

  it('DIR-001: Consultant directory filters by isAvailable', () => {
    expect(directory).toContain('isAvailable: true')
  })

  it('DIR-002: Consultant directory filters by consentDirectory', () => {
    expect(directory).toContain('consentDirectory: true')
  })

  it('DIR-003: Directory excludes current user', () => {
    expect(directory).toContain('userId: { not: user.id }')
  })

  it('DIR-004: Consultant directory supports skill filter', () => {
    expect(directory).toContain('skillFilter')
    expect(directory).toContain('skillTag')
  })

  it('DIR-005: Directory supports search query', () => {
    expect(directory).toContain('query')
    expect(directory).toContain('contains')
    expect(directory).toContain('mode: "insensitive"')
  })
})

// ============================================
// 8. THEME SUPPORT
// ============================================

describe('THEME - Theme Support', () => {

  it('THEME-001: Theme provider exists', () => {
    expect(fileExists('src/components/theme-provider.tsx')).toBe(true)
  })

  it('THEME-002: Theme toggle exists', () => {
    expect(fileExists('src/components/theme-toggle.tsx')).toBe(true)
  })

  it('THEME-003: Theme provider uses next-themes', () => {
    const provider = readFile('src/components/theme-provider.tsx')
    expect(provider).toContain('next-themes')
    expect(provider).toContain('ThemeProvider')
  })

  it('THEME-004: Theme toggle switches between light/dark', () => {
    const toggle = readFile('src/components/theme-toggle.tsx')
    expect(toggle).toContain('setTheme')
    expect(toggle).toContain('"dark"')
    expect(toggle).toContain('"light"')
  })

  it('THEME-005: Root layout includes theme provider', () => {
    const layout = readFile('src/app/layout.tsx')
    expect(layout).toContain('ThemeProvider')
    expect(layout).toContain('defaultTheme')
  })

  it('THEME-006: CSS has dark mode variables', () => {
    const css = readFile('src/app/globals.css')
    expect(css).toContain('.dark')
    expect(css).toContain('--background')
    expect(css).toContain('--foreground')
  })
})

// ============================================
// 9. FILE STRUCTURE
// ============================================

describe('STRUCT - File Structure', () => {

  it('STRUCT-001: Auth library exists', () => {
    expect(fileExists('src/lib/auth.ts')).toBe(true)
  })

  it('STRUCT-002: Database library exists', () => {
    expect(fileExists('src/lib/db.ts')).toBe(true)
  })

  it('STRUCT-003: Stripe client exists', () => {
    expect(fileExists('src/lib/stripe/client.ts')).toBe(true)
  })

  it('STRUCT-004: Prisma schema exists', () => {
    expect(fileExists('prisma/schema.prisma')).toBe(true)
  })

  it('STRUCT-005: Middleware exists', () => {
    expect(fileExists('src/middleware.ts')).toBe(true)
  })

  it('STRUCT-006: Protected app layout exists', () => {
    expect(fileExists('src/app/(protected)/app/layout.tsx')).toBe(true)
  })

  it('STRUCT-007: Onboarding page exists', () => {
    expect(fileExists('src/app/(protected)/onboarding/page.tsx')).toBe(true)
  })

  it('STRUCT-008: Hive contribute page exists', () => {
    expect(fileExists('src/app/(protected)/app/hive/contribute/page.tsx')).toBe(true)
  })
})

// ============================================
// 10. SECURITY BEST PRACTICES
// ============================================

describe('SEC-BP - Security Best Practices', () => {

  it('SEC-BP-001: No hardcoded secrets in middleware', () => {
    const middleware = readFile('src/middleware.ts')
    expect(middleware).not.toMatch(/sk_live_/)
    expect(middleware).not.toMatch(/sk_test_/)
    expect(middleware).not.toMatch(/whsec_/)
  })

  it('SEC-BP-002: Environment variables used for Stripe', () => {
    const webhook = readFile('src/app/api/webhooks/stripe/route.ts')
    expect(webhook).toContain('process.env.STRIPE_WEBHOOK_SECRET')
  })

  it('SEC-BP-003: Prisma used for database (prevents SQL injection)', () => {
    const requests = readFile('src/app/api/requests/route.ts')
    expect(requests).toContain('db.request.create')
    expect(requests).toContain('@/lib/db')
  })

  it('SEC-BP-004: User ID from auth, not request body', () => {
    const requests = readFile('src/app/api/requests/route.ts')
    expect(requests).toContain('creatorId: user.id')
    expect(requests).toContain('getCurrentUser()')
  })

  it('SEC-BP-005: Checkout validates booking ownership', () => {
    const checkout = readFile('src/app/api/checkout/route.ts')
    expect(checkout).toContain('booking.clientId !== user.id')
  })
})

// ============================================
// 11. PROFILE & DUAL ROLE SUPPORT
// ============================================

describe('PROFILE - Profile & Dual Role Support', () => {

  it('PROFILE-001: Settings page exists', () => {
    expect(fileExists('src/app/(protected)/app/settings/page.tsx')).toBe(true)
  })

  it('PROFILE-002: Settings shows under construction message', () => {
    const settings = readFile('src/app/(protected)/app/settings/page.tsx')
    expect(settings).toContain('Under Construction')
    expect(settings).toContain('Construction')
  })

  it('PROFILE-003: Profile page supports photo upload', () => {
    const profile = readFile('src/app/(protected)/app/profile/page.tsx')
    expect(profile).toContain('handlePhotoUpload')
    expect(profile).toContain('fileInputRef')
    expect(profile).toContain('uploadingPhoto')
  })

  it('PROFILE-004: Profile API supports consultant fields', () => {
    const consultantApi = readFile('src/app/api/profile/consultant/route.ts')
    expect(consultantApi).toContain('portfolioUrl')
    expect(consultantApi).toContain('timezone')
    expect(consultantApi).toContain('yearsExperience')
    expect(consultantApi).toContain('isAvailable')
    expect(consultantApi).toContain('consentDirectory')
  })

  it('PROFILE-005: Client profile API supports POST for creation', () => {
    const clientApi = readFile('src/app/api/profile/client/route.ts')
    expect(clientApi).toContain('export async function POST')
    expect(clientApi).toContain('clientProfile.create')
  })

  it('PROFILE-006: Client profile creation updates role to BOTH for consultants', () => {
    const clientApi = readFile('src/app/api/profile/client/route.ts')
    expect(clientApi).toContain('role: "BOTH"')
    expect(clientApi).toContain('user.role === "CONSULTANT"')
  })

  it('PROFILE-007: Profile page allows consultants to create client profile', () => {
    const profile = readFile('src/app/(protected)/app/profile/page.tsx')
    expect(profile).toContain('handleCreateClientProfile')
    expect(profile).toContain('Also need consulting services?')
  })
})

// ============================================
// 12. HIVE MIND CONTRIBUTIONS
// ============================================

describe('HIVE - Hive Mind Contributions', () => {

  it('HIVE-001: Hive page shows user own contributions regardless of status', () => {
    const hive = readFile('src/app/(protected)/app/hive/page.tsx')
    expect(hive).toContain('creatorId: user.id')
    expect(hive).toContain('OR')
  })

  it('HIVE-002: Hive data table shows status badge for contributions', () => {
    const hiveTable = readFile('src/components/hive-data-table.tsx')
    expect(hiveTable).toContain('StatusBadge')
    expect(hiveTable).toContain('Pending Review')
    expect(hiveTable).toContain('APPROVED')
  })

  it('HIVE-003: Hive data table shows (You) for own contributions', () => {
    const hiveTable = readFile('src/components/hive-data-table.tsx')
    expect(hiveTable).toContain('(You)')
    expect(hiveTable).toContain('creatorId === currentUserId')
  })

  it('HIVE-004: Hive data table shows technology fields for stacks', () => {
    const hiveTable = readFile('src/components/hive-data-table.tsx')
    expect(hiveTable).toContain('stack.uiTech')
    expect(hiveTable).toContain('stack.backendTech')
    expect(hiveTable).toContain('stack.databaseTech')
    expect(hiveTable).toContain('stack.releaseTech')
  })

  it('HIVE-005: Hive data table has expandable rows with tabs for patterns/prompts/stacks', () => {
    const hiveTable = readFile('src/components/hive-data-table.tsx')
    expect(hiveTable).toContain('expandedId')
    expect(hiveTable).toContain('toggleExpand')
    expect(hiveTable).toContain('TabsContent')
    expect(hiveTable).toContain('value="patterns"')
    expect(hiveTable).toContain('value="prompts"')
    expect(hiveTable).toContain('value="stacks"')
  })

  it('HIVE-006: Hive data table shows Client and Consultant columns', () => {
    const hiveTable = readFile('src/components/hive-data-table.tsx')
    expect(hiveTable).toContain('clientName')
    expect(hiveTable).toContain('consultantName')
    expect(hiveTable).toContain('Client')
    expect(hiveTable).toContain('Consultant')
  })

  it('HIVE-007: Hive page uses HiveDataTable component', () => {
    const hive = readFile('src/app/(protected)/app/hive/page.tsx')
    expect(hive).toContain('HiveDataTable')
    expect(hive).toContain('import { HiveDataTable }')
  })
})

// ============================================
// 13. BOOKING FLOW
// ============================================

describe('BOOKING - Consultant Booking Flow', () => {

  it('BOOKING-001: Consultant profile page has book button for clients', () => {
    const consultantProfile = readFile('src/app/(protected)/app/directory/[id]/page.tsx')
    expect(consultantProfile).toContain('Book Session')
    expect(consultantProfile).toContain('canBook')
  })

  it('BOOKING-002: Consultant-only users see message to create client profile', () => {
    const consultantProfile = readFile('src/app/(protected)/app/directory/[id]/page.tsx')
    expect(consultantProfile).toContain('isConsultantOnly')
    expect(consultantProfile).toContain('CreateClientProfileButton')
    expect(consultantProfile).toContain('Create a client profile to book')
  })

  it('BOOKING-003: Request page accepts consultant query param for direct booking', () => {
    const newRequest = readFile('src/app/(protected)/app/requests/new/page.tsx')
    expect(newRequest).toContain('directConsultantId')
    expect(newRequest).toContain('searchParams.get("consultant")')
  })

  it('BOOKING-004: Layout allows consultant with client profile to book', () => {
    const layout = readFile('src/app/(protected)/app/requests/new/layout.tsx')
    expect(layout).toContain('clientProfile')
    expect(layout).toContain('role: "BOTH"')
  })
})

// ============================================
// 14. EMAIL NOTIFICATIONS
// ============================================

describe('EMAIL - Email Notifications', () => {

  it('EMAIL-001: Email library exists with sendEmail function', () => {
    const email = readFile('src/lib/email.ts')
    expect(email).toContain('export async function sendEmail')
    expect(email).toContain('Resend')
    expect(email).toContain('RESEND_API_KEY')
  })

  it('EMAIL-002: Email has getNewRequestEmailHtml template', () => {
    const email = readFile('src/lib/email.ts')
    expect(email).toContain('getNewRequestEmailHtml')
    expect(email).toContain('consultantName')
    expect(email).toContain('clientName')
    expect(email).toContain('requestTitle')
  })

  it('EMAIL-003: Requests API sends email on direct booking', () => {
    const requests = readFile('src/app/api/requests/route.ts')
    expect(requests).toContain('sendEmail')
    expect(requests).toContain('getNewRequestEmailHtml')
    expect(requests).toContain('consultantProfile.user.email')
  })

  it('EMAIL-004: Email gracefully handles missing API key', () => {
    const email = readFile('src/lib/email.ts')
    expect(email).toContain('if (!process.env.RESEND_API_KEY)')
    expect(email).toContain('skipped: true')
  })
})
