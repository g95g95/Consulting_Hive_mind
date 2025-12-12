import fs from 'fs';
import path from 'path';

/**
 * Sistema di logging locale per debug
 *
 * Variabili d'ambiente richieste:
 * - IS_DEBUG: "true" per abilitare il logging
 * - FILE_LOG_PATH: percorso cartella dove salvare i log (es: "C:/logs" o "/var/log/hivemind")
 *
 * I file di log vengono salvati come: arcHIVE_yyyyMMdd.log
 */

function getLogFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `arcHIVE_${year}${month}${day}.log`;
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

function isDebugEnabled(): boolean {
  return process.env.IS_DEBUG === 'true';
}

function getLogPath(): string | null {
  return process.env.FILE_LOG_PATH || null;
}

export function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;

  const logPath = getLogPath();
  if (!logPath) {
    console.warn('[LOGGER] IS_DEBUG=true ma FILE_LOG_PATH non è configurato');
    return;
  }

  const timestamp = formatTimestamp();
  const logLine = `[${timestamp}] [${level}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}\n`;

  // Log anche in console
  console.log(logLine.trim());

  try {
    // Crea la cartella se non esiste
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }

    const logFile = path.join(logPath, getLogFileName());
    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch (error) {
    console.error('[LOGGER] Errore scrittura log:', error);
  }
}

export function logInfo(message: string, data?: unknown): void {
  log('INFO', message, data);
}

export function logWarn(message: string, data?: unknown): void {
  log('WARN', message, data);
}

export function logError(message: string, data?: unknown): void {
  log('ERROR', message, data);
}

export function logDebug(message: string, data?: unknown): void {
  log('DEBUG', message, data);
}

/**
 * Verifica e logga lo stato di tutte le variabili d'ambiente
 */
export function logEnvStatus(): void {
  if (!isDebugEnabled()) return;

  logInfo('=== VERIFICA VARIABILI D\'AMBIENTE ===');

  const envVars = {
    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
      value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      required: true,
      mask: true
    },
    CLERK_SECRET_KEY: {
      value: process.env.CLERK_SECRET_KEY,
      required: true,
      mask: true
    },

    // Database
    DATABASE_URL: {
      value: process.env.DATABASE_URL,
      required: true,
      mask: true
    },
    DIRECT_URL: {
      value: process.env.DIRECT_URL,
      required: false,
      mask: true
    },

    // Stripe
    STRIPE_SECRET_KEY: {
      value: process.env.STRIPE_SECRET_KEY,
      required: false,
      mask: true
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      required: false,
      mask: true
    },

    // AI
    AI_PROVIDER: {
      value: process.env.AI_PROVIDER,
      required: false,
      mask: false
    },
    ANTHROPIC_API_KEY: {
      value: process.env.ANTHROPIC_API_KEY,
      required: false,
      mask: true
    },
    OPENAI_API_KEY: {
      value: process.env.OPENAI_API_KEY,
      required: false,
      mask: true
    },

    // App
    NEXT_PUBLIC_APP_URL: {
      value: process.env.NEXT_PUBLIC_APP_URL,
      required: false,
      mask: false
    },

    // Debug
    IS_DEBUG: {
      value: process.env.IS_DEBUG,
      required: false,
      mask: false
    },
    FILE_LOG_PATH: {
      value: process.env.FILE_LOG_PATH,
      required: false,
      mask: false
    }
  };

  let allRequiredPresent = true;

  for (const [name, config] of Object.entries(envVars)) {
    const isPresent = !!config.value && config.value.length > 0;
    const status = isPresent ? '✅ OK' : (config.required ? '❌ MANCANTE' : '⚠️ Non configurato');

    let displayValue = 'non impostato';
    if (isPresent) {
      if (config.mask) {
        // Mostra solo primi 8 e ultimi 4 caratteri
        const val = config.value!;
        if (val.length > 12) {
          displayValue = `${val.substring(0, 8)}...${val.substring(val.length - 4)}`;
        } else {
          displayValue = '***';
        }
      } else {
        displayValue = config.value!;
      }
    }

    logInfo(`${status} | ${name}: ${displayValue}`);

    if (config.required && !isPresent) {
      allRequiredPresent = false;
    }
  }

  logInfo('=== FINE VERIFICA ===');

  if (allRequiredPresent) {
    logInfo('✅ Tutte le variabili obbligatorie sono configurate');
  } else {
    logError('❌ ATTENZIONE: Alcune variabili obbligatorie mancano!');
  }
}
