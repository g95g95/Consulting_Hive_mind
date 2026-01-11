# Consulting Hive Mind - MCP Server

Server MCP (Model Context Protocol) per la piattaforma Consulting Hive Mind.
Espone 47 tool per gestire consulenze tramite interfacce AI (Claude, ChatGPT).

## Architettura

```
┌─────────────────────────────────────────────────────┐
│                  Dual Server Entry                   │
└────────────────────────┬────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐                ┌───────────────┐
│  MCP Server   │                │  REST Server  │
│  (stdio/SSE)  │                │  (HTTP/HTTPS) │
│               │                │               │
│ - Claude.ai   │                │ - GPT Actions │
│ - Claude Desk │                │ - Custom apps │
└───────┬───────┘                └───────┬───────┘
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Tool Executor     │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌───────────┐ ┌───────────────┐
│  AI Agents    │ │ Database  │ │    OAuth      │
│  (Gemini)     │ │ (Prisma)  │ │    (JWT)      │
└───────────────┘ └───────────┘ └───────────────┘
```

## Tool Disponibili (47)

### User & Profile (9)
| Tool | Descrizione |
|------|-------------|
| `user_authenticate` | OAuth token exchange |
| `user_get_profile` | Profilo completo utente |
| `user_update_profile` | Aggiorna dati base |
| `consultant_profile_create` | Crea profilo consulente |
| `consultant_profile_update` | Aggiorna profilo consulente |
| `client_profile_create` | Crea profilo cliente |
| `client_profile_update` | Aggiorna profilo cliente |
| `consultant_directory_search` | Cerca consulenti |
| `consultant_get_by_id` | Dettagli consulente |

### Request Management (6)
| Tool | Descrizione |
|------|-------------|
| `request_create` | Crea richiesta |
| `request_get` | Dettagli richiesta |
| `request_list` | Lista richieste |
| `request_update` | Modifica richiesta |
| `request_refine` | **AI** - Raffina descrizione |
| `request_cancel` | Cancella richiesta |

### Matching & Offers (5)
| Tool | Descrizione |
|------|-------------|
| `offer_create` | Consulente fa offerta |
| `offer_list` | Lista offerte |
| `offer_accept` | Cliente accetta offerta |
| `offer_decline` | Rifiuta offerta |
| `match_find_consultants` | **AI** - Trova match |

### Engagement Workspace (12)
| Tool | Descrizione |
|------|-------------|
| `engagement_get` | Dettagli engagement |
| `engagement_list` | Lista engagement |
| `engagement_update` | Modifica engagement |
| `engagement_complete` | Completa engagement |
| `message_send` | Invia messaggio |
| `message_list` | Lista messaggi |
| `note_create` | Crea nota |
| `note_list` | Lista note |
| `note_update` | Modifica nota |
| `checklist_add_item` | Aggiungi item checklist |
| `checklist_toggle_item` | Toggle completamento |
| `checklist_list` | Lista checklist |

### Knowledge Transfer (4)
| Tool | Descrizione |
|------|-------------|
| `transfer_pack_generate` | **AI** - Genera pack |
| `transfer_pack_get` | Leggi transfer pack |
| `transfer_pack_update` | Modifica manuale |
| `transfer_pack_finalize` | Finalizza e chiudi |

### Hive Library (6)
| Tool | Descrizione |
|------|-------------|
| `hive_search` | Cerca libreria |
| `hive_pattern_get` | Dettagli pattern |
| `hive_prompt_get` | Dettagli prompt |
| `hive_stack_get` | Dettagli stack |
| `hive_contribute` | **AI** - Contribuisci (con redazione PII) |
| `hive_refine_contribution` | **AI** - Raffina contributo |

### Reviews (2)
| Tool | Descrizione |
|------|-------------|
| `review_create` | Crea review |
| `review_list` | Lista review |

### Admin (3)
| Tool | Descrizione |
|------|-------------|
| `admin_moderation_queue` | Coda moderazione |
| `admin_approve_contribution` | Approva |
| `admin_reject_contribution` | Rifiuta |

## Struttura Progetto

```
consulting-hive-mcp/
├── src/
│   ├── server/
│   │   ├── mcp/              # Server MCP (stdio)
│   │   ├── rest/             # Server REST (Hono)
│   │   └── dual-server.ts    # Entry point
│   ├── tools/
│   │   ├── registry.ts       # Definizioni 47 tool
│   │   ├── handlers/         # 8 domain handlers
│   │   └── executor.ts       # Esecuzione unificata
│   ├── agents/               # 5 AI Agents (Gemini)
│   │   ├── intake.ts         # Refine requests
│   │   ├── matcher.ts        # Find consultants
│   │   ├── transfer.ts       # Generate transfer packs
│   │   ├── redaction.ts      # PII/secret detection
│   │   └── hive-contribution.ts
│   ├── providers/
│   │   └── gemini.ts         # Gemini API wrapper
│   ├── auth/                 # OAuth + JWT
│   ├── db/                   # Prisma client
│   └── types/
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── generate-openapi.ts
├── package.json
└── README.md
```

## Relazione con App Esistente

Questo server MCP è un progetto **separato** dall'app Next.js esistente.
Condividono lo **stesso database PostgreSQL** (Supabase).

```
Guloi/
├── Consulting_Hive_mind/   ← App Next.js (frontend + API)
└── consulting-hive-mcp/    ← Server MCP (questo progetto)
         │
         └── Stesso database Supabase
```

## Setup

```bash
# Installa dipendenze
npm install

# Configura environment
cp .env.example .env
# Edita .env con le tue credenziali

# Genera Prisma client
npx prisma generate

# Avvia server (REST + MCP ready)
npm run dev
```

## Environment Variables

```env
# Database (stesso di Consulting_Hive_mind)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# AI Provider
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
REST_PORT=3101
```

## Utilizzo

### Con Claude Desktop

Aggiungi a `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "consulting-hive": {
      "command": "node",
      "args": ["/path/to/consulting-hive-mcp/dist/server/mcp/index.js"]
    }
  }
}
```

### Con GPT Actions

1. Build the project: `npm run build`
2. Import `openapi.json` in your Custom GPT
3. Configure authentication with your REST endpoint

### REST API

```bash
# List tools
curl http://localhost:3101/tools

# Execute tool (with auth)
curl -X POST http://localhost:3101/tools/request_list \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Development

```bash
# Run in dev mode (watch)
npm run dev

# Build for production
npm run build

# Start production
npm start

# MCP server only
npm run start:mcp

# REST server only
npm run start:rest
```

## Licenza

Proprietario - Tutti i diritti riservati
