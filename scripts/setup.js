#!/usr/bin/env node

/**
 * Script di setup interattivo per Consulting Hive Mind
 * Esegui con: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

async function main() {
  console.log('\n========================================');
  console.log('   CONSULTING HIVE MIND - SETUP');
  console.log('========================================\n');

  // Check if .env.local exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.local esiste già. Vuoi sovrascriverlo? (s/N): ');
    if (overwrite.toLowerCase() !== 's') {
      console.log('\nSetup annullato. Il file .env.local non è stato modificato.');
      rl.close();
      return;
    }
  }

  console.log('\nTi guiderò nella configurazione. Premi INVIO per saltare i campi opzionali.\n');
  console.log('--- CLERK (obbligatorio) ---');
  console.log('Trova le chiavi su: https://dashboard.clerk.com -> API Keys\n');

  const clerkPublishable = await question('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_...): ');
  const clerkSecret = await question('CLERK_SECRET_KEY (sk_test_...): ');

  if (!clerkPublishable || !clerkSecret) {
    console.log('\n⚠️  Le chiavi Clerk sono obbligatorie! Vai su clerk.com per crearle.');
    rl.close();
    return;
  }

  console.log('\n--- SUPABASE DATABASE (obbligatorio) ---');
  console.log('Trova la connection string su: Supabase Dashboard -> Settings -> Database -> Connection string -> URI\n');

  const dbUrl = await question('DATABASE_URL (postgresql://postgres...porta 6543): ');
  const directUrl = await question('DIRECT_URL (postgresql://postgres...porta 5432): ');

  if (!dbUrl) {
    console.log('\n⚠️  DATABASE_URL è obbligatorio! Vai su supabase.com per creare un progetto.');
    rl.close();
    return;
  }

  console.log('\n--- AI PROVIDERS (opzionale) ---');
  const anthropicKey = await question('ANTHROPIC_API_KEY (sk-ant-..., premi INVIO per saltare): ');
  const openaiKey = await question('OPENAI_API_KEY (sk-..., premi INVIO per saltare): ');

  console.log('\n--- STRIPE (opzionale) ---');
  const stripeSecret = await question('STRIPE_SECRET_KEY (sk_test_..., premi INVIO per saltare): ');
  const stripePublishable = await question('STRIPE_PUBLISHABLE_KEY (pk_test_..., premi INVIO per saltare): ');

  console.log('\n--- DEBUG LOGGING (opzionale) ---');
  const enableDebug = await question('Vuoi abilitare il debug logging? (s/N): ');
  let logPath = '';
  if (enableDebug.toLowerCase() === 's') {
    logPath = await question('FILE_LOG_PATH (es: C:/logs/hivemind): ');
  }

  // Build .env.local content
  const envContent = `# ==========================================
# CONFIGURAZIONE CONSULTING HIVE MIND
# Generato automaticamente da setup.js
# ==========================================

# --- CLERK (Autenticazione) ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${clerkPublishable}
CLERK_SECRET_KEY=${clerkSecret}
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# --- DATABASE (Supabase) ---
DATABASE_URL="${dbUrl}"
DIRECT_URL="${directUrl || dbUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '')}"

# --- AI PROVIDERS ---
AI_PROVIDER=${anthropicKey ? 'anthropic' : openaiKey ? 'openai' : 'anthropic'}
ANTHROPIC_API_KEY=${anthropicKey || ''}
OPENAI_API_KEY=${openaiKey || ''}

# --- STRIPE (Pagamenti) ---
STRIPE_SECRET_KEY=${stripeSecret || ''}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripePublishable || ''}
STRIPE_WEBHOOK_SECRET=

# --- APP ---
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- DEBUG LOGGING ---
# Se IS_DEBUG=true, i log vengono scritti in FILE_LOG_PATH
# Nome file: arcHIVE_yyyyMMdd.log
IS_DEBUG=${enableDebug.toLowerCase() === 's' ? 'true' : 'false'}
FILE_LOG_PATH=${logPath || ''}
`;

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ File .env.local creato con successo!\n');
  console.log('Prossimi passi:');
  console.log('  1. npx prisma generate');
  console.log('  2. npx prisma db push');
  console.log('  3. npm run dev');
  console.log('\nPoi apri http://localhost:3000 nel browser!\n');

  rl.close();
}

main().catch(console.error);
