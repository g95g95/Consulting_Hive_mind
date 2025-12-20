# Learnt - Patterns and Bug Fixes

This file documents recurring patterns and issues encountered during development.

---

## 1. Role-Based UI Elements Must Be Consistent Across All Pages

**Issue**: When implementing role-based features (e.g., CONSULTANT vs CLIENT), it's easy to miss UI elements in different pages that should also change based on role.

**Example**: The "Browse consultants" text and "Available Consultants" counter appeared in multiple places:
- Sidebar (app-sidebar.tsx)
- Requests page (requests/page.tsx)
- Dashboard page (app/page.tsx)
- Directory page (directory/page.tsx)

**Solution**: When implementing role-based logic:
1. Search for ALL occurrences of the text/feature across the codebase
2. Create a checklist of all pages that need updating
3. Use consistent variable naming (e.g., `isConsultantOnly`, `canCreateRequests`, `showClientsInDirectory`)

**Files typically affected by role-based changes**:
- `src/app/(protected)/app/page.tsx` - Dashboard
- `src/app/(protected)/app/directory/page.tsx` - Directory listing
- `src/app/(protected)/app/requests/page.tsx` - Requests list
- `src/components/app-sidebar.tsx` - Navigation sidebar

---

## 2. Prisma Relation Field Names

**Issue**: Prisma relation field names may differ from what you expect.

**Example**: `ConsultantSkill` has `skillTag` not `skill`:
```typescript
// Wrong
include: { skills: { include: { skill: true } } }

// Correct
include: { skills: { include: { skillTag: true } } }
```

**Solution**: Always check `prisma/schema.prisma` for exact relation names before writing queries.

---

## 3. Environment Files: .env vs .env.local

**Issue**: Next.js uses `.env.local` for runtime, but Prisma CLI uses `.env` for migrations.

**Solution**: Keep both files in sync, or copy `.env.local` to `.env` before running Prisma commands.

---

## 4. Supabase Connection Strings

**Issue**: Supabase connection strings vary by region and type.

**Patterns**:
- Pooled (transaction): `postgresql://postgres.[PROJECT]:[PASS]@aws-X-REGION.pooler.supabase.com:6543/postgres`
- Pooled (session): `postgresql://postgres.[PROJECT]:[PASS]@aws-X-REGION.pooler.supabase.com:5432/postgres`
- Direct: `postgresql://postgres:[PASS]@db.[PROJECT].supabase.co:5432/postgres`

**Solution**:
- Use session pooler (port 5432 via pooler) for Prisma migrations
- Check the exact region (`aws-0` vs `aws-1` etc.) from Supabase dashboard
- URL-encode special characters in passwords (e.g., `#` becomes `%23`)

---

## 5. Prisma Field Name Mismatches (Extended)

**Issue**: Multiple field naming inconsistencies between code and schema.

**Examples found**:
- `skill` should be `skillTag` (in ConsultantSkill)
- `reviewerId`/`revieweeId` should be `authorId`/`targetId` (in Review model)
- `reviewer`/`reviewee` relations should be `author`/`target`
- `avgRating`/`totalReviews` don't exist on ConsultantProfile (rating is computed from Reviews)
- `domain` should be `category` (in Pattern model)
- `reviewedBy`/`reviewedAt` don't exist on Pattern/Prompt/StackTemplate

**Solution**: Always verify field names in `prisma/schema.prisma` before writing queries or updates.

---

## 6. Third-Party SDK Initialization at Module Load Time

**Issue**: SDKs that require API keys will throw errors at build/import time if initialized globally.

**Examples**:
- `new Resend(process.env.RESEND_API_KEY)` throws if key is missing
- `new Stripe(key)` validates API version at load time

**Solution**: Use lazy initialization patterns:
```typescript
// Bad - crashes at import if env var missing
const resend = new Resend(process.env.RESEND_API_KEY);

// Good - only initializes when actually needed
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}
```

---

## 7. Stripe API Version Mismatches

**Issue**: Stripe package version may not match the `apiVersion` string in code.

**Example**:
- Code had `"2025-05-28.basil"` but installed Stripe SDK expected `"2025-11-17.clover"`

**Solution**: Check the installed Stripe version and use the correct API version string that matches your package.
