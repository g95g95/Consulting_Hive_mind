- # Auth Providers (Clerk): Google, LinkedIn, Meta (Facebook)

  This project uses **Clerk** for authentication.
  Internal routes are gated: no anonymous browsing is allowed.

  ## 1) Clerk setup
  1. Create a Clerk application.
  2. Add the following env vars:

  ### `.env.local`
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
  CLERK_SECRET_KEY=sk_...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

  ## 2) Enable providers in Clerk
  In Clerk Dashboard:
  - **User & Authentication → Social Connections**
  Enable:
  - Google
  - LinkedIn
  - Facebook (Meta)

  Clerk will ask for OAuth credentials for each provider.

  ## 3) Google OAuth credentials
  Create in Google Cloud Console:
  - OAuth consent screen
  - OAuth client ID (Web)

  Set authorized redirect URIs exactly as shown in Clerk Dashboard.

  Typical redirect URI format (check Clerk for the exact value):
  - https://<your-clerk-domain>/v1/oauth_callback

  ## 4) LinkedIn OAuth credentials
  Create a LinkedIn App:
  - Products: “Sign In with LinkedIn” (and any required basic profile/email scopes)

  Set redirect URI exactly as shown in Clerk Dashboard.

  Note: LinkedIn may require additional verification for some scopes.
  Keep scopes minimal: basic profile + email.

  ## 5) Meta/Facebook OAuth credentials
  Create a Meta App:
  - Add Facebook Login product

  Set:
  - Valid OAuth Redirect URIs (as shown in Clerk Dashboard)

  Keep permissions minimal:
  - email
  - public_profile

  ## 6) Local development notes
  - Use ngrok or a stable dev URL if providers require HTTPS callbacks.
  - Confirm the callback URLs match Clerk’s required redirects.
  - If login fails, check:
    - Redirect URI mismatch
    - App mode (dev/live) in provider dashboards
    - Missing permissions/scopes

  ## 7) Production checklist
  - Configure production domain in Clerk.
  - Update provider redirect URIs for production.
  - Rotate secrets if accidentally committed.
