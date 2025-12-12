# Test Execution Plan - Cosa Può Fare Claude Code

Questo documento analizza ogni test del TEST_PLAN.md indicando:
- ✅ **Può fare Claude**: Test eseguibile autonomamente
- 🔧 **Può fare con accessi**: Test eseguibile se forniti accessi/credenziali
- 👤 **Richiede utente**: Test che richiede interazione manuale dell'utente

---

## Legenda Simboli

| Simbolo | Significato |
|---------|-------------|
| ✅ | Claude può eseguire autonomamente |
| 🔧 | Claude può eseguire con accessi aggiuntivi |
| 👤 | Richiede interazione manuale utente |
| 📝 | Claude può scrivere test automatico |

---

## 1. Autenticazione e Autorizzazione

### 1.1 Pagine Pubbliche

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| AUTH-001 | Accesso landing page `/` senza login | ✅📝 | `curl http://localhost:3000/` o test Playwright | Dev server running |
| AUTH-002 | Accesso `/sign-in` senza login | ✅📝 | `curl http://localhost:3000/sign-in` | Dev server running |
| AUTH-003 | Accesso `/sign-up` senza login | ✅📝 | `curl http://localhost:3000/sign-up` | Dev server running |
| AUTH-004 | Manifesto visibile nella landing | ✅📝 | Verifico che il componente legga `docs/MANIFESTO.md` | Codice già verificabile |

### 1.2 OAuth Providers

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| AUTH-005 | Login con Google OAuth | 👤 | Richiede click su bottone Google e autenticazione interattiva | Account Google, browser |
| AUTH-006 | Login con LinkedIn OAuth | 👤 | Richiede click su bottone LinkedIn e autenticazione interattiva | Account LinkedIn, browser |
| AUTH-007 | Login con Meta/Facebook OAuth | 👤 | Richiede click su bottone Meta e autenticazione interattiva | Account Facebook, browser |
| AUTH-008 | Login con email/password | 🔧📝 | Playwright test con credenziali test | Credenziali test user |

### 1.3 Protezione Route

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| AUTH-009 | Accesso `/app` senza login | ✅📝 | `curl -I http://localhost:3000/app` verifica redirect 302 | Dev server |
| AUTH-010 | Accesso `/app/directory` senza login | ✅📝 | `curl -I http://localhost:3000/app/directory` | Dev server |
| AUTH-011 | Accesso `/app/requests` senza login | ✅📝 | `curl -I http://localhost:3000/app/requests` | Dev server |
| AUTH-012 | Accesso `/app/hive` senza login | ✅📝 | `curl -I http://localhost:3000/app/hive` | Dev server |
| AUTH-013 | Accesso `/onboarding` senza login | ✅📝 | `curl -I http://localhost:3000/onboarding` | Dev server |
| AUTH-014 | Accesso `/api/webhooks/stripe` senza login | ✅📝 | `curl -X POST http://localhost:3000/api/webhooks/stripe` | Dev server |
| AUTH-015 | Accesso `/api/webhooks/clerk` senza login | ✅📝 | `curl -X POST http://localhost:3000/api/webhooks/clerk` | Dev server |

### 1.4 Sessione Utente

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| AUTH-016 | Logout utente | 👤 | Richiede sessione attiva e click logout | Browser con sessione |
| AUTH-017 | Sessione persistente dopo refresh | 👤 | Richiede browser con sessione e refresh | Browser con sessione |
| AUTH-018 | User creato in DB dopo primo login | 🔧📝 | Query Prisma `db.user.findFirst()` dopo login | DB access + login eseguito |

---

## 2. Onboarding

### 2.1 Selezione Ruolo (Step 1)

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ONB-001 | Selezione ruolo CLIENT | 🔧📝 | Playwright: click su card CLIENT, verifica stato | Auth token/session |
| ONB-002 | Selezione ruolo CONSULTANT | 🔧📝 | Playwright: click su card CONSULTANT | Auth token/session |
| ONB-003 | Selezione ruolo BOTH | 🔧📝 | Playwright: click su card BOTH | Auth token/session |
| ONB-004 | Tentativo procedere senza selezione | 🔧📝 | Playwright: verifica bottone Next disabilitato | Auth token/session |

### 2.2 Profilo Consultant

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ONB-005 | Campo headline obbligatorio | ✅📝 | Unit test su validazione form / Playwright | Nessuno |
| ONB-006 | Selezione almeno una skill | ✅📝 | Unit test validazione | Nessuno |
| ONB-007 | Inserimento hourly rate | 🔧📝 | API test POST /api/onboarding con rate | Auth token |
| ONB-008 | Selezione lingue multiple | 🔧📝 | API test con array lingue | Auth token |
| ONB-009 | Inserimento LinkedIn URL | 🔧📝 | API test con URL | Auth token |
| ONB-010 | Inserimento anni esperienza | 🔧📝 | API test con valore numerico | Auth token |

### 2.3 Profilo Client

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ONB-011 | Campo company name opzionale | ✅📝 | Verifico schema/validazione non richiede campo | Codice |
| ONB-012 | Campo company role opzionale | ✅📝 | Verifico schema/validazione | Codice |
| ONB-013 | Campo billing email opzionale | ✅📝 | Verifico schema/validazione | Codice |

### 2.4 Privacy e Consensi

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ONB-014 | Consenso directory listing | 🔧📝 | API test + query DB consentDirectory | Auth + DB |
| ONB-015 | Consenso Hive Mind | 🔧📝 | API test + query DB consentHiveMind | Auth + DB |
| ONB-016 | Accettazione ToS | 🔧📝 | API test + query ConsentLog | Auth + DB |
| ONB-017 | Completamento onboarding | 🔧📝 | API test + verifica User.onboarded=true | Auth + DB |

### 2.5 Flusso Completo

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ONB-018 | Onboarding completo CLIENT | 🔧📝 | E2E test Playwright o API sequence | Auth token nuovo user |
| ONB-019 | Onboarding completo CONSULTANT | 🔧📝 | E2E test Playwright o API sequence | Auth token nuovo user |
| ONB-020 | Onboarding completo BOTH | 🔧📝 | E2E test Playwright o API sequence | Auth token nuovo user |
| ONB-021 | Utente già onboarded redirect | 🔧📝 | Curl con auth header a /onboarding | Auth token user onboarded |

---

## 3. Dashboard

### 3.1 Stats Cards

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| DASH-001 | Card "My Requests" conteggio | 🔧📝 | Render test + mock data / API test | Auth + test data |
| DASH-002 | Card "Engagements" conteggio | 🔧📝 | Render test + mock data | Auth + test data |
| DASH-003 | Card "Available Consultants" (CLIENT) | 🔧📝 | Login come CLIENT, verifica UI | Auth CLIENT |
| DASH-004 | Card "Available Clients" (CONSULTANT) | 🔧📝 | Login come CONSULTANT, verifica UI | Auth CONSULTANT |
| DASH-005 | Card "Your Role" badge | 🔧📝 | Render test per ogni ruolo | Auth per ruolo |

### 3.2 Quick Actions

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| DASH-006 | CLIENT vede "Create new request" | 🔧📝 | Render test con user.role=CLIENT | Auth CLIENT |
| DASH-007 | CONSULTANT non vede "Create new request" | 🔧📝 | Render test con user.role=CONSULTANT | Auth CONSULTANT |
| DASH-008 | BOTH vede "Create new request" | 🔧📝 | Render test con user.role=BOTH | Auth BOTH |
| DASH-009 | CLIENT vede "Browse consultants" | ✅ | Verifico codice condizionale in page.tsx | Già fatto |
| DASH-010 | CONSULTANT vede "Browse clients" | ✅ | Verifico codice condizionale in page.tsx | Già fatto |
| DASH-011 | Bottone "Explore Hive Mind" | ✅📝 | Verifico link presente in codice | Codice |

### 3.3-3.4 Recent Engagements & Active Requests

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| DASH-012 a 019 | Vari test lista | 🔧📝 | Query DB + render test con dati | Auth + test data in DB |

---

## 4. Directory

### 4.1 Vista CLIENT/BOTH

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| DIR-001 | Titolo "Consultant Directory" | 🔧📝 | Render test o curl con auth CLIENT | Auth CLIENT |
| DIR-002 | Solo isAvailable=true | ✅📝 | Unit test su query Prisma in page.tsx | Codice |
| DIR-003 | Solo consentDirectory=true | ✅📝 | Unit test su query Prisma | Codice |
| DIR-004 | Esclude se stesso | ✅📝 | Unit test su query where userId != | Codice |
| DIR-005 a 008 | Display consultant info | 🔧📝 | Render test con mock consultant | Mock data |

### 4.2 Vista CONSULTANT

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| DIR-009 | Titolo "Client Directory" | 🔧📝 | Render test o curl con auth CONSULTANT | Auth CONSULTANT |
| DIR-010 a 013 | Display client info | 🔧📝 | Render test con mock client | Mock data |

### 4.3 Ricerca e Filtri

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| DIR-014 a 019 | Ricerca e filtri | 🔧📝 | API test con query params `?q=xxx&skill=yyy` | Auth + test data |

### 4.4 Dettaglio Consultant

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| DIR-020 a 027 | Pagina dettaglio | 🔧📝 | Curl/fetch `/app/directory/[id]` con auth | Auth + consultant ID esistente |

---

## 5. Richieste e Matching

### 5.1-5.4 Creazione Request

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| REQ-001 | Title obbligatorio | ✅📝 | Unit test validazione form | Codice |
| REQ-002 | Description obbligatoria | ✅📝 | Unit test validazione form | Codice |
| REQ-003 | Bottone AI refinement | 🔧📝 | API test POST /api/ai/refine-request | Auth + AI API key |
| REQ-004 | Loading state | 👤📝 | Visual test o Playwright | Browser |
| REQ-005 a 010 | AI outputs | 🔧📝 | API test /api/ai/refine-request | Auth + AI API key |
| REQ-011 a 024 | Form fields | 🔧📝 | Playwright E2E o unit test | Auth |

### 5.5 Submission

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| REQ-025 | Submit crea record | 🔧📝 | API test POST /api/requests + query DB | Auth + DB |
| REQ-026 | Status PUBLISHED | 🔧📝 | API test + verifica DB | Auth + DB |
| REQ-027 | Status DRAFT | 🔧📝 | API test con isPublic=false | Auth + DB |
| REQ-028 | Skills linkate | 🔧📝 | API test + query RequestSkill | Auth + DB |
| REQ-029 | Budget in centesimi | 🔧📝 | API test + verifica DB value | Auth + DB |

### 5.6-5.7 Direct Booking & Protection

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| REQ-030 | URL con consultant param | 🔧📝 | Playwright verifica pre-fill | Auth CLIENT + consultant ID |
| REQ-031 | Direct booking crea entrambi | 🔧📝 | API test + query DB | Auth + DB |
| REQ-032 | CONSULTANT non accede | 🔧📝 | Curl con auth CONSULTANT a /app/requests/new | Auth CONSULTANT |
| REQ-033 | CLIENT accede | 🔧📝 | Curl con auth CLIENT | Auth CLIENT |
| REQ-034 | BOTH accede | 🔧📝 | Curl con auth BOTH | Auth BOTH |

---

## 6. Offerte e Prenotazioni

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| OFF-001 a 004 | Tabs visibility | 🔧📝 | Render test per ruolo | Auth per ruolo |
| OFF-005 a 009 | Open requests filtri | ✅📝 | Unit test query in page.tsx | Codice |
| OFF-010 a 015 | Creazione offerta | 🔧📝 | API test POST /api/offers | Auth CONSULTANT + request ID |
| OFF-016 a 022 | Gestione offerte client | 🔧📝 | API test PATCH /api/offers/[id] | Auth CLIENT + offer ID |
| OFF-023 a 025 | Withdraw consultant | 🔧📝 | API test PATCH con status WITHDRAWN | Auth CONSULTANT |
| OFF-026 a 028 | AI Match | 🔧📝 | Verifica matchScore in offer response | AI configured |

---

## 7. Pagamenti e Checkout

### 7.1 Checkout Session

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| PAY-001 | POST /api/checkout | 🔧📝 | API test con bookingId | Auth + booking + Stripe keys |
| PAY-002 a 004 | ProductSKU pricing | ✅📝 | Query DB o verifica seed data | DB access |
| PAY-005 | Payment PENDING | 🔧📝 | API test + query Payment | Auth + DB |
| PAY-006 | stripeSessionId salvato | 🔧📝 | API test + query DB | Auth + DB + Stripe |
| PAY-007 | Redirect URL | 🔧📝 | API test verifica response.url | Auth + Stripe |

### 7.2 Stripe Webhooks

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| PAY-008 | checkout.session.completed | 🔧📝 | Stripe CLI `stripe trigger` o mock webhook | Stripe CLI + webhook secret |
| PAY-009 | Entitlement creato | 🔧📝 | Trigger webhook + query DB | Stripe CLI + DB |
| PAY-010 | Booking CONFIRMED | 🔧📝 | Trigger webhook + query DB | Stripe CLI + DB |
| PAY-011 | session.expired | 🔧📝 | `stripe trigger checkout.session.expired` | Stripe CLI |
| PAY-012 | payment_failed | 🔧📝 | `stripe trigger payment_intent.payment_failed` | Stripe CLI |
| PAY-013 | Signature verification | ✅📝 | Unit test con firma invalida | Codice |
| PAY-014 | Audit log | 🔧📝 | Query AuditLog dopo webhook | DB |

### 7.3-7.4 Post-Checkout & Entitlements

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| PAY-015 a 022 | Success page, entitlements | 🔧📝 | Curl pages + query DB | Auth + completed payment |

---

## 8. Engagement Workspace

### 8.1 Accesso

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ENG-001 | Solo participant accede | 🔧📝 | API test con auth participant | Auth participant |
| ENG-002 | Non-participant 403 | 🔧📝 | API test con auth altro user | Auth non-participant |
| ENG-003 | Engagement dopo payment | 🔧📝 | Query DB dopo payment success | DB + completed payment |

### 8.2 Payment Lock

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ENG-004 | Features bloccate | 🔧📝 | Render test con payment.status != SUCCEEDED | Mock data |
| ENG-005 | Banner pagamento | 🔧📝 | Render test come client unpaid | Mock data |
| ENG-006 | Features sbloccate | 🔧📝 | Render test con payment.status = SUCCEEDED | Mock data |

### 8.3-8.6 Chat, Note, Checklist, Artifacts

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ENG-007 a 024 | CRUD operations | 🔧📝 | API tests POST/PATCH/DELETE | Auth participant + engagement ID |

### 8.7 Transfer Pack

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ENG-025 a 032 | AI generation e finalize | 🔧📝 | API test POST /api/engagements/[id]/transfer-pack | Auth + AI key + engagement |

### 8.8-8.9 Video Link & Status

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| ENG-033 a 039 | Video link, status | 🔧📝 | API tests PATCH engagement | Auth + engagement ID |

---

## 9. Recensioni

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| REV-001 a 012 | CRUD reviews | 🔧📝 | API test POST /api/reviews + query DB | Auth + completed engagement |

---

## 10. Hive Mind

### 10.1 Vista Pubblica

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| HIVE-001 | Solo APPROVED | ✅📝 | Unit test query in page.tsx | Codice |
| HIVE-002 a 007 | Tabs e display | 🔧📝 | Render test con mock data | Mock data |

### 10.2-10.5 Contribuzione

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| HIVE-008 a 025 | Form fields e submission | 🔧📝 | API test POST /api/hive/contribute | Auth |

### 10.6 Redazione PII

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| HIVE-026 a 029 | PII detection | ⏸️ | TODO - Non implementato | AI + implementazione |

---

## 11. Profilo Utente

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| PROF-001 a 003 | Info base readonly | 🔧📝 | Render test | Auth |
| PROF-004 a 009 | Upload foto | 🔧📝 | API test POST /api/upload/profile-photo | Auth + Supabase |
| PROF-010 a 021 | Edit profiles | 🔧📝 | API test PUT /api/profile/* | Auth |

---

## 12. Tema Light/Dark

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| THEME-001 a 004 | Toggle | 🔧📝 | Playwright click + verifica classe | Browser |
| THEME-005 a 007 | Persistenza | 👤 | Richiede localStorage browser | Browser manuale |
| THEME-008 a 016 | Stili | 👤📝 | Visual regression test o manuale | Browser |

---

## 13. Middleware e Protezione Route

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| MW-001 a 004 | Route pubbliche | ✅📝 | Curl senza auth | Dev server |
| MW-005 a 007 | Route protette | ✅📝 | Curl senza auth, verifica redirect | Dev server |
| MW-008 a 010 | Redirect post-login | 🔧📝 | Playwright con login flow | Auth credentials |

---

## 14. API Error Handling

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| API-001 a 010 | Status codes | ✅📝 | Unit test o API test | Dev server |

---

## 15. Funzionalità AI

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| AI-001 a 015 | Tutte le funzioni AI | 🔧📝 | API test | Auth + AI API keys (Anthropic/OpenAI) |

---

## 16. Mobile e Responsive

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| RESP-001 a 013 | Breakpoints | 👤📝 | Playwright con viewport o visual manuale | Browser/Playwright |

---

## 17. Sicurezza

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| SEC-001 | SQL injection | ✅📝 | Verifica uso Prisma (già sicuro) | Codice |
| SEC-002 | XSS | ✅📝 | Verifica React escaping (già sicuro) | Codice |
| SEC-003 | CSRF | ✅📝 | Verifica Clerk middleware | Codice |
| SEC-004 a 006 | Auth | 🔧 | Test con token invalidi/scaduti | Auth system |
| SEC-007 | Webhook signature | ✅📝 | Unit test con firma sbagliata | Codice |
| SEC-008 | Amount validation | ✅📝 | Verifica server-side calculation | Codice |
| SEC-009 a 011 | Data protection | ✅ | Code review | Codice |

---

## 18. Edge Cases

| ID | Test | Eseguibile | Come | Requisiti |
|----|------|------------|------|-----------|
| EDGE-001 a 004 | Input boundary | ✅📝 | Unit test con input edge case | Codice |
| EDGE-005 a 006 | Concorrenza | 🔧📝 | Test paralleli con Promise.all | Auth + DB |
| EDGE-007 a 008 | Network | 🔧📝 | Mock timeout in test | Test framework |
| EDGE-009 a 012 | Empty states | 🔧📝 | Render test con array vuoti | Mock data |

---

## Riepilogo Capacità

### Totale Test: ~200

| Categoria | Count | Percentuale |
|-----------|-------|-------------|
| ✅ Eseguibili autonomamente | ~45 | ~22% |
| 🔧 Eseguibili con accessi | ~130 | ~65% |
| 👤 Richiedono utente | ~25 | ~13% |

---

## Cosa Serve per Massimizzare i Test Automatici

### 1. Dev Server Running
```bash
npm run dev
# Server su http://localhost:3000
```

### 2. Credenziali Test User
```
Email: [test user email]
Password: [test user password]
```
Oppure un **token JWT/session** valido per fare chiamate API autenticate.

### 3. Database Access
Connessione al database per:
- Verificare dati creati
- Creare dati di test (seed)
- Query dirette con Prisma

### 4. Stripe Test Mode
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
E Stripe CLI per simulare webhook:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### 5. AI API Keys (almeno uno)
```env
ANTHROPIC_API_KEY=sk-ant-...
# oppure
OPENAI_API_KEY=sk-...
```

### 6. Supabase Storage (per upload foto)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 7. Framework Test (opzionale ma consigliato)
```bash
npm install -D vitest @testing-library/react playwright
```

---

## Prossimi Passi Consigliati

### Fase 1: Test Immediati (No dependencies)
Posso eseguire subito ~45 test che verificano:
- Logica condizionale nel codice
- Query Prisma corrette
- Validazioni form
- Route protection middleware
- Sicurezza base

### Fase 2: Test con Dev Server
Con `npm run dev` attivo, posso:
- Testare route pubbliche con curl
- Verificare redirect authentication
- Testare API error handling

### Fase 3: Test con Auth Token
Se mi fornisci un token di sessione o credenziali, posso:
- Testare tutti gli endpoint API
- Verificare CRUD operations
- Testare flussi completi

### Fase 4: Test E2E con Playwright
Posso scrivere test Playwright per:
- Flussi utente completi
- Visual testing
- Multi-browser testing

---

## Vuoi che proceda?

Dimmi:
1. **Quali fasi** vuoi che esegua
2. **Quali accessi** puoi fornirmi
3. Se vuoi che **scriva i test automatici** (file .test.ts) o **esegua test manuali** con report

