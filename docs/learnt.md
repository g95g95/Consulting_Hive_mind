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
