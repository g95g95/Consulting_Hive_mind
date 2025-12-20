# AI Architecture Documentation

## Overview

The Consulting Hive Mind platform uses a **multi-agent orchestrated architecture** powered by Google Gemini API. This document explains the design, components, and usage patterns.

## Architecture Pattern: ReAct + Tool-Use Orchestrator

We use a hybrid pattern combining:
- **ReAct** (Reasoning + Acting): Agents reason about tasks before taking action
- **Tool-Use**: Agents can call predefined tools during execution
- **Orchestration**: A central orchestrator routes requests to specialized agents

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER REQUEST                                     │
│                    "Ho bisogno di un esperto ML per..."                      │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY                                       │
│                         /api/ai/orchestrate                                   │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ╔═══════════════════════════════════════════════════════════════════════╗  │
│   ║                      ORCHESTRATOR ENGINE                              ║  │
│   ║                                                                       ║  │
│   ║   1. PARSE REQUEST                                                    ║  │
│   ║      └─► Determina intent (intake/match/transfer/redact)              ║  │
│   ║                                                                       ║  │
│   ║   2. SELECT AGENT(S)                                                  ║  │
│   ║      └─► Routing basato su intent                                     ║  │
│   ║                                                                       ║  │
│   ║   3. EXECUTE WORKFLOW                                                 ║  │
│   ║      └─► Sequenziale o Parallelo                                      ║  │
│   ║                                                                       ║  │
│   ║   4. AGGREGATE RESULTS                                                ║  │
│   ║      └─► Combina output degli agenti                                  ║  │
│   ║                                                                       ║  │
│   ║   5. RETURN RESPONSE                                                  ║  │
│   ║      └─► JSON strutturato                                             ║  │
│   ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                               │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  INTAKE   │   │  MATCHER  │   │ TRANSFER  │
            │   AGENT   │   │   AGENT   │   │   AGENT   │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  ▼               ▼               ▼
            ┌─────────────────────────────────────────┐
            │            TOOL REGISTRY                │
            └─────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────────┐
            │           GEMINI AI PROVIDER            │
            └─────────────────────────────────────────┘
```

## Components

### 1. Orchestrator (`src/lib/ai/orchestrator.ts`)

The central brain that:
- Detects user intent from request context
- Routes to appropriate agent(s)
- Manages execution workflow
- Aggregates and returns results

**Supported Intents:**
| Intent | Agent | Description |
|--------|-------|-------------|
| `refine_request` | IntakeAgent | Transform messy descriptions into structured scopes |
| `match_consultants` | MatcherAgent | Find and score consultant matches |
| `generate_transfer_pack` | TransferAgent | Create knowledge transfer documents |
| `redact_content` | RedactionAgent | Detect and remove PII/secrets |
| `search_hive` | HiveAgent (TODO) | Search patterns/prompts library |

### 2. Specialized Agents

#### IntakeAgent (`src/lib/ai/agents/intake.ts`)

**Purpose:** Transform messy, unstructured problem descriptions into clear, actionable consultation scopes.

**Capabilities:**
- Extract core problems and constraints
- Identify relevant skill tags
- Suggest consultation duration (30/60/90 min)
- Detect sensitive data warnings
- Generate clarifying questions

**Output Schema:**
```typescript
interface IntakeResult {
  summary: string;              // Clear 2-3 sentence summary
  constraints: string;          // Technical/budget/time constraints
  desiredOutcome: string;       // What success looks like
  suggestedDuration: 30 | 60 | 90;
  suggestedSkills: string[];    // Skill tags from taxonomy
  sensitiveDataWarning: boolean;
  clarifyingQuestions?: string[];
  confidence: "high" | "medium" | "low";
}
```

#### MatcherAgent (`src/lib/ai/agents/matcher.ts`)

**Purpose:** Find the best consultant matches for client requests and explain WHY.

**Capabilities:**
- Search consultants by skills, rating, rate
- Calculate match scores (0-100)
- Generate human-readable explanations
- Highlight skill overlaps

**Scoring Criteria:**
- Skill Overlap: 50% weight
- Experience Level: 20% weight
- Rating & Reviews: 15% weight
- Availability & Rate: 15% weight

**Output Schema:**
```typescript
interface MatchingResult {
  matches: Array<{
    consultantId: string;
    consultantName: string;
    score: number;           // 0-100
    reason: string;          // 2-3 sentence explanation
    skillOverlap: string[];
    highlights: string[];
  }>;
  searchCriteria: { skills: string[]; budget?: number };
  recommendations: string;
  totalCandidates: number;
}
```

#### TransferAgent (`src/lib/ai/agents/transfer.ts`)

**Purpose:** Generate knowledge transfer documents that enable client autonomy.

**Philosophy:** The platform is SCAFFOLDING, not a toll bridge. Transfer Packs should make clients independent.

**Output Schema:**
```typescript
interface TransferPackResult {
  summary: string;                    // Executive summary
  keyDecisions: string;               // Bullet points of decisions
  runbook: string;                    // Step-by-step instructions
  nextSteps: string;                  // Prioritized next actions
  internalizationChecklist: string;   // "I can now..." statements
  confidence: "high" | "medium" | "low";
}
```

#### RedactionAgent (`src/lib/ai/agents/redaction.ts`)

**Purpose:** Detect and redact sensitive information before public sharing.

**Security Principle:** "When in doubt, REDACT." False positives are better than data leaks.

**Detection Layers:**
1. **Regex Pass (Fast):** Deterministic pattern matching for emails, phones, API keys, etc.
2. **AI Pass (Semantic):** Context-aware detection for names, companies, internal info

**Redaction Tokens:**
| Type | Token |
|------|-------|
| Names | `[NAME]` |
| Companies | `[COMPANY]` |
| Emails | `[EMAIL]` |
| Phones | `[PHONE]` |
| Addresses | `[ADDRESS]` |
| API Keys | `[REDACTED_API_KEY]` |
| Passwords | `[REDACTED_PASSWORD]` |
| Tokens | `[REDACTED_TOKEN]` |
| Financial | `[FINANCIAL]` |
| Health | `[HEALTH_INFO]` |

**Output Schema:**
```typescript
interface RedactionResult {
  redactedText: string;
  detectedPII: string[];
  detectedSecrets: string[];
  confidence: "high" | "medium" | "low";
  requiresManualReview: boolean;
  changes: Array<{
    type: string;
    original: string;
    replacement: string;
  }>;
}
```

### 3. Tool Registry (`src/lib/ai/tools/`)

Tools are functions that agents can call during reasoning.

**Registry (`registry.ts`):**
```typescript
// Intake Tools
- refine_request
- classify_domain
- detect_sensitive_data

// Matching Tools
- search_consultants
- calculate_match_score
- generate_match_explanation

// Transfer Tools
- summarize_engagement
- extract_decisions
- generate_runbook

// Redaction Tools
- redact_pii
- redact_secrets
- anonymize_content

// Hive Tools
- search_patterns
- search_prompts
```

**Handlers (`handlers.ts`):**
Each tool has a handler that executes the actual logic, often interacting with the database.

### 4. Gemini Provider (`src/lib/ai/providers/gemini.ts`)

Abstraction layer for Google Gemini API with:
- Function calling support
- Tool execution loop
- JSON response parsing
- Error handling

## API Usage

### Central Orchestration Endpoint

```typescript
POST /api/ai/orchestrate
Content-Type: application/json

{
  "intent": "refine_request",  // Optional, auto-detected if omitted
  "context": {
    "rawDescription": "I need help with my ML pipeline..."
  }
}

// Response
{
  "success": true,
  "intent": "refine_request",
  "agentUsed": "intake",
  "result": { ... },
  "toolsUsed": ["classify_domain"],
  "executionTimeMs": 1234
}
```

### Direct Agent Usage

```typescript
// In your code
import { getIntakeAgent } from "@/lib/ai/agents";

const agent = getIntakeAgent();
const result = await agent.refine("I need help with my ML pipeline...");
```

## Configuration

### Environment Variables

```env
# Required
GEMINI_API_KEY=AIza...

# Optional
GEMINI_MODEL=gemini-1.5-pro  # Default: gemini-1.5-pro
                              # Options: gemini-1.5-pro, gemini-1.5-flash

# Legacy (still supported)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=gemini  # 'gemini', 'anthropic', or 'openai'
```

## Why NOT MCP (Model Context Protocol)?

MCP is designed for Claude Desktop/CLI to call external tools. Our use case is different:

| MCP | Our Architecture |
|-----|-----------------|
| Claude Desktop calls YOUR server | YOUR server calls Gemini API |
| Tools exposed to external clients | Tools internal to your app |
| Plugin/extension pattern | Web app pattern |

**When you WOULD use MCP:**
- Building a Claude Desktop plugin
- Exposing your tools to Claude CLI users
- IDE integrations

**Our approach:** Direct API calls with internal tool registry is simpler and more appropriate for a web application.

## Future Enhancements

1. **Streaming Responses:** Real-time transfer pack generation
2. **Cost Tracking:** Token counting and per-engagement AI spend
3. **Caching:** Response caching for repeated queries
4. **Multi-Agent Workflows:** Parallel agent execution
5. **Agent Memory:** Context persistence across sessions

## File Structure

```
src/lib/ai/
├── orchestrator.ts           # Central orchestration engine
├── provider.ts               # Legacy multi-provider (backward compat)
├── providers/
│   └── gemini.ts             # Gemini-specific implementation
├── agents/
│   ├── index.ts              # Agent exports
│   ├── intake.ts             # IntakeAgent
│   ├── matcher.ts            # MatcherAgent
│   ├── transfer.ts           # TransferAgent
│   └── redaction.ts          # RedactionAgent
└── tools/
    ├── registry.ts           # Tool definitions
    └── handlers.ts           # Tool implementations
```
