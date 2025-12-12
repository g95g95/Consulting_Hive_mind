import { logInfo, logEnvStatus } from './logger';

let initialized = false;

/**
 * Funzione chiamata all'avvio dell'applicazione
 * Logga lo stato delle variabili d'ambiente
 */
export function initializeApp(): void {
  if (initialized) return;
  initialized = true;

  if (process.env.IS_DEBUG === 'true') {
    logInfo('🚀 Consulting Hive Mind - Avvio applicazione');
    logInfo(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logInfo(`Timestamp: ${new Date().toISOString()}`);
    logEnvStatus();
    logInfo('🚀 Inizializzazione completata');
  }
}
