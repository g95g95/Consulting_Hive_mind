# Guida Setup Completa - Da Zero a Applicazione Funzionante

Questa guida ti porta dall'avere NULLA all'applicazione funzionante in circa 15 minuti.

---

## PASSO 1: Crea Account Supabase (Database Gratuito)

1. Vai su **https://supabase.com**
2. Clicca **"Start your project"** (bottone verde)
3. Accedi con GitHub o crea un account con email
4. Clicca **"New Project"**
5. Compila:
   - **Name**: `hive-mind` (o quello che vuoi)
   - **Database Password**: INVENTANE UNA E SALVALA! (es: `MiaPassword123!`)
   - **Region**: `West EU (Ireland)` (il più vicino all'Italia)
6. Clicca **"Create new project"** e aspetta 2 minuti

### Ottieni la Connection String:
1. Nel menu a sinistra clicca **"Project Settings"** (icona ingranaggio)
2. Clicca **"Database"**
3. Scorri fino a **"Connection string"**
4. Seleziona **"URI"**
5. Copia la stringa, sarà tipo:
   ```
   postgresql://postgres.[ID]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```
6. **IMPORTANTE**: Sostituisci `[YOUR-PASSWORD]` con la password che hai creato prima

---

## PASSO 2: Crea Account Clerk (Autenticazione Gratuita)

1. Vai su **https://clerk.com**
2. Clicca **"Start building for free"**
3. Accedi con GitHub o crea account
4. Clicca **"Create application"**
5. Dai un nome: `Hive Mind`
6. Seleziona i provider di login che vuoi:
   - ✅ Email
   - ✅ Google
   - ✅ LinkedIn (opzionale)
   - ✅ Facebook (opzionale)
7. Clicca **"Create application"**

### Ottieni le API Keys:
1. Sei già nella dashboard del progetto
2. Vedrai subito le chiavi:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (inizia con `pk_test_...`)
   - `CLERK_SECRET_KEY` (inizia con `sk_test_...`)
3. **Copiale da qualche parte!**

### (Opzionale) Configura Google OAuth:
1. Nel menu Clerk, vai su **"User & Authentication"** → **"Social Connections"**
2. Clicca su **"Google"**
3. Segui le istruzioni per creare credenziali Google (oppure lascia "Use Clerk's shared credentials" per test)

---

## PASSO 3: Configura il Progetto

1. Apri la cartella del progetto
2. Trova il file `.env.example`
3. **Copia** il file e rinominalo `.env.local`
4. Aprilo con un editor di testo (Notepad va bene)
5. Compila così:

```env
# === CLERK (copia da Clerk Dashboard) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_TUO_VALORE_QUI
CLERK_SECRET_KEY=sk_test_TUO_VALORE_QUI

# === CLERK URLS (lascia così) ===
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# === DATABASE (copia da Supabase, con password corretta!) ===
DATABASE_URL="postgresql://postgres.[TUO-ID]:[TUA-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[TUO-ID]:[TUA-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# === AI (opzionale per ora, l'app funziona anche senza) ===
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# === STRIPE (opzionale per ora) ===
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# === APP ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**NOTA sulla DATABASE_URL**: Supabase usa due porte diverse:
- Porta `6543` per connessioni pooled (usa questa per DATABASE_URL)
- Porta `5432` per connessioni dirette (usa questa per DIRECT_URL)

---

## PASSO 4: Installa e Avvia

Apri il **Terminale** (o PowerShell su Windows) nella cartella del progetto e esegui questi comandi UNO ALLA VOLTA:

```bash
# 1. Installa le dipendenze (aspetta che finisca, ci vogliono 1-2 minuti)
npm install

# 2. Crea le tabelle nel database
npx prisma generate
npx prisma db push

# 3. Avvia l'applicazione
npm run dev
```

---

## PASSO 5: Usa l'Applicazione!

1. Apri il browser
2. Vai su **http://localhost:3000**
3. Vedrai la landing page
4. Clicca **"Entra nel Hive"** o **"Sign Up"**
5. Registrati con email o Google
6. Completa l'onboarding scegliendo il tuo ruolo

---

## Problemi Comuni e Soluzioni

### "Error: Missing Clerk Publishable Key"
→ Controlla che `.env.local` esista e abbia le chiavi Clerk corrette

### "Error connecting to database"
→ Verifica che:
- La password in DATABASE_URL sia quella corretta di Supabase
- Non ci siano spazi extra nella stringa
- La porta sia 6543 (non 5432) per DATABASE_URL

### "prisma db push failed"
→ Prova:
```bash
npx prisma generate
npx prisma db push --force-reset
```

### "Module not found"
→ Esegui di nuovo:
```bash
npm install
```

### La pagina è bianca
→ Controlla la console del browser (F12) e il terminale per errori

---

## Costi

Tutto quello che hai configurato è **GRATUITO**:
- **Supabase Free Tier**: 500MB database, illimitato per test
- **Clerk Free Tier**: 10,000 utenti attivi/mese
- **Vercel Free Tier** (per deploy): hosting gratuito

Pagherai solo se vorrai:
- API AI (Anthropic/OpenAI) per le funzioni AI
- Stripe per i pagamenti reali
- Scalare oltre i limiti gratuiti

---

## Prossimi Passi (Opzionali)

### Aggiungere AI (per intake wizard e transfer pack):
1. Vai su https://console.anthropic.com
2. Crea account e ottieni API key
3. Aggiungi in `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### Aggiungere Pagamenti (Stripe):
1. Vai su https://stripe.com
2. Crea account
3. Vai in Developers → API Keys
4. Copia le chiavi test in `.env.local`

---

Hai problemi? Controlla i log nel terminale dove hai lanciato `npm run dev`!
