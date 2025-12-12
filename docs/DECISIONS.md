# DECISIONS

This file records key decisions, trade-offs, and non-negotiable constraints for the Gaia Hive platform.
It exists to prevent amnesia and accidental drift into “just another marketplace”.

## Non-negotiables (Product Physics)
- **No anonymous browsing.** Anything meaningful is inside the hive and requires authentication.
  - Enforced via middleware + server-side guards, not only UI hiding.
- **Platform is scaffolding, not a toll bridge.**
  - Engagements must end with a Transfer Pack that biases toward internalization.
- **Hive mind is members-only and ethereal.**
  - We store anonymized patterns/prompts/templates, not client IP or raw artifacts.

## Stack choices
- **Next.js App Router + TypeScript**
  - Chosen for fastest iteration + full-stack shipping in 72h.
  - Trade-off: App Router complexity; mitigated with clear folder conventions.
- **Postgres + Prisma**
  - Chosen for speed + relational clarity.
- **Clerk for auth**
  - Chosen to ship Google/LinkedIn/Meta login quickly and reliably.
  - Trade-off: vendor dependency; mitigated by storing only Clerk `userId` + minimal profile in DB.
- **Stripe Checkout**
  - Chosen for fastest pay-per-consult monetization and clean webhook entitlements.

## MVP scope cuts (conscious omissions)
- No subscriptions in MVP (only pay-per-consult).
- No built-in video calling (only external link field).
- No heavy KYC / skill verification (lightweight references only).
- No public hive content (members-only only).
- No complex matching algorithm (tag + availability + reputation first).

## AI boundaries
- AI assists intake refinement, matching suggestions, transfer pack drafting, and redaction.
- AI does **not** finalize decisions without human confirmation.
- Nothing enters hive libraries unless it passes a mandatory redaction/anonymization step.

## Privacy & legal posture (MVP)
- Data minimization: store only what is necessary for operations and payments.
- Deletion: design for user deletion requests (esp. hive contributions).
- Terms/Privacy are MVP templates pending legal review before scaling.

## Known weaknesses / TODOs
- Matching is naive (improve with embeddings later).
- Moderation and dispute handling are minimal (admin tooling later).
- LinkedIn provider setup may have higher friction than Google/Meta.
