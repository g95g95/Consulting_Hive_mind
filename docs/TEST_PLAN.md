# Test Plan - Consulting Hive Mind MVP

Questo documento contiene tutti i test che l'applicazione deve superare per essere considerata pronta per la produzione.

---

## Indice

1. [Autenticazione e Autorizzazione](#1-autenticazione-e-autorizzazione)
2. [Onboarding](#2-onboarding)
3. [Dashboard](#3-dashboard)
4. [Directory](#4-directory)
5. [Richieste e Matching](#5-richieste-e-matching)
6. [Offerte e Prenotazioni](#6-offerte-e-prenotazioni)
7. [Pagamenti e Checkout](#7-pagamenti-e-checkout)
8. [Engagement Workspace](#8-engagement-workspace)
9. [Recensioni](#9-recensioni)
10. [Hive Mind](#10-hive-mind)
11. [Profilo Utente](#11-profilo-utente)
12. [Tema Light/Dark](#12-tema-lightdark)
13. [Middleware e Protezione Route](#13-middleware-e-protezione-route)
14. [API Error Handling](#14-api-error-handling)
15. [Funzionalità AI](#15-funzionalità-ai)
16. [Mobile e Responsive](#16-mobile-e-responsive)
17. [Sicurezza](#17-sicurezza)
18. [Edge Cases](#18-edge-cases)

---

## 1. Autenticazione e Autorizzazione

### 1.1 Pagine Pubbliche
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| AUTH-001 | Accesso landing page `/` senza login | Pagina visibile | [ ] |
| AUTH-002 | Accesso `/sign-in` senza login | Pagina login Clerk visibile | [ ] |
| AUTH-003 | Accesso `/sign-up` senza login | Pagina registrazione Clerk visibile | [ ] |
| AUTH-004 | Manifesto visibile nella landing | Contenuto caricato da docs/MANIFESTO.md | [ ] |

### 1.2 OAuth Providers
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| AUTH-005 | Login con Google OAuth | Autenticazione riuscita, redirect a /app o /onboarding | [ ] |
| AUTH-006 | Login con LinkedIn OAuth | Autenticazione riuscita, redirect a /app o /onboarding | [ ] |
| AUTH-007 | Login con Meta/Facebook OAuth | Autenticazione riuscita, redirect a /app o /onboarding | [ ] |
| AUTH-008 | Login con email/password | Autenticazione riuscita | [ ] |

### 1.3 Protezione Route
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| AUTH-009 | Accesso `/app` senza login | Redirect a `/sign-in` | [ ] |
| AUTH-010 | Accesso `/app/directory` senza login | Redirect a `/sign-in` | [ ] |
| AUTH-011 | Accesso `/app/requests` senza login | Redirect a `/sign-in` | [ ] |
| AUTH-012 | Accesso `/app/hive` senza login | Redirect a `/sign-in` | [ ] |
| AUTH-013 | Accesso `/onboarding` senza login | Redirect a `/sign-in` | [ ] |
| AUTH-014 | Accesso `/api/webhooks/stripe` senza login | Accessibile (webhook pubblico) | [ ] |
| AUTH-015 | Accesso `/api/webhooks/clerk` senza login | Accessibile (webhook pubblico) | [ ] |

### 1.4 Sessione Utente
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| AUTH-016 | Logout utente | Sessione terminata, redirect a landing | [ ] |
| AUTH-017 | Sessione persistente dopo refresh | Utente rimane loggato | [ ] |
| AUTH-018 | User creato in DB dopo primo login | Record User con clerkId creato | [ ] |

---

## 2. Onboarding

### 2.1 Selezione Ruolo (Step 1)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ONB-001 | Selezione ruolo CLIENT | Bottone attivo, può procedere | [ ] |
| ONB-002 | Selezione ruolo CONSULTANT | Bottone attivo, può procedere | [ ] |
| ONB-003 | Selezione ruolo BOTH | Bottone attivo, può procedere | [ ] |
| ONB-004 | Tentativo procedere senza selezione | Bottone Next disabilitato | [ ] |

### 2.2 Profilo Consultant (Step 2 - CONSULTANT o BOTH)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ONB-005 | Campo headline obbligatorio | Validazione errore se vuoto | [ ] |
| ONB-006 | Selezione almeno una skill obbligatoria | Validazione errore se nessuna skill | [ ] |
| ONB-007 | Inserimento hourly rate | Valore salvato in centesimi | [ ] |
| ONB-008 | Selezione lingue multiple | Array lingue salvato | [ ] |
| ONB-009 | Inserimento LinkedIn URL | URL validato e salvato | [ ] |
| ONB-010 | Inserimento anni esperienza | Valore numerico salvato | [ ] |

### 2.3 Profilo Client (Step 2 - CLIENT)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ONB-011 | Campo company name opzionale | Può procedere senza | [ ] |
| ONB-012 | Campo company role opzionale | Può procedere senza | [ ] |
| ONB-013 | Campo billing email opzionale | Può procedere senza | [ ] |

### 2.4 Privacy e Consensi (Step finale)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ONB-014 | Consenso directory listing (consultant) | Checkbox salvata in consentDirectory | [ ] |
| ONB-015 | Consenso Hive Mind (consultant) | Checkbox salvata in consentHiveMind | [ ] |
| ONB-016 | Accettazione Terms of Service | ConsentLog creato | [ ] |
| ONB-017 | Completamento onboarding | User.onboarded = true, redirect a /app | [ ] |

### 2.5 Flusso Completo
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ONB-018 | Onboarding completo come CLIENT | ClientProfile creato, redirect /app | [ ] |
| ONB-019 | Onboarding completo come CONSULTANT | ConsultantProfile creato, redirect /app | [ ] |
| ONB-020 | Onboarding completo come BOTH | Entrambi i profili creati, redirect /app | [ ] |
| ONB-021 | Utente già onboarded accede a /onboarding | Redirect a /app | [ ] |

---

## 3. Dashboard

### 3.1 Stats Cards
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DASH-001 | Card "My Requests" mostra conteggio corretto | Numero richieste create dall'utente | [ ] |
| DASH-002 | Card "Engagements" mostra conteggio corretto | Numero engagement attivi/completati | [ ] |
| DASH-003 | Card "Available Consultants" (CLIENT) | Numero consultant disponibili | [ ] |
| DASH-004 | Card "Available Clients" (CONSULTANT) | Numero client nel sistema | [ ] |
| DASH-005 | Card "Your Role" mostra badge corretto | CLIENT/CONSULTANT/BOTH con colore appropriato | [ ] |

### 3.2 Quick Actions (Basate sul Ruolo)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DASH-006 | CLIENT vede "Create new request" | Bottone visibile e funzionante | [ ] |
| DASH-007 | CONSULTANT non vede "Create new request" | Bottone nascosto | [ ] |
| DASH-008 | BOTH vede "Create new request" | Bottone visibile e funzionante | [ ] |
| DASH-009 | CLIENT vede "Browse consultants" | Testo corretto | [ ] |
| DASH-010 | CONSULTANT vede "Browse clients" | Testo corretto | [ ] |
| DASH-011 | Bottone "Explore Hive Mind" visibile | Link funzionante a /app/hive | [ ] |

### 3.3 Recent Engagements
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DASH-012 | Lista ultimi 5 engagement | Ordinati per data update desc | [ ] |
| DASH-013 | Engagement mostra titolo request | Titolo o "Direct Booking" | [ ] |
| DASH-014 | Engagement mostra altra parte | Nome client/consultant | [ ] |
| DASH-015 | Badge status engagement | ACTIVE/COMPLETED/etc con colore | [ ] |
| DASH-016 | Click engagement porta a workspace | Redirect a /app/engagements/[id] | [ ] |

### 3.4 Active Requests (Solo CLIENT/BOTH)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DASH-017 | Sezione visibile solo per CLIENT/BOTH | Nascosta per CONSULTANT puro | [ ] |
| DASH-018 | Mostra solo request PUBLISHED/MATCHING | Filtro status corretto | [ ] |
| DASH-019 | Click request porta a dettaglio | Redirect a /app/requests/[id] | [ ] |

---

## 4. Directory

### 4.1 Vista per CLIENT/BOTH (Consultant Directory)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DIR-001 | Titolo "Consultant Directory" | Testo corretto | [ ] |
| DIR-002 | Mostra solo consultant con isAvailable=true | Filtro applicato | [ ] |
| DIR-003 | Mostra solo consultant con consentDirectory=true | Filtro applicato | [ ] |
| DIR-004 | Non mostra se stesso nella lista | Utente corrente escluso | [ ] |
| DIR-005 | Card mostra nome, headline, rating | Dati corretti | [ ] |
| DIR-006 | Card mostra timezone | Formato corretto | [ ] |
| DIR-007 | Card mostra hourly rate | Formato €X/h | [ ] |
| DIR-008 | Card mostra fino a 5 skill | Badge limitati | [ ] |

### 4.2 Vista per CONSULTANT (Client Directory)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DIR-009 | Titolo "Client Directory" | Testo corretto | [ ] |
| DIR-010 | Mostra tutti i client | Lista completa | [ ] |
| DIR-011 | Non mostra se stesso nella lista | Utente corrente escluso | [ ] |
| DIR-012 | Card mostra nome, company, industry | Dati corretti | [ ] |
| DIR-013 | Card mostra company size se presente | Badge opzionale | [ ] |

### 4.3 Ricerca e Filtri
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DIR-014 | Ricerca per nome consultant | Risultati filtrati | [ ] |
| DIR-015 | Ricerca per skill/expertise | Risultati filtrati | [ ] |
| DIR-016 | Ricerca per nome client | Risultati filtrati | [ ] |
| DIR-017 | Ricerca per company/industry | Risultati filtrati | [ ] |
| DIR-018 | Filtro per skill tag (consultant) | Dropdown funzionante | [ ] |
| DIR-019 | Bottone "All" resetta filtri | Lista completa | [ ] |

### 4.4 Dettaglio Consultant
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| DIR-020 | Pagina dettaglio `/app/directory/[id]` | Dati completi consultant | [ ] |
| DIR-021 | Bio completa visibile | Testo intero | [ ] |
| DIR-022 | Tutte le skill con proficiency | Lista completa | [ ] |
| DIR-023 | Lingue parlate | Lista completa | [ ] |
| DIR-024 | Anni esperienza | Numero corretto | [ ] |
| DIR-025 | Link LinkedIn/Portfolio | Cliccabili | [ ] |
| DIR-026 | Rating medio e conteggio review | Calcolo corretto | [ ] |
| DIR-027 | Bottone "Book Consultation" | Link a /app/requests/new?consultant=[id] | [ ] |

---

## 5. Richieste e Matching

### 5.1 Creazione Request (Step 1 - Descrizione)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REQ-001 | Campo title obbligatorio | Validazione errore se vuoto | [ ] |
| REQ-002 | Campo raw description obbligatorio | Validazione errore se vuoto | [ ] |
| REQ-003 | Bottone "AI help" attiva refinement | Chiamata API /api/ai/refine-request | [ ] |
| REQ-004 | Loading state durante AI processing | Spinner visibile | [ ] |

### 5.2 AI Refinement
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REQ-005 | AI genera refined summary | 2-3 frasi strutturate | [ ] |
| REQ-006 | AI genera constraints | Lista vincoli | [ ] |
| REQ-007 | AI genera desired outcome | Criteri successo | [ ] |
| REQ-008 | AI suggerisce duration | 30/60/90 minuti | [ ] |
| REQ-009 | AI suggerisce skills | Array skill tags | [ ] |
| REQ-010 | AI rileva sensitive data | Warning se presente | [ ] |

### 5.3 Creazione Request (Step 2 - Review)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REQ-011 | Summary editabile | Campo modificabile | [ ] |
| REQ-012 | Constraints editabile | Campo modificabile | [ ] |
| REQ-013 | Desired outcome editabile | Campo modificabile | [ ] |
| REQ-014 | Skill tags editabili | Aggiungi/rimuovi | [ ] |
| REQ-015 | Warning sensitive data visibile | Alert se flaggato | [ ] |

### 5.4 Creazione Request (Step 3 - Preferences)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REQ-016 | Selezione duration 30 min | Radio selezionabile | [ ] |
| REQ-017 | Selezione duration 60 min | Radio selezionabile | [ ] |
| REQ-018 | Selezione duration 90 min | Radio selezionabile | [ ] |
| REQ-019 | Selezione urgency LOW | Radio selezionabile | [ ] |
| REQ-020 | Selezione urgency NORMAL | Radio selezionabile | [ ] |
| REQ-021 | Selezione urgency HIGH | Radio selezionabile | [ ] |
| REQ-022 | Selezione urgency URGENT | Radio selezionabile | [ ] |
| REQ-023 | Campo budget opzionale | Accetta valore EUR | [ ] |
| REQ-024 | Checkbox publish (public) | Toggle funzionante | [ ] |

### 5.5 Submission e Status
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REQ-025 | Submit request crea record | POST /api/requests riuscito | [ ] |
| REQ-026 | Request creata con status PUBLISHED | Se isPublic=true | [ ] |
| REQ-027 | Request creata con status DRAFT | Se isPublic=false | [ ] |
| REQ-028 | Skills linkate correttamente | RequestSkill records creati | [ ] |
| REQ-029 | Budget convertito in centesimi | Valore corretto in DB | [ ] |

### 5.6 Direct Booking
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REQ-030 | URL con ?consultant=[id] pre-compila | Consultant preselezionato | [ ] |
| REQ-031 | Direct booking crea request + booking | Entrambi i record creati | [ ] |

### 5.7 Protezione Route
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REQ-032 | CONSULTANT non può accedere a /app/requests/new | Redirect a /app/requests | [ ] |
| REQ-033 | CLIENT può accedere a /app/requests/new | Pagina visibile | [ ] |
| REQ-034 | BOTH può accedere a /app/requests/new | Pagina visibile | [ ] |

---

## 6. Offerte e Prenotazioni

### 6.1 Lista Requests (Tabs)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| OFF-001 | Tab "My Requests" visibile per tutti | Lista proprie requests | [ ] |
| OFF-002 | Tab "Open Requests" solo per CONSULTANT/BOTH | Lista requests pubbliche | [ ] |
| OFF-003 | Tab "My Offers" solo per CONSULTANT/BOTH | Lista proprie offerte | [ ] |
| OFF-004 | Conteggio corretto in ogni tab | Numeri aggiornati | [ ] |

### 6.2 Open Requests (per Consultant)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| OFF-005 | Mostra solo requests isPublic=true | Filtro applicato | [ ] |
| OFF-006 | Mostra solo status PUBLISHED/MATCHING | Filtro applicato | [ ] |
| OFF-007 | Non mostra proprie requests | Filtro creatorId | [ ] |
| OFF-008 | Card mostra creator info | Nome parziale | [ ] |
| OFF-009 | Card mostra urgency badge | Colore appropriato | [ ] |

### 6.3 Creazione Offerta
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| OFF-010 | Consultant può fare offerta | POST /api/offers riuscito | [ ] |
| OFF-011 | Offerta include messaggio | Campo salvato | [ ] |
| OFF-012 | Offerta include proposed rate | Campo salvato | [ ] |
| OFF-013 | No duplicate: stessa request, stesso consultant | Errore 400 | [ ] |
| OFF-014 | Request status cambia a MATCHING | Prima offerta ricevuta | [ ] |
| OFF-015 | Non può offrire su proprie requests | Errore 403 | [ ] |

### 6.4 Gestione Offerte (per Client)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| OFF-016 | Client vede lista offerte su request | Card per ogni offerta | [ ] |
| OFF-017 | Offerta mostra consultant info | Avatar, nome, headline | [ ] |
| OFF-018 | Offerta mostra rating e experience | Dati corretti | [ ] |
| OFF-019 | Bottone Accept funzionante | PATCH /api/offers/[id] | [ ] |
| OFF-020 | Bottone Decline funzionante | PATCH /api/offers/[id] | [ ] |
| OFF-021 | Accept crea Booking | Record Booking creato | [ ] |
| OFF-022 | Accept aggiorna request a BOOKED | Status cambiato | [ ] |

### 6.5 Gestione Offerte (per Consultant)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| OFF-023 | Consultant può ritirare offerta | Bottone Withdraw | [ ] |
| OFF-024 | Withdraw aggiorna status a WITHDRAWN | PATCH riuscito | [ ] |
| OFF-025 | Status offerta visibile | PENDING/ACCEPTED/DECLINED/WITHDRAWN | [ ] |

### 6.6 AI Match Suggestions
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| OFF-026 | Match score calcolato (0-1) | Valore numerico | [ ] |
| OFF-027 | Match reason generato | Spiegazione testuale | [ ] |
| OFF-028 | Offerte ordinate per match score | Migliori in cima | [ ] |

---

## 7. Pagamenti e Checkout

### 7.1 Creazione Checkout Session
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PAY-001 | POST /api/checkout con bookingId | Session Stripe creata | [ ] |
| PAY-002 | ProductSKU corretto per 30 min | €75 (7500 cents) | [ ] |
| PAY-003 | ProductSKU corretto per 60 min | €140 (14000 cents) | [ ] |
| PAY-004 | ProductSKU corretto per 90 min | €195 (19500 cents) | [ ] |
| PAY-005 | Record Payment creato con PENDING | Status iniziale | [ ] |
| PAY-006 | stripeSessionId salvato | ID univoco | [ ] |
| PAY-007 | Redirect URL restituito | URL Stripe valido | [ ] |

### 7.2 Stripe Webhooks
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PAY-008 | checkout.session.completed gestito | Payment → SUCCEEDED | [ ] |
| PAY-009 | Entitlement creato dopo pagamento | Record con tipo corretto | [ ] |
| PAY-010 | Booking status → CONFIRMED | Dopo pagamento | [ ] |
| PAY-011 | checkout.session.expired gestito | Payment → CANCELLED | [ ] |
| PAY-012 | payment_intent.payment_failed gestito | Payment → FAILED | [ ] |
| PAY-013 | Webhook signature verificata | Sicurezza Stripe | [ ] |
| PAY-014 | Audit log creato | PAYMENT_COMPLETED | [ ] |

### 7.3 Pagine Post-Checkout
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PAY-015 | /app/checkout/success mostra conferma | Messaggio successo | [ ] |
| PAY-016 | /app/checkout/cancel mostra annullamento | Messaggio annullamento | [ ] |
| PAY-017 | Link a engagement da success page | Redirect funzionante | [ ] |

### 7.4 Entitlements
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PAY-018 | Entitlement type SESSION_30 | Per booking 30 min | [ ] |
| PAY-019 | Entitlement type SESSION_60 | Per booking 60 min | [ ] |
| PAY-020 | Entitlement type SESSION_90 | Per booking 90 min | [ ] |
| PAY-021 | Entitlement status ACTIVE | Dopo creazione | [ ] |
| PAY-022 | Entitlement status USED | Dopo engagement completato | [ ] |

---

## 8. Engagement Workspace

### 8.1 Accesso e Autorizzazione
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-001 | Solo participant può accedere | Client o Consultant del booking | [ ] |
| ENG-002 | Non-participant riceve 403 | Accesso negato | [ ] |
| ENG-003 | Engagement creato dopo payment confirmed | Record esiste | [ ] |

### 8.2 Payment Lock
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-004 | Features bloccate se non pagato | Chat, notes, etc. disabilitati | [ ] |
| ENG-005 | Banner pagamento visibile per client | Se payment non SUCCEEDED | [ ] |
| ENG-006 | Features sbloccate dopo pagamento | Tutto funzionante | [ ] |

### 8.3 Chat/Messaggi
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-007 | Invio messaggio funzionante | POST /api/engagements/[id]/messages | [ ] |
| ENG-008 | Messaggi ordinati cronologicamente | Più vecchi prima | [ ] |
| ENG-009 | Author info corretta | Nome e avatar | [ ] |
| ENG-010 | Timestamp visibile | Data/ora corretta | [ ] |
| ENG-011 | Messaggi persistono dopo refresh | Salvati in DB | [ ] |

### 8.4 Note
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-012 | Creazione nota | POST /api/engagements/[id]/notes | [ ] |
| ENG-013 | Modifica nota | PATCH funzionante | [ ] |
| ENG-014 | Eliminazione nota | DELETE funzionante | [ ] |
| ENG-015 | Nota privata visibile solo ad author | Toggle isPrivate | [ ] |
| ENG-016 | Nota condivisa visibile a entrambi | Toggle isPrivate=false | [ ] |

### 8.5 Checklist
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-017 | Creazione item checklist | POST /api/engagements/[id]/checklist | [ ] |
| ENG-018 | Toggle completamento item | Checkbox funzionante | [ ] |
| ENG-019 | Riordino items | Drag & drop o arrows | [ ] |
| ENG-020 | Eliminazione item | DELETE funzionante | [ ] |

### 8.6 Artifacts/Links
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-021 | Aggiunta link esterno | URL salvato | [ ] |
| ENG-022 | Tipo artifact corretto | LINK/DOCUMENT/CODE/etc. | [ ] |
| ENG-023 | Link cliccabile | Apre in nuova tab | [ ] |
| ENG-024 | Eliminazione artifact | DELETE funzionante | [ ] |

### 8.7 Transfer Pack
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-025 | Generazione transfer pack con AI | POST /api/engagements/[id]/transfer-pack | [ ] |
| ENG-026 | Summary generato | Riepilogo engagement | [ ] |
| ENG-027 | Key decisions estratte | Lista decisioni | [ ] |
| ENG-028 | Runbook creato | Passi implementazione | [ ] |
| ENG-029 | Next steps generati | Azioni future | [ ] |
| ENG-030 | Internalization checklist | Lista competenze trasferite | [ ] |
| ENG-031 | Solo client può finalizzare | Bottone visibile solo a client | [ ] |
| ENG-032 | Finalizzazione cambia status | TRANSFERRED | [ ] |

### 8.8 Video Link
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-033 | Campo video link editabile | Input funzionante | [ ] |
| ENG-034 | Link salvato in engagement | Persistenza | [ ] |
| ENG-035 | Link visibile in sidebar | Cliccabile | [ ] |

### 8.9 Status Transitions
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| ENG-036 | Status iniziale ACTIVE | Dopo creazione | [ ] |
| ENG-037 | Transizione a PAUSED | Se necessario | [ ] |
| ENG-038 | Transizione a COMPLETED | Dopo chiusura | [ ] |
| ENG-039 | Transizione a TRANSFERRED | Dopo transfer pack | [ ] |

---

## 9. Recensioni

### 9.1 Creazione Review
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REV-001 | Client può recensire consultant | POST /api/reviews | [ ] |
| REV-002 | Consultant può recensire client | POST /api/reviews | [ ] |
| REV-003 | Rating 1-5 obbligatorio | Validazione | [ ] |
| REV-004 | Commento opzionale | Campo salvato | [ ] |
| REV-005 | isPublic default true | Flag salvato | [ ] |

### 9.2 Vincoli
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REV-006 | No duplicate: stesso engagement, stesso tipo | Errore 400 | [ ] |
| REV-007 | Review solo dopo engagement | Validazione | [ ] |
| REV-008 | ReviewType corretto | CLIENT_TO_CONSULTANT o vice versa | [ ] |

### 9.3 Visualizzazione
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| REV-009 | Rating medio calcolato correttamente | Formula corretta | [ ] |
| REV-010 | Conteggio review corretto | Numero esatto | [ ] |
| REV-011 | Solo review pubbliche in directory | Filtro isPublic | [ ] |
| REV-012 | Review visibili su profilo consultant | Lista completa | [ ] |

---

## 10. Hive Mind

### 10.1 Vista Pubblica
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| HIVE-001 | Solo contenuti APPROVED visibili | Filtro status | [ ] |
| HIVE-002 | Tab Patterns funzionante | Lista patterns | [ ] |
| HIVE-003 | Tab Prompts funzionante | Lista prompts | [ ] |
| HIVE-004 | Tab Stacks funzionante | Lista stacks | [ ] |
| HIVE-005 | Creator name solo first name | Privacy | [ ] |
| HIVE-006 | Content preview max 500 chars | Troncato con ellipsis | [ ] |
| HIVE-007 | Tags visibili | Badge per ogni tag | [ ] |

### 10.2 Contribuzione - Campi Comuni
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| HIVE-008 | Campo title obbligatorio | Validazione | [ ] |
| HIVE-009 | Campo description opzionale | Accettato vuoto | [ ] |
| HIVE-010 | Campo content obbligatorio | Validazione | [ ] |
| HIVE-011 | Aggiunta tags funzionante | Array salvato | [ ] |
| HIVE-012 | Rimozione tags funzionante | Click per rimuovere | [ ] |

### 10.3 Contribuzione - Tab Prompt
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| HIVE-013 | Campo prompt text opzionale | Textarea funzionante | [ ] |
| HIVE-014 | Submit con prompt crea tipo "prompt" | Tipo corretto | [ ] |

### 10.4 Contribuzione - Tab Stack
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| HIVE-015 | Campo UI/Frontend opzionale | Input funzionante | [ ] |
| HIVE-016 | Campo Backend opzionale | Input funzionante | [ ] |
| HIVE-017 | Campo Database opzionale | Input funzionante | [ ] |
| HIVE-018 | Campo Release/Deployment opzionale | Input funzionante | [ ] |
| HIVE-019 | Submit con stack crea tipo "stack" | Tipo corretto | [ ] |
| HIVE-020 | Campi tech salvati in DB | uiTech, backendTech, etc. | [ ] |

### 10.5 Submission Flow
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| HIVE-021 | Submit crea record con PENDING_REVIEW | Status iniziale | [ ] |
| HIVE-022 | Se solo common fields → tipo "pattern" | Default type | [ ] |
| HIVE-023 | Se prompt + stack → due contribuzioni | Entrambi creati | [ ] |
| HIVE-024 | Audit log creato | HIVE_CONTRIBUTION | [ ] |
| HIVE-025 | Redirect a /app/hive dopo submit | Navigazione | [ ] |

### 10.6 Redazione PII (TODO - Bypassato)
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| HIVE-026 | TODO: RedactionJob creato | Quando implementato | [ ] |
| HIVE-027 | TODO: PII detection | Quando implementato | [ ] |
| HIVE-028 | TODO: Secrets detection | Quando implementato | [ ] |
| HIVE-029 | TODO: Content anonimizzato | Quando implementato | [ ] |

---

## 11. Profilo Utente

### 11.1 Informazioni Base
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PROF-001 | Nome e cognome da Clerk (read-only) | Visualizzati | [ ] |
| PROF-002 | Email da Clerk (read-only) | Visualizzata | [ ] |
| PROF-003 | Role badge visibile | CLIENT/CONSULTANT/BOTH | [ ] |

### 11.2 Upload Foto Profilo
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PROF-004 | Upload foto funzionante | POST /api/upload/profile-photo | [ ] |
| PROF-005 | Preview foto dopo upload | Immagine visibile | [ ] |
| PROF-006 | Validazione max 5MB | Errore se troppo grande | [ ] |
| PROF-007 | Validazione formato (JPG, PNG, WebP, GIF) | Errore se formato sbagliato | [ ] |
| PROF-008 | Foto salvata in Supabase Storage | URL persistente | [ ] |
| PROF-009 | Foto aggiornata in User.imageUrl | DB aggiornato | [ ] |

### 11.3 Profilo Client
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PROF-010 | Campo company name editabile | Input funzionante | [ ] |
| PROF-011 | Campo industry editabile | Input funzionante | [ ] |
| PROF-012 | Campo company size editabile | Select funzionante | [ ] |
| PROF-013 | Save client profile | PUT /api/profile/client | [ ] |
| PROF-014 | Dati persistono dopo refresh | Salvati in DB | [ ] |

### 11.4 Profilo Consultant
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| PROF-015 | Campo headline editabile | Input funzionante | [ ] |
| PROF-016 | Campo bio editabile | Textarea funzionante | [ ] |
| PROF-017 | Campo hourly rate editabile | Input numerico | [ ] |
| PROF-018 | Campo LinkedIn URL editabile | Input funzionante | [ ] |
| PROF-019 | Skills display (read-only) | Lista da onboarding | [ ] |
| PROF-020 | Save consultant profile | PUT /api/profile/consultant | [ ] |
| PROF-021 | Hourly rate convertito in centesimi | Valore corretto in DB | [ ] |

---

## 12. Tema Light/Dark

### 12.1 Toggle Tema
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| THEME-001 | Toggle visibile in sidebar | Bottone presente | [ ] |
| THEME-002 | Click toggle cambia tema | Light ↔ Dark | [ ] |
| THEME-003 | Icona cambia (Sun/Moon) | Indicatore corretto | [ ] |
| THEME-004 | Testo cambia (Light Mode/Dark Mode) | Label corretta | [ ] |

### 12.2 Persistenza Tema
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| THEME-005 | Tema persiste dopo refresh | LocalStorage | [ ] |
| THEME-006 | Default è dark mode | Impostazione iniziale | [ ] |
| THEME-007 | Rispetta system preference se abilitato | enableSystem | [ ] |

### 12.3 Stili Light Mode
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| THEME-008 | Background chiaro | bg-background corretto | [ ] |
| THEME-009 | Testo scuro | text-foreground corretto | [ ] |
| THEME-010 | Sidebar colori corretti | bg-sidebar | [ ] |
| THEME-011 | Card colori corretti | bg-card | [ ] |
| THEME-012 | Border colori corretti | border-border | [ ] |
| THEME-013 | Primary color (amber) consistente | Entrambi i temi | [ ] |

### 12.4 Stili Dark Mode
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| THEME-014 | Background scuro | bg-background corretto | [ ] |
| THEME-015 | Testo chiaro | text-foreground corretto | [ ] |
| THEME-016 | Contrasto leggibile | Accessibilità | [ ] |

---

## 13. Middleware e Protezione Route

### 13.1 Route Pubbliche
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| MW-001 | `/` accessibile senza auth | 200 OK | [ ] |
| MW-002 | `/sign-in` accessibile senza auth | 200 OK | [ ] |
| MW-003 | `/sign-up` accessibile senza auth | 200 OK | [ ] |
| MW-004 | `/api/webhooks/*` accessibile senza auth | 200 OK | [ ] |

### 13.2 Route Protette
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| MW-005 | `/app/*` richiede auth | Redirect se non loggato | [ ] |
| MW-006 | `/onboarding` richiede auth | Redirect se non loggato | [ ] |
| MW-007 | `/api/*` (non webhook) richiede auth | 401 se non loggato | [ ] |

### 13.3 Redirect Post-Login
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| MW-008 | Nuovo utente → /onboarding | Se onboarded=false | [ ] |
| MW-009 | Utente esistente → /app | Se onboarded=true | [ ] |
| MW-010 | Return URL preservato | Dopo login | [ ] |

---

## 14. API Error Handling

### 14.1 Status Codes
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| API-001 | Success → 200 OK | GET requests | [ ] |
| API-002 | Created → 201 Created | POST che crea risorse | [ ] |
| API-003 | Validation error → 400 Bad Request | Campi mancanti/invalidi | [ ] |
| API-004 | No auth → 401 Unauthorized | Token mancante | [ ] |
| API-005 | No permission → 403 Forbidden | Accesso negato | [ ] |
| API-006 | Not found → 404 Not Found | Risorsa inesistente | [ ] |
| API-007 | Server error → 500 Internal Server Error | Errori imprevisti | [ ] |

### 14.2 Error Messages
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| API-008 | Messaggi errore descrittivi | Utili per debug | [ ] |
| API-009 | No stack trace in produzione | Sicurezza | [ ] |
| API-010 | Errori loggati server-side | Per monitoring | [ ] |

---

## 15. Funzionalità AI

### 15.1 Request Refinement
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| AI-001 | Input: raw description | Testo non strutturato | [ ] |
| AI-002 | Output: refined summary | 2-3 frasi | [ ] |
| AI-003 | Output: constraints | Lista vincoli | [ ] |
| AI-004 | Output: desired outcome | Criteri successo | [ ] |
| AI-005 | Output: suggested duration | 30/60/90 | [ ] |
| AI-006 | Output: suggested skills | Array nomi skill | [ ] |
| AI-007 | Output: sensitive data warning | Boolean | [ ] |

### 15.2 Provider Adapter
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| AI-008 | Anthropic Claude funzionante | Se configurato | [ ] |
| AI-009 | OpenAI funzionante | Se configurato | [ ] |
| AI-010 | Fallback se API non disponibile | Gestione errore | [ ] |

### 15.3 Transfer Pack Generation
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| AI-011 | Summary engagement | Riepilogo | [ ] |
| AI-012 | Key decisions | Lista | [ ] |
| AI-013 | Runbook | Passi | [ ] |
| AI-014 | Next steps | Azioni | [ ] |
| AI-015 | Internalization checklist | Competenze | [ ] |

---

## 16. Mobile e Responsive

### 16.1 Breakpoints
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| RESP-001 | Mobile (320px) | Layout adattato | [ ] |
| RESP-002 | Mobile (375px - iPhone) | Layout adattato | [ ] |
| RESP-003 | Tablet (768px - iPad) | Layout adattato | [ ] |
| RESP-004 | Desktop (1024px+) | Layout completo | [ ] |

### 16.2 Navigazione Mobile
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| RESP-005 | Sidebar diventa drawer | Menu hamburger | [ ] |
| RESP-006 | Drawer apre/chiude | Sheet funzionante | [ ] |
| RESP-007 | Tutti link accessibili | Navigazione completa | [ ] |

### 16.3 Form Mobile
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| RESP-008 | Form leggibili su mobile | Font size adeguato | [ ] |
| RESP-009 | Bottoni touch-friendly | Min 44x44px | [ ] |
| RESP-010 | Input non troppo piccoli | Usabilità | [ ] |

### 16.4 Contenuti
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| RESP-011 | Immagini responsive | Scalano correttamente | [ ] |
| RESP-012 | No horizontal scroll | Contenuto contiene | [ ] |
| RESP-013 | Testo leggibile | Contrasto e dimensioni | [ ] |

---

## 17. Sicurezza

### 17.1 Injection Prevention
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| SEC-001 | SQL injection prevenuta | Prisma parameterized | [ ] |
| SEC-002 | XSS prevenuta | React escaping | [ ] |
| SEC-003 | CSRF protection | Token validati | [ ] |

### 17.2 Autenticazione
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| SEC-004 | Token JWT validati | Clerk middleware | [ ] |
| SEC-005 | Session timeout | Scadenza appropriata | [ ] |
| SEC-006 | Password policy | Clerk enforced | [ ] |

### 17.3 Stripe Security
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| SEC-007 | Webhook signature verificata | STRIPE_WEBHOOK_SECRET | [ ] |
| SEC-008 | Amounts validati server-side | No client manipulation | [ ] |

### 17.4 Data Protection
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| SEC-009 | Sensitive data non loggata | Password, tokens | [ ] |
| SEC-010 | CORS configurato | Origin appropriati | [ ] |
| SEC-011 | HTTPS enforced | In produzione | [ ] |

---

## 18. Edge Cases

### 18.1 Input Boundary
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| EDGE-001 | Ricerca vuota | Lista completa o messaggio | [ ] |
| EDGE-002 | Testo molto lungo (>10000 chars) | Troncato o errore | [ ] |
| EDGE-003 | Unicode/emoji nei nomi | Supportati | [ ] |
| EDGE-004 | Caratteri speciali in password | Supportati | [ ] |

### 18.2 Concorrenza
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| EDGE-005 | Due accept sulla stessa offerta | Solo uno riesce | [ ] |
| EDGE-006 | Modifica contemporanea nota | Ultimo vince o merge | [ ] |

### 18.3 Network
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| EDGE-007 | Timeout API | Messaggio utente | [ ] |
| EDGE-008 | Retry su errore temporaneo | Se implementato | [ ] |

### 18.4 Empty States
| ID | Test | Risultato Atteso | Status |
|----|------|------------------|--------|
| EDGE-009 | Nessun consultant in directory | Messaggio appropriato | [ ] |
| EDGE-010 | Nessuna request | Messaggio e CTA | [ ] |
| EDGE-011 | Nessun engagement | Messaggio appropriato | [ ] |
| EDGE-012 | Nessun contenuto Hive Mind | Messaggio e invito | [ ] |

---

## Appendice A: Credenziali Test

```
Test User:
- Username: user
- Password: user

Stripe Test Cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155
```

## Appendice B: Environment Variables Richieste

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI (almeno uno)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Appendice C: Come Eseguire i Test

### Test Manuali
1. Seguire ogni test case nella tabella
2. Marcare [ ] come [x] quando passa
3. Annotare bug trovati con issue number

### Test Automatici (TODO)
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

**Ultimo aggiornamento:** 2025-12-13

**Versione documento:** 1.0
