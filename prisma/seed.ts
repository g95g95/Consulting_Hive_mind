import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed Skill Tags
  const skillTags = [
    // AI/ML
    { name: 'Large Language Models', slug: 'llms', category: 'AI/ML' },
    { name: 'Machine Learning', slug: 'machine-learning', category: 'AI/ML' },
    { name: 'MLOps', slug: 'mlops', category: 'AI/ML' },
    { name: 'Computer Vision', slug: 'computer-vision', category: 'AI/ML' },
    { name: 'NLP', slug: 'nlp', category: 'AI/ML' },
    { name: 'RAG Systems', slug: 'rag', category: 'AI/ML' },
    { name: 'AI Agents', slug: 'ai-agents', category: 'AI/ML' },
    { name: 'Prompt Engineering', slug: 'prompt-engineering', category: 'AI/ML' },

    // Data
    { name: 'Data Engineering', slug: 'data-engineering', category: 'Data' },
    { name: 'Data Science', slug: 'data-science', category: 'Data' },
    { name: 'Analytics', slug: 'analytics', category: 'Data' },
    { name: 'Data Visualization', slug: 'data-viz', category: 'Data' },
    { name: 'ETL/ELT', slug: 'etl', category: 'Data' },

    // Infrastructure
    { name: 'Cloud Architecture', slug: 'cloud-architecture', category: 'Infrastructure' },
    { name: 'AWS', slug: 'aws', category: 'Infrastructure' },
    { name: 'GCP', slug: 'gcp', category: 'Infrastructure' },
    { name: 'Azure', slug: 'azure', category: 'Infrastructure' },
    { name: 'Kubernetes', slug: 'kubernetes', category: 'Infrastructure' },
    { name: 'DevOps', slug: 'devops', category: 'Infrastructure' },
    { name: 'Platform Engineering', slug: 'platform-engineering', category: 'Infrastructure' },

    // Security
    { name: 'Security Architecture', slug: 'security-architecture', category: 'Security' },
    { name: 'Penetration Testing', slug: 'pentesting', category: 'Security' },
    { name: 'Compliance', slug: 'compliance', category: 'Security' },
    { name: 'Identity Management', slug: 'iam', category: 'Security' },

    // Software Engineering
    { name: 'Backend Development', slug: 'backend', category: 'Engineering' },
    { name: 'Frontend Development', slug: 'frontend', category: 'Engineering' },
    { name: 'Full-Stack Development', slug: 'fullstack', category: 'Engineering' },
    { name: 'API Design', slug: 'api-design', category: 'Engineering' },
    { name: 'System Design', slug: 'system-design', category: 'Engineering' },
    { name: 'Code Review', slug: 'code-review', category: 'Engineering' },

    // Product & Architecture
    { name: 'Product Architecture', slug: 'product-architecture', category: 'Product' },
    { name: 'Technical Strategy', slug: 'tech-strategy', category: 'Product' },
    { name: 'Technical Due Diligence', slug: 'tech-due-diligence', category: 'Product' },
    { name: 'Roadmap Planning', slug: 'roadmap', category: 'Product' },

    // Enterprise
    { name: 'ERP Integration', slug: 'erp-integration', category: 'Enterprise' },
    { name: 'SAP', slug: 'sap', category: 'Enterprise' },
    { name: 'Salesforce', slug: 'salesforce', category: 'Enterprise' },
    { name: 'Legacy Modernization', slug: 'legacy-modernization', category: 'Enterprise' },
  ]

  for (const tag of skillTags) {
    await prisma.skillTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    })
  }
  console.log(`Seeded ${skillTags.length} skill tags`)

  // Seed Product SKUs
  const productSKUs = [
    {
      name: '30-Minute Consult',
      description: 'Quick consultation for focused questions',
      duration: 30,
      priceAmount: 7500, // 75 EUR
      currency: 'EUR',
      type: 'SESSION' as const,
    },
    {
      name: '60-Minute Consult',
      description: 'Standard consultation for in-depth discussions',
      duration: 60,
      priceAmount: 14000, // 140 EUR
      currency: 'EUR',
      type: 'SESSION' as const,
    },
    {
      name: '90-Minute Consult',
      description: 'Extended consultation for complex topics',
      duration: 90,
      priceAmount: 19500, // 195 EUR
      currency: 'EUR',
      type: 'SESSION' as const,
    },
    {
      name: 'Architecture Audit',
      description: 'Comprehensive review of your system architecture',
      duration: 240, // 4 hours
      priceAmount: 50000, // 500 EUR
      currency: 'EUR',
      type: 'AUDIT' as const,
    },
    {
      name: 'Security Audit',
      description: 'Security assessment and recommendations',
      duration: 480, // 8 hours
      priceAmount: 95000, // 950 EUR
      currency: 'EUR',
      type: 'AUDIT' as const,
    },
  ]

  for (const sku of productSKUs) {
    await prisma.productSKU.upsert({
      where: {
        id: sku.name.toLowerCase().replace(/\s+/g, '-')
      },
      update: {},
      create: {
        id: sku.name.toLowerCase().replace(/\s+/g, '-'),
        ...sku,
      },
    })
  }
  console.log(`Seeded ${productSKUs.length} product SKUs`)

  // Create test user for development (user/user)
  const testUser = await prisma.user.upsert({
    where: { clerkId: 'test_user_clerk_id' },
    update: {},
    create: {
      clerkId: 'test_user_clerk_id',
      email: 'user@test.local',
      firstName: 'Test',
      lastName: 'User',
      role: 'BOTH',
      onboarded: true,
    },
  })
  console.log(`Created test user: ${testUser.email}`)

  // Create consultant profile for test user
  const consultantProfile = await prisma.consultantProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      headline: 'Full-Stack Developer & AI Enthusiast',
      bio: 'Experienced developer with expertise in modern web technologies and AI integration.',
      hourlyRate: 15000, // 150 EUR
      languages: ['English', 'Italian'],
      timezone: 'Europe/Rome',
      isAvailable: true,
      consentDirectory: true,
      consentHiveMind: true,
    },
  })

  // Add skills to test consultant
  const testSkills = ['Full-Stack Development', 'Large Language Models', 'API Design', 'Cloud Architecture']
  for (const skillName of testSkills) {
    const skillTag = await prisma.skillTag.findFirst({ where: { name: skillName } })
    if (skillTag) {
      await prisma.consultantSkill.upsert({
        where: {
          profileId_skillTagId: {
            profileId: consultantProfile.id,
            skillTagId: skillTag.id,
          },
        },
        update: {},
        create: {
          profileId: consultantProfile.id,
          skillTagId: skillTag.id,
        },
      })
    }
  }
  console.log(`Added ${testSkills.length} skills to test consultant`)

  // Create client profile for test user
  await prisma.clientProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      companyName: 'Test Company',
      companyRole: 'CTO',
    },
  })

  // ============================================
  // HIVE MIND EXAMPLES (10 items)
  // ============================================

  console.log('Seeding Hive Mind examples...')

  // PATTERNS (4 examples)
  const patterns = [
    {
      title: 'RAG Pipeline con Chunking Semantico',
      description: 'Pattern per implementare un sistema RAG con chunking basato su significato semantico invece che su lunghezza fissa.',
      content: `## Problema
I sistemi RAG tradizionali usano chunking a lunghezza fissa (es. 500 token), perdendo contesto semantico.

## Soluzione
Implementare chunking semantico che rispetta i confini naturali del testo:

1. **Pre-processing**: Dividere per paragrafi/sezioni
2. **Embedding di ogni chunk**: Usare modello embedding (es. text-embedding-3-small)
3. **Merge intelligente**: Unire chunk consecutivi semanticamente simili
4. **Metadata preservation**: Mantenere titoli, sezioni, riferimenti

## Implementazione
\`\`\`python
from langchain.text_splitter import RecursiveCharacterTextSplitter

def semantic_chunking(text, max_tokens=500):
    # Prima passa: split per struttura
    sections = split_by_headers(text)

    # Seconda passa: chunk adattivi
    chunks = []
    for section in sections:
        if token_count(section) <= max_tokens:
            chunks.append(section)
        else:
            # Split ricorsivo preservando frasi
            sub_chunks = recursive_split(section, max_tokens)
            chunks.extend(sub_chunks)

    return chunks
\`\`\`

## Risultati
- +23% accuracy su Q&A rispetto a chunking fisso
- -15% token usage per query
- Migliore coerenza nelle risposte`,
      category: 'AI/ML',
      tags: ['RAG', 'LLM', 'NLP', 'Embeddings'],
    },
    {
      title: 'Circuit Breaker per Microservizi',
      description: 'Implementazione del pattern Circuit Breaker per gestire fallimenti a cascata in architetture distribuite.',
      content: `## Problema
In un sistema di microservizi, il fallimento di un servizio può propagarsi causando cascade failure.

## Soluzione
Implementare il pattern Circuit Breaker con tre stati:
- **CLOSED**: Operazioni normali
- **OPEN**: Blocca tutte le richieste
- **HALF-OPEN**: Permette richieste di test

## Implementazione
\`\`\`typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;

  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 seconds
  private readonly halfOpenMaxCalls = 3;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.reset();
      }
    }
    this.failureCount = 0;
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
\`\`\`

## Metriche da monitorare
- Failure rate per servizio
- Tempo medio in stato OPEN
- Recovery time dopo half-open`,
      category: 'Engineering',
      tags: ['Microservizi', 'Resilienza', 'Backend', 'TypeScript'],
    },
    {
      title: 'Feature Flags con Rollout Graduale',
      description: 'Pattern per implementare feature flags con rollout percentuale e targeting per segmenti utente.',
      content: `## Problema
Rilasciare nuove feature a tutti gli utenti contemporaneamente è rischioso.

## Soluzione
Sistema di feature flags con:
- Rollout percentuale
- Targeting per segmenti
- Kill switch immediato

## Architettura
\`\`\`
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  Flag Service │────▶│   Config DB │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────┐
       └───────────▶│   Cache      │
                    └──────────────┘
\`\`\`

## Implementazione
\`\`\`typescript
interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  targeting: {
    segments: string[];
    userIds: string[];
  };
}

function isFeatureEnabled(
  flag: FeatureFlag,
  userId: string,
  userSegments: string[]
): boolean {
  // Check kill switch
  if (!flag.enabled) return false;

  // Check explicit user targeting
  if (flag.targeting.userIds.includes(userId)) return true;

  // Check segment targeting
  const inSegment = flag.targeting.segments
    .some(s => userSegments.includes(s));
  if (inSegment) return true;

  // Percentage rollout (deterministic per user)
  const hash = hashUserId(userId);
  return (hash % 100) < flag.rolloutPercentage;
}
\`\`\`

## Best Practices
1. Usare hash deterministico per consistenza
2. Cachare flags lato client (TTL 5-10 min)
3. Logging di ogni evaluation per analytics`,
      category: 'Product',
      tags: ['Feature Flags', 'DevOps', 'Release', 'Product'],
    },
    {
      title: 'Event Sourcing con CQRS',
      description: 'Pattern architetturale per sistemi che richiedono audit trail completo e scalabilità in lettura/scrittura separate.',
      content: `## Problema
Sistemi tradizionali CRUD perdono la storia delle modifiche e hanno difficoltà a scalare letture/scritture indipendentemente.

## Soluzione
- **Event Sourcing**: Salvare eventi invece dello stato
- **CQRS**: Separare modelli di lettura e scrittura

## Architettura
\`\`\`
        ┌─────────────┐
        │   Command   │
        │   Handler   │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │   Event     │
        │   Store     │
        └──────┬──────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐     ┌──────────┐
│ Projector│     │ Projector│
│  (Read)  │     │  (Report)│
└────┬─────┘     └────┬─────┘
     ▼                ▼
┌──────────┐     ┌──────────┐
│ Read DB  │     │ Analytics│
└──────────┘     └──────────┘
\`\`\`

## Eventi tipo
\`\`\`typescript
interface DomainEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata: {
    timestamp: Date;
    userId: string;
    correlationId: string;
  };
  version: number;
}

// Esempio: Order aggregate
type OrderEvent =
  | { type: 'OrderCreated'; items: OrderItem[] }
  | { type: 'ItemAdded'; item: OrderItem }
  | { type: 'OrderPaid'; paymentId: string }
  | { type: 'OrderShipped'; trackingNumber: string };
\`\`\`

## Quando usarlo
- Audit trail obbligatorio (finance, healthcare)
- Alta asimmetria read/write
- Necessità di "time travel" (ricostruire stato passato)`,
      category: 'Engineering',
      tags: ['Event Sourcing', 'CQRS', 'Architecture', 'Backend'],
    },
  ]

  for (const pattern of patterns) {
    await prisma.pattern.upsert({
      where: { id: pattern.title.toLowerCase().replace(/\s+/g, '-').slice(0, 25) },
      update: {},
      create: {
        id: pattern.title.toLowerCase().replace(/\s+/g, '-').slice(0, 25),
        creatorId: testUser.id,
        title: pattern.title,
        description: pattern.description,
        content: pattern.content,
        category: pattern.category,
        tags: pattern.tags,
        status: 'APPROVED',
      },
    })
  }
  console.log(`Seeded ${patterns.length} patterns`)

  // PROMPTS (4 examples)
  const prompts = [
    {
      title: 'Code Review Approfondita',
      description: 'Prompt per ottenere una code review dettagliata con focus su sicurezza, performance e manutenibilità.',
      content: `Analizza il seguente codice come un senior engineer esperto. Fornisci una review strutturata seguendo questo formato:

## 1. Sicurezza
- Identifica vulnerabilità (injection, XSS, auth bypass, etc.)
- Valuta gestione secrets/credenziali
- Controlla input validation

## 2. Performance
- Complessità algoritmica (Big O)
- Potenziali memory leak
- Opportunità di caching
- Query N+1 o operazioni I/O inefficienti

## 3. Manutenibilità
- Aderenza a principi SOLID
- Naming conventions
- Separazione delle responsabilità
- Test coverage suggerita

## 4. Bug potenziali
- Race conditions
- Edge cases non gestiti
- Null pointer exceptions

## 5. Suggerimenti miglioramento
Per ogni issue, fornisci:
- Severità (Critical/High/Medium/Low)
- Codice corretto suggerito
- Spiegazione del perché

Codice da analizzare:
\`\`\`
[INSERISCI CODICE QUI]
\`\`\``,
      useCase: 'Code Review',
      tags: ['Code Review', 'Security', 'Performance', 'Best Practices'],
    },
    {
      title: 'Generatore di Test Cases',
      description: 'Prompt per generare test cases completi inclusi edge cases e scenari di errore.',
      content: `Sei un QA engineer esperto. Genera test cases completi per la seguente funzionalità/API.

## Informazioni sulla funzionalità
[DESCRIVI LA FUNZIONALITÀ]

## Output richiesto

### 1. Happy Path Tests
Test per il flusso principale di successo

### 2. Edge Cases
- Valori limite (0, max, empty, null)
- Caratteri speciali e unicode
- Formati non standard

### 3. Error Scenarios
- Input invalidi
- Errori di rete/timeout
- Stato inconsistente
- Permessi mancanti

### 4. Security Tests
- Injection attempts
- Authorization bypass
- Rate limiting

### 5. Performance Tests
- Load testing scenarios
- Concurrent access

Per ogni test case, specifica:
- **Nome**: Descrittivo e chiaro
- **Precondizioni**: Setup necessario
- **Input**: Dati di test
- **Expected Output**: Risultato atteso
- **Postcondizioni**: Stato finale

Genera i test in formato:
\`\`\`typescript
describe('[Feature]', () => {
  it('should [expected behavior]', async () => {
    // Arrange
    // Act
    // Assert
  });
});
\`\`\``,
      useCase: 'Testing',
      tags: ['Testing', 'QA', 'TDD', 'Test Cases'],
    },
    {
      title: 'Analisi Architettura Sistema',
      description: 'Prompt per analizzare e documentare l\'architettura di un sistema esistente.',
      content: `Agisci come un solution architect senior. Analizza il sistema descritto e produci documentazione architetturale completa.

## Sistema da analizzare
[DESCRIVI IL SISTEMA, STACK, COMPONENTI PRINCIPALI]

## Output richiesto

### 1. Overview Diagram
Descrivi un diagramma C4 (Context, Container, Component) in formato testuale/mermaid

### 2. Componenti principali
Per ogni componente:
- Responsabilità
- Tecnologie utilizzate
- Dipendenze
- API esposte

### 3. Flussi dati
- Flusso principale utente
- Flussi asincroni
- Integrazioni esterne

### 4. Punti di forza
- Cosa funziona bene
- Pattern correttamente applicati

### 5. Aree di miglioramento
- Technical debt identificato
- Bottleneck potenziali
- Rischi architetturali

### 6. Raccomandazioni
- Quick wins (basso effort, alto impatto)
- Evoluzioni medio termine
- Roadmap suggerita

Usa diagrammi Mermaid dove appropriato:
\`\`\`mermaid
graph TD
    A[Client] --> B[API Gateway]
    B --> C[Service A]
    B --> D[Service B]
\`\`\``,
      useCase: 'Architecture Review',
      tags: ['Architecture', 'Documentation', 'System Design', 'C4'],
    },
    {
      title: 'Migrazione Database Schema',
      description: 'Prompt per pianificare migrazioni di schema database con zero downtime.',
      content: `Sei un DBA esperto. Pianifica una migrazione di schema database con i seguenti requisiti:
- Zero downtime
- Rollback possibile
- Compatibilità backward durante la transizione

## Schema attuale
[DESCRIVI LO SCHEMA ATTUALE]

## Schema target
[DESCRIVI LE MODIFICHE DESIDERATE]

## Output richiesto

### 1. Analisi impatto
- Tabelle coinvolte
- Volume dati stimato
- Query impattate
- Indici da ricostruire

### 2. Strategia migrazione
Scegli tra:
- Expand-Contract pattern
- Shadow tables
- Blue-green deployment

### 3. Script di migrazione
Genera gli script SQL/ORM in ordine:
\`\`\`sql
-- Migration 001: Add new column (expand)
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- Migration 002: Backfill data
UPDATE users SET new_field = old_field WHERE new_field IS NULL;

-- Migration 003: Add constraints (after app deployed)
ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;

-- Migration 004: Remove old column (contract)
ALTER TABLE users DROP COLUMN old_field;
\`\`\`

### 4. Piano di rollback
Script per ogni step

### 5. Monitoring
- Query per verificare progresso
- Metriche da monitorare
- Alerting thresholds

### 6. Timeline
- Tempo stimato per step
- Finestre di manutenzione necessarie`,
      useCase: 'Database Migration',
      tags: ['Database', 'Migration', 'PostgreSQL', 'Zero Downtime'],
    },
  ]

  for (const prompt of prompts) {
    await prisma.prompt.upsert({
      where: { id: prompt.title.toLowerCase().replace(/\s+/g, '-').slice(0, 25) },
      update: {},
      create: {
        id: prompt.title.toLowerCase().replace(/\s+/g, '-').slice(0, 25),
        creatorId: testUser.id,
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        useCase: prompt.useCase,
        tags: prompt.tags,
        status: 'APPROVED',
      },
    })
  }
  console.log(`Seeded ${prompts.length} prompts`)

  // STACK TEMPLATES (2 examples)
  const stacks = [
    {
      title: 'SaaS Startup Stack 2024',
      description: 'Stack moderno e cost-effective per MVP SaaS con focus su developer experience e time-to-market.',
      content: `## Overview
Stack ottimizzato per startup che devono validare rapidamente un prodotto SaaS B2B.

## Componenti

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (semplice) o TanStack Query (per server state)
- **Forms**: React Hook Form + Zod

### Backend
- **API**: Next.js API Routes (o tRPC per type safety e2e)
- **Auth**: Clerk (social + email, zero config)
- **Database**: PostgreSQL su Neon (serverless, generous free tier)
- **ORM**: Prisma (migrazioni, type safety)

### Infra & Deploy
- **Hosting**: Vercel (frontend + API)
- **Storage**: Cloudflare R2 (S3-compatible, egress gratuito)
- **Email**: Resend
- **Monitoring**: Sentry (errors) + Vercel Analytics

### AI/LLM
- **Provider**: OpenAI API (o Anthropic Claude)
- **Vector DB**: Pinecone (free tier) o pgvector su Neon

## Costi stimati (MVP)
- Vercel Pro: $20/mo
- Neon: Free tier (poi $19/mo)
- Clerk: Free tier (poi $25/mo)
- Sentry: Free tier
- **Totale**: ~$0-65/mo per MVP

## Setup rapido
\`\`\`bash
npx create-next-app@latest my-saas --typescript --tailwind --app
cd my-saas
npx shadcn@latest init
npm install @clerk/nextjs prisma @prisma/client
npx prisma init
\`\`\`

## Considerazioni scaling
- Neon scala automaticamente
- Vercel Edge Functions per bassa latenza
- Considerare Railway/Render quando serve più controllo`,
      category: 'SaaS',
      tags: ['Next.js', 'Vercel', 'PostgreSQL', 'Startup', 'MVP'],
      uiTech: 'Next.js + Tailwind + shadcn/ui',
      backendTech: 'Next.js API Routes + Prisma',
      databaseTech: 'PostgreSQL (Neon)',
      releaseTech: 'Vercel',
    },
    {
      title: 'ML Platform Stack',
      description: 'Infrastruttura per training, serving e monitoring di modelli ML in produzione.',
      content: `## Overview
Stack enterprise-ready per ML/AI con focus su MLOps, reproducibility e governance.

## Componenti

### Development
- **Notebooks**: JupyterHub su Kubernetes
- **Experiment Tracking**: MLflow o Weights & Biases
- **Feature Store**: Feast (open source) o Tecton
- **Version Control**: DVC per dati + Git per codice

### Training
- **Orchestration**: Kubeflow Pipelines o Airflow
- **Compute**: Kubernetes + GPU nodes (spot instances)
- **Distributed Training**: Ray o Horovod
- **Hyperparameter Tuning**: Optuna

### Model Registry
- **Storage**: MLflow Model Registry
- **Artifacts**: S3/GCS con versioning
- **Metadata**: MLflow + custom tags

### Serving
- **Real-time**:
  - KServe (Kubernetes-native)
  - Triton Inference Server (NVIDIA)
  - BentoML (semplice deployment)
- **Batch**: Spark o Ray
- **Edge**: ONNX Runtime

### Monitoring
- **Model Performance**: Evidently AI o WhyLabs
- **Data Drift**: Great Expectations
- **Infrastructure**: Prometheus + Grafana
- **Alerting**: PagerDuty

## Architettura
\`\`\`
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Feature    │────▶│   Training   │────▶│    Model     │
│    Store     │     │   Pipeline   │     │   Registry   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                           ┌──────────────────────┴───────────┐
                           ▼                                  ▼
                    ┌──────────────┐                  ┌──────────────┐
                    │  Real-time   │                  │    Batch     │
                    │   Serving    │                  │   Serving    │
                    └──────────────┘                  └──────────────┘
                           │                                  │
                           └──────────────────────────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  Monitoring  │
                                   │  & Alerting  │
                                   └──────────────┘
\`\`\`

## Costi stimati (GCP)
- GKE cluster: $300-500/mo base
- GPU nodes: $2-10/hr per training
- Storage: ~$50-100/mo
- **Totale**: $500-2000/mo (variabile con training)

## Best Practices
1. Separare ambienti dev/staging/prod
2. Immutable model artifacts
3. A/B testing framework per rollout
4. Feature documentation obbligatoria`,
      category: 'ML/AI',
      tags: ['MLOps', 'Kubernetes', 'ML', 'AI', 'Production'],
      uiTech: 'JupyterHub + Grafana',
      backendTech: 'Kubeflow + MLflow + FastAPI',
      databaseTech: 'PostgreSQL + Feature Store',
      releaseTech: 'Kubernetes + KServe',
    },
  ]

  for (const stack of stacks) {
    await prisma.stackTemplate.upsert({
      where: { id: stack.title.toLowerCase().replace(/\s+/g, '-').slice(0, 25) },
      update: {},
      create: {
        id: stack.title.toLowerCase().replace(/\s+/g, '-').slice(0, 25),
        creatorId: testUser.id,
        title: stack.title,
        description: stack.description,
        content: stack.content,
        category: stack.category,
        tags: stack.tags,
        uiTech: stack.uiTech,
        backendTech: stack.backendTech,
        databaseTech: stack.databaseTech,
        releaseTech: stack.releaseTech,
        status: 'APPROVED',
      },
    })
  }
  console.log(`Seeded ${stacks.length} stack templates`)

  console.log('Hive Mind seeded with 10 examples!')
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
