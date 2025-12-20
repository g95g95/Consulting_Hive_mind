# ORCHESTRATORE AI - Documentazione Completa

Questa guida documenta in dettaglio l'architettura AI della piattaforma Consulting Hive Mind, basata su un sistema multi-agente orchestrato.

---

## Indice

1. [Panoramica Architetturale](#1-panoramica-architetturale)
2. [L'Orchestrator](#2-lorchestrator)
3. [Sistema degli Intent](#3-sistema-degli-intent)
4. [Agenti Specializzati](#4-agenti-specializzati)
5. [Tool Registry](#5-tool-registry)
6. [Tool Handlers](#6-tool-handlers)
7. [Provider Gemini](#7-provider-gemini)
8. [API Endpoints](#8-api-endpoints)
9. [Flussi di Esecuzione](#9-flussi-di-esecuzione)
10. [Sicurezza e Redazione](#10-sicurezza-e-redazione)
11. [Configurazione](#11-configurazione)
12. [Esempi di Utilizzo](#12-esempi-di-utilizzo)

---

## 1. Panoramica Architetturale

### Pattern: ReAct (Reasoning + Acting) con Tool-Use

L'architettura segue il pattern ReAct dove l'AI ragiona sul problema, decide quali azioni intraprendere, e utilizza tool specifici per completare i task.

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                           │
│                   (src/lib/ai/orchestrator.ts)              │
│                                                             │
│  Intent Detection → Agent Selection → Tool Execution        │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ IntakeAgent │     │MatcherAgent│     │TransferAgent│
│ (refinement)│     │  (scoring)  │     │ (knowledge) │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│ RedactionAgent  │  │  HiveAgent  │  │HiveContribution │
│  (PII/secrets)  │  │  (search)   │  │    Agent        │
└─────────────────┘  └─────────────┘  └─────────────────┘
```

### Componenti Principali

| Componente | File | Responsabilità |
|------------|------|----------------|
| Orchestrator | `src/lib/ai/orchestrator.ts` | Coordinamento centrale, routing intent, aggregazione risultati |
| Agents | `src/lib/ai/agents/*.ts` | Logica specializzata per ogni dominio |
| Tools | `src/lib/ai/tools/registry.ts` | Definizione schema tool per function calling |
| Handlers | `src/lib/ai/tools/handlers.ts` | Implementazione effettiva dei tool |
| Provider | `src/lib/ai/providers/gemini.ts` | Interfaccia con Gemini API |

---

## 2. L'Orchestrator

**File:** `src/lib/ai/orchestrator.ts`

L'Orchestrator è il cuore del sistema AI. Coordina tutte le operazioni AI ricevendo richieste, determinando l'intent, selezionando l'agente appropriato, e restituendo risultati strutturati.

### Classe Orchestrator

```typescript
class Orchestrator {
  private model: string;

  constructor(model?: string) {
    // Usa variabile d'ambiente o default
    this.model = model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  async process(request: OrchestratorRequest): Promise<OrchestratorResponse>
}
```

### Tipi Principali

```typescript
// Tipi di agente disponibili
type AgentType = "intake" | "matcher" | "transfer" | "redaction" | "hive" | "hive_contribution";

// Intent supportati
type OrchestratorIntent =
  | "refine_request"      // Raffinare richieste grezze
  | "match_consultants"   // Trovare match consultant
  | "generate_transfer_pack"  // Generare Transfer Pack
  | "redact_content"      // Redazione contenuto
  | "search_hive"         // Ricerca in hive library
  | "refine_contribution" // Raffinare contribuzioni hive
  | "unknown";            // Fallback

// Richiesta all'orchestrator
interface OrchestratorRequest {
  intent: OrchestratorIntent;
  context: Record<string, unknown>;
  userId?: string;
}

// Risposta dell'orchestrator
interface OrchestratorResponse {
  success: boolean;
  intent: OrchestratorIntent;
  agentUsed: AgentType | AgentType[];
  result: unknown;
  toolsUsed?: string[];
  executionTimeMs: number;
  error?: string;
}
```

### Metodi Interni

#### `buildUserMessage(intent, context): string`
Costruisce il messaggio da inviare all'AI basandosi sull'intent e il contesto.

#### `parseAgentResponse(intent, text): unknown`
Parsifica la risposta dell'AI in formato strutturato, con fallback sicuri.

#### `getTemperatureForIntent(intent): number`
Restituisce la temperatura ottimale per ogni intent:
- `refine_request`: 0.5 (strutturato)
- `match_consultants`: 0.5 (analitico)
- `generate_transfer_pack`: 0.6 (leggermente creativo)
- `redact_content`: 0.3 (conservativo)
- `search_hive`: 0.4 (bilanciato)

#### `getMaxTokensForIntent(intent): number`
Restituisce il limite token per ogni intent:
- `refine_request`: 1500
- `match_consultants`: 2000
- `generate_transfer_pack`: 3000
- `redact_content`: 2000
- `search_hive`: 1500

### Singleton e Funzioni Helper

```typescript
// Ottiene l'istanza singleton
function getOrchestrator(): Orchestrator

// Funzioni di convenienza
async function refineRequest(rawDescription: string): Promise<OrchestratorResponse>
async function matchConsultants(requestId: string, details: Record<string, unknown>): Promise<OrchestratorResponse>
async function generateTransferPack(engagementId: string, details: Record<string, unknown>): Promise<OrchestratorResponse>
async function redactContent(content: string, contentType?: string): Promise<OrchestratorResponse>
async function searchHive(query: string, filters?: Record<string, unknown>): Promise<OrchestratorResponse>
```

---

## 3. Sistema degli Intent

### Mapping Intent → Agent

```typescript
const INTENT_MAP: Record<OrchestratorIntent, AgentType> = {
  refine_request: "intake",
  match_consultants: "matcher",
  generate_transfer_pack: "transfer",
  redact_content: "redaction",
  search_hive: "hive",
  unknown: "intake", // Default fallback
};
```

### Rilevamento Automatico Intent

La funzione `detectIntent(context)` determina automaticamente l'intent basandosi sul contesto:

```typescript
function detectIntent(context: Record<string, unknown>): OrchestratorIntent {
  // Intent esplicito
  if (context.explicitIntent) return context.explicitIntent;

  // Inferenza dal contesto
  if (context.rawDescription || context.description) return "refine_request";
  if (context.requestId && context.findConsultants) return "match_consultants";
  if (context.engagementId && context.generateTransferPack) return "generate_transfer_pack";
  if (context.contentToRedact || context.contribution) return "redact_content";
  if (context.searchQuery && context.searchHive) return "search_hive";

  return "unknown";
}
```

### Contesto Richiesto per Intent

| Intent | Campi Obbligatori | Campi Opzionali |
|--------|-------------------|-----------------|
| `refine_request` | `rawDescription` | - |
| `match_consultants` | `requestId` | `title`, `summary`, `skills`, `desiredOutcome`, `budget` |
| `generate_transfer_pack` | `engagementId` | `requestTitle`, `requestSummary`, `desiredOutcome`, `agenda`, `notes`, `messages` |
| `redact_content` | `contentToRedact` | `contentType` |
| `search_hive` | `searchQuery` | `filters` |

---

## 4. Agenti Specializzati

### 4.1 IntakeAgent

**File:** `src/lib/ai/agents/intake.ts`

**Responsabilità:** Trasforma descrizioni grezze di problemi in scope strutturati per le consulenze.

#### Metodi

```typescript
class IntakeAgent {
  // Raffina una richiesta grezza
  async refine(rawDescription: string): Promise<IntakeResult>

  // Classifica dominio e suggerisce skill
  async classifyDomain(summary: string): Promise<{
    primaryDomain: string;
    secondaryDomains: string[];
    suggestedSkills: string[];
  }>

  // Rileva dati sensibili
  async detectSensitiveData(content: string): Promise<{
    hasSensitiveData: boolean;
    types: string[];
    locations: string[];
    recommendation: string;
  }>
}
```

#### IntakeResult

```typescript
interface IntakeResult {
  summary: string;              // Sommario 2-3 frasi
  constraints: string;          // Vincoli identificati
  desiredOutcome: string;       // Risultato desiderato
  suggestedDuration: 30 | 60 | 90;  // Durata suggerita in minuti
  suggestedSkills: string[];    // Skill tag suggeriti
  sensitiveDataWarning: boolean; // Flag dati sensibili
  clarifyingQuestions?: string[]; // Domande di chiarimento
  confidence: "high" | "medium" | "low";
}
```

#### Tassonomia Skill

L'IntakeAgent suggerisce skill da questa tassonomia:

- **AI/ML:** LLMs, Machine Learning, MLOps, Computer Vision, NLP, RAG Systems, AI Agents, Prompt Engineering
- **Data:** Data Engineering, Data Science, Analytics, Data Visualization, ETL/ELT
- **Infrastructure:** Cloud Architecture, AWS, GCP, Azure, Kubernetes, DevOps, Platform Engineering
- **Security:** Security Architecture, Penetration Testing, Compliance, Identity Management
- **Engineering:** Backend Development, Frontend Development, Full-Stack Development, API Design, System Design, Code Review
- **Product:** Product Architecture, Technical Strategy, Technical Due Diligence, Roadmap Planning
- **Enterprise:** ERP Integration, SAP, Salesforce, Legacy Modernization

#### Linee Guida Durata

- **30 minuti:** Domande rapide, consigli tecnici specifici, code review
- **60 minuti:** Consultazione standard, review architettura, problem-solving
- **90 minuti:** Problemi complessi, pianificazione strategica, deep dive

---

### 4.2 MatcherAgent

**File:** `src/lib/ai/agents/matcher.ts`

**Responsabilità:** Trova e valuta i match tra richieste dei clienti e consultant disponibili.

#### Metodi

```typescript
class MatcherAgent {
  // Trova tutti i match per una richiesta
  async findMatches(
    requestId: string,
    requestDetails: {
      title?: string;
      summary?: string;
      skills?: string[];
      desiredOutcome?: string;
      budget?: number;
    }
  ): Promise<MatchingResult>

  // Calcola score per un singolo match
  async calculateScore(
    requestDetails: { title: string; summary: string; skills: string[]; desiredOutcome: string },
    consultantDetails: { id: string; name: string; headline: string; bio: string; skills: string[]; rating: number }
  ): Promise<{ score: number; reason: string }>
}
```

#### MatchingResult

```typescript
interface MatchResult {
  consultantId: string;
  consultantName: string;
  score: number;              // 0-100
  reason: string;             // Spiegazione del match
  skillOverlap: string[];     // Skill in comune
  highlights: string[];       // Punti di forza
}

interface MatchingResult {
  matches: MatchResult[];
  searchCriteria: {
    skills: string[];
    budget?: number;
    availability?: string;
  };
  recommendations: string;    // Consigli per il cliente
  totalCandidates: number;
}
```

#### Criteri di Matching (per importanza)

1. **Skill Overlap (50%):** Match diretto delle competenze
2. **Livello Esperienza (20%):** Headline, bio, anni di esperienza
3. **Rating & Reviews (15%):** Valutazione media, numero engagement
4. **Disponibilità & Tariffa (15%):** Vincoli budget, disponibilità

#### Range Score

- **90-100:** Eccellente - consultant quasi perfetto
- **70-89:** Buono - forte allineamento con gap minori
- **50-69:** Moderato - alcune skill rilevanti ma gap significativi
- **< 50:** Debole - non raccomandato

---

### 4.3 TransferAgent

**File:** `src/lib/ai/agents/transfer.ts`

**Responsabilità:** Genera Transfer Pack per trasferire conoscenza al cliente e renderlo autonomo.

#### Filosofia

> "The platform's deeper purpose is to transfer competence inward so clients become autonomous; the platform is SCAFFOLDING, not a toll bridge."

#### Metodi

```typescript
class TransferAgent {
  // Genera Transfer Pack completo
  async generate(engagementData: {
    engagementId?: string;
    requestTitle?: string;
    requestSummary?: string;
    desiredOutcome?: string;
    agenda?: string;
    notes?: Array<{ title?: string; content: string }>;
    messages?: Array<{ content: string; authorRole?: string }>;
  }): Promise<TransferPackResult>

  // Genera solo il sommario
  async generateSummary(context: {
    requestTitle: string;
    notes: string[];
    messages: string[];
  }): Promise<string>

  // Estrae decisioni
  async extractDecisions(notes: string[], messages: string[]): Promise<string[]>

  // Genera runbook
  async generateRunbook(decisions: string[], desiredOutcome: string): Promise<string>

  // Genera checklist di internalizzazione
  async generateChecklist(summary: string, decisions: string[]): Promise<string[]>
}
```

#### TransferPackResult

```typescript
interface TransferPackResult {
  summary: string;                    // Executive summary (3-5 frasi)
  keyDecisions: string;               // Decisioni chiave come bullet list
  runbook: string;                    // Istruzioni step-by-step
  nextSteps: string;                  // Prossimi passi prioritizzati
  internalizationChecklist: string;   // Checklist "I can now..."
  confidence: "high" | "medium" | "low";
}
```

#### Componenti Transfer Pack

1. **Executive Summary (3-5 frasi)**
   - Qual era il problema originale?
   - Cosa è stato realizzato?
   - Qual è il takeaway chiave?

2. **Key Decisions (bullet points)**
   - Ogni decisione con il suo reasoning
   - Alternative considerate e scartate

3. **Runbook (step-by-step)**
   - Istruzioni numerate e self-contained
   - Comandi, config, snippet di codice
   - Outcome attesi per verifica

4. **Next Steps (lista prioritizzata)**
   - Priorità: HIGH / MEDIUM / LOW
   - Stime di effort: quick win, medium, larger initiative

5. **Internalization Checklist**
   - Formato: "I can now..."
   - Metodi di verifica per ogni competenza

---

### 4.4 RedactionAgent

**File:** `src/lib/ai/agents/redaction.ts`

**Responsabilità:** Rileva e redige informazioni sensibili prima della condivisione pubblica.

#### Principio di Sicurezza

> "When in doubt, REDACT."
> I falsi positivi sono molto meglio del leak di dati sensibili.

#### Metodi

```typescript
class RedactionAgent {
  // Redazione completa (dual-pass: regex + AI)
  async redact(
    content: string,
    contentType?: "pattern" | "prompt" | "stack_template" | "general"
  ): Promise<RedactionResult>

  // Quick check senza redazione
  async detectSensitiveData(content: string): Promise<{
    hasSensitiveData: boolean;
    types: string[];
    severity: "high" | "medium" | "low";
    recommendation: string;
  }>

  // Redazione regex-based (metodo interno, primo pass)
  private regexRedact(content: string): {
    partialRedacted: string;
    detectedPII: string[];
    detectedSecrets: string[];
    changes: Array<{ type: string; original: string; replacement: string }>;
  }
}
```

#### RedactionResult

```typescript
interface RedactionResult {
  redactedText: string;         // Testo con redazioni
  detectedPII: string[];        // Tipi PII rilevati
  detectedSecrets: string[];    // Tipi segreti rilevati
  confidence: "high" | "medium" | "low";
  requiresManualReview: boolean; // Flag per review umana
  changes: Array<{              // Log delle modifiche
    type: string;
    original: string;
    replacement: string;
  }>;
}
```

#### Categorie di Redazione

**PII (Personally Identifiable Information):**
| Tipo | Placeholder |
|------|-------------|
| Nomi personali | `[NAME]` |
| Email | `[EMAIL]` |
| Telefoni | `[PHONE]` |
| Indirizzi | `[ADDRESS]` |
| SSN | `[SSN]` |
| Carte di credito | `[CREDIT_CARD]` |
| Info finanziarie | `[FINANCIAL]` |
| Info sanitarie | `[HEALTH_INFO]` |
| ID generici | `[ID]` |

**Company Information:**
| Tipo | Placeholder |
|------|-------------|
| Nomi aziende | `[COMPANY]` |
| Info interne | `[INTERNAL]` |

**Secrets:**
| Tipo | Placeholder |
|------|-------------|
| OpenAI keys | `[REDACTED_OPENAI_KEY]` |
| AWS keys | `[REDACTED_AWS_KEY]` |
| API keys generici | `[REDACTED_API_KEY]` |
| Password | `[REDACTED_PASSWORD]` |
| Bearer token | `[REDACTED_TOKEN]` |
| Connection strings | `[REDACTED_CONNECTION_STRING]` |
| Altri segreti | `[REDACTED_SECRET]` |

#### Dual-Pass Architecture

1. **Primo Pass (Regex):** Veloce, deterministico, cattura pattern noti
2. **Secondo Pass (AI):** Semantico, cattura nomi, aziende, contesto

```
Content → Regex Redaction → Partial Redacted → AI Analysis → Final Redacted
                ↓                                    ↓
         detectedPII/Secrets                  Merged Results
```

#### Trigger Manual Review

`requiresManualReview = true` quando:
- Confidence è medium o low
- Nomi richiedono interpretazione contestuale
- Nomi azienda/prodotto ambigui
- Contenuto contiene codice con potenziali segreti
- Qualsiasi incertezza

---

### 4.5 HiveContributionAgent

**File:** `src/lib/ai/agents/hive-contribution.ts`

**Responsabilità:** Raffina e migliora le contribuzioni alla hive library prima dell'inserimento.

#### Filosofia

> "Help users contribute high-quality knowledge that benefits the whole hive."

L'agente aiuta i contributori a:
- Migliorare titoli e descrizioni per essere chiari e ricercabili
- Strutturare il contenuto secondo le best practice per ogni tipo
- Suggerire tag appropriati dalla tassonomia della piattaforma
- Valutare la qualità e suggerire miglioramenti

#### Metodi

```typescript
class HiveContributionAgent {
  // Raffina una contribuzione completa
  async refine(
    type: "pattern" | "prompt" | "stack",
    input: {
      title: string;
      description?: string;
      content: string;
      tags?: string[];
      uiTech?: string;      // Solo per stack
      backendTech?: string;
      databaseTech?: string;
      releaseTech?: string;
    }
  ): Promise<HiveContributionResult>

  // Quick quality check senza refinement completo
  async assessQuality(
    type: ContributionType,
    content: string
  ): Promise<{ score: number; issues: string[]; isAcceptable: boolean }>

  // Suggerisce tag dal contenuto
  async suggestTags(content: string, existingTags?: string[]): Promise<string[]>

  // Migliora solo titolo e descrizione
  async improveMetadata(
    type: ContributionType,
    title: string,
    description: string,
    contentPreview: string
  ): Promise<{ title: string; description: string }>
}
```

#### HiveContributionResult

```typescript
interface HiveContributionResult {
  // Metadata raffinati
  refinedTitle: string;           // Max 60 caratteri, chiaro e ricercabile
  refinedDescription: string;     // 2-3 frasi, spiega cosa è e perché è utile
  suggestedTags: string[];        // Tag dalla tassonomia
  suggestedCategory: string;      // AI/ML, Data, Infrastructure, etc.

  // Contenuto raffinato
  refinedContent: string;         // Struttura migliorata

  // Solo per Stack Templates
  stackMetadata?: {
    uiTech: string | null;
    backendTech: string | null;
    databaseTech: string | null;
    releaseTech: string | null;
  };

  // Valutazione qualità
  qualityScore: number;           // 0-100
  improvements: string[];         // Cosa è stato migliorato
  suggestions: string[];          // Suggerimenti aggiuntivi
  isReadyForSubmission: boolean;
  confidence: "high" | "medium" | "low";
}
```

#### Linee Guida per Tipo

**Pattern:**
- Problema → Soluzione → Implementazione → Risultati
- Codice di esempio obbligatorio
- Quando usarlo e quando no

**Prompt:**
- Scopo → Struttura con [PLACEHOLDER] → Output atteso
- Esempio di utilizzo consigliato
- Varianti per casi d'uso diversi

**Stack Template:**
- Overview → Componenti per layer → Setup → Costi → Scaling
- Razionale delle scelte tecnologiche
- Comandi per setup rapido

#### Quality Score

| Range | Significato |
|-------|-------------|
| 90-100 | Eccellente - pronto per approvazione immediata |
| 70-89 | Buono - miglioramenti minori suggeriti |
| 50-69 | Necessita lavoro - miglioramenti significativi richiesti |
| < 50 | Incompleto - sezioni principali mancanti |

---

## 5. Tool Registry

**File:** `src/lib/ai/tools/registry.ts`

Il Tool Registry definisce gli schemi dei tool che gli agenti possono chiamare.

### Struttura Tool

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  required?: string[];
}

interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: { type: string };
}
```

### Tool Disponibili

#### Intake Tools

```typescript
// Raffina descrizione grezza
refine_request: {
  parameters: { rawDescription: string }
}

// Classifica dominio
classify_domain: {
  parameters: { summary: string }
}

// Rileva dati sensibili
detect_sensitive_data: {
  parameters: { content: string }
}
```

#### Matching Tools

```typescript
// Cerca consultant
search_consultants: {
  parameters: {
    skills: string[];           // Obbligatorio
    minRating?: number;         // 0-5
    maxRate?: number;           // USD/ora
    availability?: "immediate" | "this_week" | "this_month" | "flexible";
  }
}

// Calcola score match
calculate_match_score: {
  parameters: {
    requestId: string;
    consultantId: string;
  }
}

// Genera spiegazione match
generate_match_explanation: {
  parameters: {
    matchScore: number;
    requestSummary: string;
    consultantSkills: string[];
  }
}
```

#### Transfer Tools

```typescript
// Riassumi engagement
summarize_engagement: {
  parameters: { engagementId: string }
}

// Estrai decisioni
extract_decisions: {
  parameters: {
    notes: string[];
    messages: string[];
  }
}

// Genera runbook
generate_runbook: {
  parameters: {
    decisions: string;
    desiredOutcome: string;
  }
}
```

#### Redaction Tools

```typescript
// Redigi PII
redact_pii: {
  parameters: { content: string }
}

// Redigi segreti
redact_secrets: {
  parameters: { content: string }
}

// Anonimizza completamente
anonymize_content: {
  parameters: {
    content: string;
    contentType: "pattern" | "prompt" | "stack_template";
  }
}
```

#### Hive Tools

```typescript
// Cerca pattern
search_patterns: {
  parameters: {
    query: string;
    domain?: string;
  }
}

// Cerca prompt
search_prompts: {
  parameters: {
    query: string;
    category?: string;
  }
}
```

### Grouping per Agente

```typescript
const AGENT_TOOLS = {
  intake: [refine_request, classify_domain, detect_sensitive_data],
  matcher: [search_consultants, calculate_match_score, generate_match_explanation],
  transfer: [summarize_engagement, extract_decisions, generate_runbook],
  redaction: [redact_pii, redact_secrets, anonymize_content],
  hive: [search_patterns, search_prompts],
};
```

---

## 6. Tool Handlers

**File:** `src/lib/ai/tools/handlers.ts`

I Tool Handlers implementano la logica effettiva quando un tool viene chiamato.

### Struttura Handler

```typescript
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
```

### Handler Registry

```typescript
const TOOL_HANDLERS: Record<string, ToolHandler> = {
  refine_request: handleRefineRequest,
  classify_domain: handleClassifyDomain,
  detect_sensitive_data: handleDetectSensitiveData,
  search_consultants: handleSearchConsultants,
  calculate_match_score: handleCalculateMatchScore,
  generate_match_explanation: handleGenerateMatchExplanation,
  summarize_engagement: handleSummarizeEngagement,
  extract_decisions: handleExtractDecisions,
  generate_runbook: handleGenerateRunbook,
  redact_pii: handleRedactPII,
  redact_secrets: handleRedactSecrets,
  anonymize_content: handleAnonymizeContent,
  search_patterns: handleSearchPatterns,
  search_prompts: handleSearchPrompts,
};
```

### Dettaglio Handler

#### `handleSearchConsultants`
Cerca nel database consultant che matchano i criteri specificati.

```typescript
// Query Prisma
db.consultantProfile.findMany({
  where: {
    AND: [
      skills.length > 0 ? { skills: { some: { skillTag: { name: { in: skills } } } } } : {},
      maxRate ? { hourlyRate: { lte: maxRate } } : {},
    ],
  },
  include: { user: true, skills: { include: { skillTag: true } } },
  take: 20,
});
```

#### `handleCalculateMatchScore`
Calcola lo score di match basato su skill overlap.

```typescript
// Formula
const skillScore = (overlap.length / requestSkills.size) * 100;
```

#### `handleSummarizeEngagement`
Recupera dati engagement dal database per il riassunto.

```typescript
// Include
{
  booking: { include: { request: true } },
  notes: true,
  messages: { take: 50, orderBy: { createdAt: "desc" } },
}
```

#### `handleRedactPII` / `handleRedactSecrets`
Applicano pattern regex per redazione.

Pattern rilevati:
- Email: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
- Telefoni: `/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g`
- SSN: `/\b\d{3}-\d{2}-\d{4}\b/g`
- OpenAI keys: `/sk-[a-zA-Z0-9]{48,}/g`
- AWS keys: `/AKIA[0-9A-Z]{16}/g`
- Password: `/(password|passwd|pwd)[=:\s]["']?[^\s"'&]{4,}["']?/gi`

#### `handleSearchPatterns` / `handleSearchPrompts`
Cerca nella hive library con filtri.

```typescript
// Query con text search
db.pattern.findMany({
  where: {
    AND: [
      { status: "APPROVED" },
      { OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ]},
      domain ? { category: { contains: domain, mode: "insensitive" } } : {},
    ],
  },
  take: 10,
  orderBy: { createdAt: "desc" },
});
```

---

## 7. Provider Gemini

**File:** `src/lib/ai/providers/gemini.ts`

Interfaccia con Google Gemini API.

### Inizializzazione

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY or GOOGLE_AI_API_KEY is required");
  return new GoogleGenerativeAI(apiKey);
}
```

### Funzioni Principali

```typescript
// Completion con tool support
async function generateGeminiCompletion(options: {
  model?: string;              // Default: process.env.GEMINI_MODEL || "gemini-2.0-flash"
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;          // Default: 2000
  temperature?: number;        // Default: 0.7
  tools?: Tool[];
  toolHandlers?: Record<string, ToolHandler>;
}): Promise<GeminiResponse>

// Completion semplice
async function simpleGeminiCompletion(
  prompt: string,
  options?: { model?: string; systemPrompt?: string; maxTokens?: number; temperature?: number }
): Promise<string>

// Parse JSON da risposta (gestisce markdown code blocks)
function parseJsonFromGeminiResponse<T>(text: string, fallback: T): T
```

### GeminiResponse

```typescript
interface GeminiResponse {
  text: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: ToolResult;
  }>;
  finishReason: string;
}
```

### JSON Parsing

La funzione `parseJsonFromGeminiResponse` gestisce vari formati di output:

```typescript
function parseJsonFromGeminiResponse<T>(text: string, fallback: T): T {
  // 1. Estrae da markdown code blocks: ```json ... ```
  // 2. Trova oggetto JSON raw: { ... }
  // 3. Parsa l'intera risposta come JSON
  // 4. Ritorna fallback se nessun parsing funziona
}
```

---

## 8. API Endpoints

### POST /api/ai/orchestrate

Endpoint centrale per tutte le operazioni AI.

**Autenticazione:** Richiede Clerk session

**Request Body:**
```typescript
{
  intent?: OrchestratorIntent;  // Opzionale, auto-detected se mancante
  context: Record<string, unknown>;
}
```

**Response (success):**
```typescript
{
  success: true;
  intent: OrchestratorIntent;
  agentUsed: AgentType | AgentType[];
  result: unknown;
  toolsUsed?: string[];
  executionTimeMs: number;
}
```

**Response (error):**
```typescript
{
  error: string;
  intent?: OrchestratorIntent;
  executionTimeMs?: number;
}
```

### GET /api/ai/orchestrate

API discovery - lista intent disponibili.

**Response:**
```typescript
{
  availableIntents: Array<{
    intent: string;
    description: string;
    requiredContext: string[];
    optionalContext: string[];
  }>;
  defaultModel: string;
}
```

### POST /api/ai/refine-request

Endpoint diretto per IntakeAgent.

**Request Body:**
```typescript
{ rawDescription: string }
```

**Response:**
```typescript
IntakeResult
```

### POST /api/offers

Crea offerta consultant con auto-matching.

**Flow:**
1. Verifica autorizzazione consultant
2. Recupera profilo consultant e request
3. Chiama `matcherAgent.calculateScore()` per AI match
4. Salva offerta con matchScore e matchReason

### POST /api/hive/contribute

Contribuisci alla hive library con auto-redazione.

**Flow:**
1. Chiama `redactionAgent.redact()` sul contenuto
2. Crea RedactionJob nel database
3. Salva Pattern/Prompt/StackTemplate con contenuto redatto
4. Audit log con dettagli redazione

### POST /api/engagements/[id]/transfer-pack

Genera Transfer Pack per un engagement.

**Flow:**
1. Recupera engagement con booking, notes, messages
2. Chiama `generateTransferPack()` dal provider
3. Upsert TransferPack nel database

---

## 9. Flussi di Esecuzione

### Flusso: Refinement Richiesta

```
Client Input (raw description)
        │
        ▼
POST /api/ai/refine-request
        │
        ▼
IntakeAgent.refine(rawDescription)
        │
        ▼
generateCompletion() with INTAKE_SYSTEM_PROMPT
        │
        ▼
Parse JSON response → IntakeResult
        │
        ▼
Return to client
```

### Flusso: Creazione Offerta con Match

```
Consultant creates offer
        │
        ▼
POST /api/offers
        │
        ▼
Fetch request + consultant profiles from DB
        │
        ▼
MatcherAgent.calculateScore(request, consultant)
        │
        ▼
generateCompletion() → { score: number, reason: string }
        │
        ▼
Save Offer with matchScore + matchReason
        │
        ▼
Return Offer
```

### Flusso: Contribuzione Hive Library

```
User submits contribution
        │
        ▼
POST /api/hive/contribute
        │
        ▼
RedactionAgent.redact(content, contentType)
        │
        ├─► regexRedact() - First pass
        │         │
        │         ▼
        │   partialRedacted + detected types
        │
        └─► generateCompletion() - Second pass (AI)
                  │
                  ▼
            Merge results
                  │
                  ▼
Create RedactionJob record
        │
        ▼
Save Pattern/Prompt/StackTemplate with redacted content
        │
        ▼
Audit log
        │
        ▼
Return contribution + redactionInfo
```

### Flusso: Generazione Transfer Pack

```
POST /api/engagements/[id]/transfer-pack
        │
        ▼
Fetch engagement with relations
        │
        ▼
generateTransferPack() from provider
        │
        ▼
TransferAgent.generate(engagementData)
        │
        ▼
generateCompletion() with TRANSFER_SYSTEM_PROMPT
        │
        ▼
Parse JSON → TransferPackResult
        │
        ▼
Upsert TransferPack in DB
        │
        ▼
Return TransferPack
```

---

## 10. Sicurezza e Redazione

### Principi di Sicurezza

1. **Conservative Redaction:** Meglio falsi positivi che data leak
2. **Dual-Pass:** Regex (veloce) + AI (semantico)
3. **Manual Review Flag:** Sempre per casi incerti
4. **Audit Trail:** Ogni redazione è loggata

### Pipeline di Redazione

```
Original Content
        │
        ▼
┌─────────────────────────────────┐
│ REGEX PASS                      │
│ - Email pattern                 │
│ - Phone pattern                 │
│ - SSN pattern                   │
│ - Credit card pattern           │
│ - API key patterns              │
│ - Password patterns             │
│ - Connection string patterns    │
└─────────────────────────────────┘
        │
        ▼
Partially Redacted + Detected Types
        │
        ▼
┌─────────────────────────────────┐
│ AI PASS                         │
│ - Personal names detection      │
│ - Company names detection       │
│ - Contextual sensitive data     │
│ - Code-embedded secrets         │
└─────────────────────────────────┘
        │
        ▼
Fully Redacted + Merged Results
        │
        ▼
Set confidence + requiresManualReview
        │
        ▼
Create RedactionJob record
```

### Confidence Levels

- **High:** Tutti i pattern sono chiari e non ambigui
- **Medium:** Alcuni pattern richiedono interpretazione
- **Low:** Molti pattern ambigui, richiede review umana

### Audit Trail

Ogni operazione di redazione crea:
1. `RedactionJob` nel database con originalText e redactedText
2. `AuditLog` con metadata sulla redazione

---

## 11. Configurazione

### Variabili d'Ambiente

```env
# API Key Gemini (una delle due)
GEMINI_API_KEY=AIza...
GOOGLE_AI_API_KEY=AIza...

# Modello (configurabile, default: gemini-2.0-flash)
GEMINI_MODEL=gemini-2.0-flash
```

### Modelli Disponibili

| Modello | Uso Consigliato |
|---------|-----------------|
| `gemini-2.0-flash` | Default, veloce e bilanciato |
| `gemini-2.5-pro` | Migliore qualità, più lento |
| `gemini-1.5-pro` | Stabile, buona qualità |
| `gemini-1.5-flash` | Veloce, costo minore |

### Temperature per Intent

| Intent | Temperature | Rationale |
|--------|-------------|-----------|
| `refine_request` | 0.5 | Output strutturato |
| `match_consultants` | 0.5 | Analitico, consistente |
| `generate_transfer_pack` | 0.6 | Leggermente creativo |
| `redact_content` | 0.3 | Molto conservativo |
| `search_hive` | 0.4 | Bilanciato |

---

## 12. Esempi di Utilizzo

### Esempio 1: Raffinare una Richiesta

```typescript
// Frontend
const response = await fetch('/api/ai/refine-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rawDescription: "Abbiamo un problema con le performance del nostro sistema ML in produzione. I tempi di inferenza sono troppo alti e non riusciamo a scalare. Usiamo PyTorch e deployamo su AWS. Budget limitato."
  })
});

const result = await response.json();
// {
//   summary: "Sistema ML con problemi di performance in produzione...",
//   constraints: "PyTorch, AWS, budget limitato",
//   desiredOutcome: "Riduzione tempi di inferenza e scalabilità",
//   suggestedDuration: 60,
//   suggestedSkills: ["MLOps", "AWS", "Machine Learning"],
//   sensitiveDataWarning: false,
//   confidence: "high"
// }
```

### Esempio 2: Orchestrate Generico

```typescript
// Chiamata all'orchestrator
const response = await fetch('/api/ai/orchestrate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    intent: 'redact_content',
    context: {
      contentToRedact: "Contatta Mario Rossi a mario@example.com per la API key sk-abc123...",
      contentType: 'pattern'
    }
  })
});

const result = await response.json();
// {
//   success: true,
//   intent: "redact_content",
//   agentUsed: "redaction",
//   result: {
//     redactedText: "Contatta [NAME] a [EMAIL] per la API key [REDACTED_OPENAI_KEY]...",
//     detectedPII: ["names", "emails"],
//     detectedSecrets: ["openai_api_key"],
//     confidence: "high",
//     requiresManualReview: false
//   },
//   toolsUsed: ["redact_pii", "redact_secrets"],
//   executionTimeMs: 1234
// }
```

### Esempio 3: Backend - Calcolo Match Score

```typescript
import { getMatcherAgent } from '@/lib/ai/agents';

const matcherAgent = getMatcherAgent();

const matchResult = await matcherAgent.calculateScore(
  {
    title: "Ottimizzazione Pipeline ML",
    summary: "Serve aiuto per ottimizzare pipeline di training",
    skills: ["MLOps", "Python", "AWS"],
    desiredOutcome: "Pipeline più veloce del 50%"
  },
  {
    id: "consultant-123",
    name: "Alice",
    headline: "Senior ML Engineer",
    bio: "10 anni di esperienza in MLOps e ottimizzazione...",
    skills: ["MLOps", "Python", "AWS", "Kubernetes"],
    rating: 4.8
  }
);

// { score: 92, reason: "Excellent match. Alice has direct experience..." }
```

### Esempio 4: Backend - Generazione Transfer Pack

```typescript
import { getTransferAgent } from '@/lib/ai/agents';

const transferAgent = getTransferAgent();

const pack = await transferAgent.generate({
  requestTitle: "Setup CI/CD Pipeline",
  requestSummary: "Cliente necessita pipeline CI/CD per microservizi",
  desiredOutcome: "Deploy automatizzato in produzione",
  agenda: "1. Review architettura\n2. Design pipeline\n3. Implementazione",
  notes: [
    { title: "Architettura", content: "3 microservizi, Kubernetes, GitLab CI" },
    { title: "Decisione", content: "Useremo ArgoCD per GitOps" }
  ],
  messages: [
    { content: "Preferisco approccio GitOps", authorRole: "client" },
    { content: "ArgoCD è la scelta migliore per questo caso", authorRole: "consultant" }
  ]
});

// {
//   summary: "Setup completo di pipeline CI/CD GitOps...",
//   keyDecisions: "- Adozione ArgoCD per GitOps\n- ...",
//   runbook: "1. Installare ArgoCD...\n2. Configurare...",
//   nextSteps: "1. [HIGH] Completare config staging...",
//   internalizationChecklist: "- [ ] I can now deploy to production...",
//   confidence: "high"
// }
```

---

## Appendice: File Structure

```
src/lib/ai/
├── orchestrator.ts           # Orchestrator centrale
├── providers/
│   ├── index.ts              # Export providers
│   └── gemini.ts             # Gemini API client
├── agents/
│   ├── index.ts              # Export agents
│   ├── intake.ts             # IntakeAgent
│   ├── matcher.ts            # MatcherAgent
│   ├── transfer.ts           # TransferAgent
│   ├── redaction.ts          # RedactionAgent
│   └── hive-contribution.ts  # HiveContributionAgent
└── tools/
    ├── registry.ts           # Tool definitions
    └── handlers.ts           # Tool implementations

src/app/api/ai/
├── orchestrate/
│   └── route.ts              # POST/GET /api/ai/orchestrate
├── refine-request/
│   └── route.ts              # POST /api/ai/refine-request
└── refine-contribution/
    └── route.ts              # POST/GET /api/ai/refine-contribution
```

---

*Documento generato per Consulting Hive Mind Platform*
*Versione: 1.0*
