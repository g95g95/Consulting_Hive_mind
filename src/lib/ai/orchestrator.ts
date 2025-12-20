/**
 * AI Orchestrator - Central coordination engine for all AI agents
 *
 * The Orchestrator is responsible for:
 * 1. Parsing incoming requests and determining intent
 * 2. Selecting the appropriate agent(s) for the task
 * 3. Managing the execution workflow (sequential or parallel)
 * 4. Aggregating results from multiple agents
 * 5. Returning structured responses
 *
 * Pattern: ReAct (Reasoning + Acting) with Tool-Use
 */

import { generateGeminiCompletion, parseJsonFromGeminiResponse } from "./providers/gemini";
import { getToolsForAgent, type Tool } from "./tools/registry";
import { TOOL_HANDLERS } from "./tools/handlers";

// ============================================
// TYPES
// ============================================

export type AgentType = "intake" | "matcher" | "transfer" | "redaction" | "hive";

export type OrchestratorIntent =
  | "refine_request"
  | "match_consultants"
  | "generate_transfer_pack"
  | "redact_content"
  | "search_hive"
  | "unknown";

export interface OrchestratorRequest {
  intent: OrchestratorIntent;
  context: Record<string, unknown>;
  userId?: string;
}

export interface OrchestratorResponse {
  success: boolean;
  intent: OrchestratorIntent;
  agentUsed: AgentType | AgentType[];
  result: unknown;
  toolsUsed?: string[];
  executionTimeMs: number;
  error?: string;
}

export interface AgentConfig {
  type: AgentType;
  systemPrompt: string;
  tools: Tool[];
  outputSchema?: Record<string, unknown>;
}

// ============================================
// AGENT CONFIGURATIONS
// ============================================

const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  intake: {
    type: "intake",
    systemPrompt: `You are an expert consultant intake specialist for a consulting platform.
Your job is to transform messy, unstructured problem descriptions into clear, structured consultation scopes.

When processing a request:
1. Extract the core problem or need
2. Identify constraints (technical, budget, timeline)
3. Define what success looks like
4. Suggest appropriate consultation duration (30, 60, or 90 minutes)
5. Identify relevant skill tags from the platform's taxonomy
6. Flag any potentially sensitive data (PII, credentials, health/financial data)

Always output structured JSON with these fields:
- summary: Clear 2-3 sentence summary
- constraints: Technical/budget/time constraints
- desiredOutcome: What success looks like
- suggestedDuration: 30, 60, or 90 minutes
- suggestedSkills: Array of skill tags
- sensitiveDataWarning: Boolean flag
- clarifyingQuestions: Optional array of questions to ask the client`,
    tools: getToolsForAgent("intake"),
  },

  matcher: {
    type: "matcher",
    systemPrompt: `You are an expert matching specialist for a consulting platform.
Your job is to find the best consultant matches for client requests and explain WHY each consultant is a good fit.

When matching:
1. Analyze the request requirements and desired skills
2. Search for consultants with relevant expertise
3. Calculate match scores based on skill overlap, experience, and availability
4. Generate human-readable explanations for each match

Focus on quality over quantity - it's better to return 3 excellent matches than 10 mediocre ones.

Always output structured JSON with:
- matches: Array of { consultantId, score, reason }
- searchCriteria: What criteria were used
- recommendations: Any suggestions for the client`,
    tools: getToolsForAgent("matcher"),
  },

  transfer: {
    type: "transfer",
    systemPrompt: `You are a knowledge transfer specialist for a consulting platform.
Your job is to create Transfer Packs - comprehensive knowledge transfer documents that help clients become autonomous.

The goal is SCAFFOLDING, not dependency. Every Transfer Pack should:
1. Summarize what was learned and decided
2. Provide actionable runbooks the client can follow
3. Include an internalization checklist so the client knows they've "graduated"

Output structured JSON with:
- summary: Executive summary (3-5 sentences)
- keyDecisions: Bullet points of decisions made
- runbook: Step-by-step instructions
- nextSteps: Recommended next actions
- internalizationChecklist: What the client should now be able to do themselves`,
    tools: getToolsForAgent("transfer"),
  },

  redaction: {
    type: "redaction",
    systemPrompt: `You are a privacy and security specialist for a consulting platform.
Your job is to detect and redact sensitive information before content is shared publicly in the hive library.

MANDATORY redactions:
- Personal names → [NAME]
- Company names → [COMPANY]
- Email addresses → [EMAIL]
- Phone numbers → [PHONE]
- Physical addresses → [ADDRESS]
- API keys, passwords, tokens → [REDACTED_SECRET]
- Financial data (account numbers, etc.) → [FINANCIAL]
- Health information → [HEALTH_INFO]

Be conservative - when in doubt, redact. False positives are better than leaking sensitive data.

Output structured JSON with:
- redactedText: The sanitized content
- detectedPII: Array of PII types found
- detectedSecrets: Array of secret types found
- confidence: High/Medium/Low confidence in the redaction
- requiresManualReview: Boolean - true if human review is recommended`,
    tools: getToolsForAgent("redaction"),
  },

  hive: {
    type: "hive",
    systemPrompt: `You are a knowledge curator for the consulting platform's Hive Library.
Your job is to help users find relevant patterns, prompts, and stack templates from the collective knowledge base.

When searching:
1. Understand the user's query intent
2. Search across patterns, prompts, and templates
3. Rank results by relevance
4. Provide context about why each result is relevant

Output structured JSON with:
- results: Array of { type, id, title, relevance, preview }
- suggestions: Related searches the user might find useful`,
    tools: getToolsForAgent("hive"),
  },
};

// ============================================
// INTENT DETECTION
// ============================================

const INTENT_MAP: Record<OrchestratorIntent, AgentType> = {
  refine_request: "intake",
  match_consultants: "matcher",
  generate_transfer_pack: "transfer",
  redact_content: "redaction",
  search_hive: "hive",
  unknown: "intake", // Default to intake
};

export function detectIntent(context: Record<string, unknown>): OrchestratorIntent {
  // If explicit intent is provided, use it
  if (context.explicitIntent) {
    return context.explicitIntent as OrchestratorIntent;
  }

  // Otherwise, infer from context
  if (context.rawDescription || context.description) {
    return "refine_request";
  }
  if (context.requestId && context.findConsultants) {
    return "match_consultants";
  }
  if (context.engagementId && context.generateTransferPack) {
    return "generate_transfer_pack";
  }
  if (context.contentToRedact || context.contribution) {
    return "redact_content";
  }
  if (context.searchQuery && context.searchHive) {
    return "search_hive";
  }

  return "unknown";
}

// ============================================
// ORCHESTRATOR CLASS
// ============================================

export class Orchestrator {
  private model: string;

  constructor(model: string = "gemini-1.5-pro") {
    this.model = model;
  }

  /**
   * Main entry point - process a request through the appropriate agent(s)
   */
  async process(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];

    try {
      // 1. Determine which agent to use
      const agentType = INTENT_MAP[request.intent];
      const agentConfig = AGENT_CONFIGS[agentType];

      // 2. Build the user message from context
      const userMessage = this.buildUserMessage(request.intent, request.context);

      // 3. Execute the agent with tools
      const response = await generateGeminiCompletion({
        model: this.model,
        systemPrompt: agentConfig.systemPrompt,
        userMessage,
        tools: agentConfig.tools,
        toolHandlers: TOOL_HANDLERS,
        temperature: this.getTemperatureForIntent(request.intent),
        maxTokens: this.getMaxTokensForIntent(request.intent),
      });

      // Track tools used
      if (response.toolCalls) {
        toolsUsed.push(...response.toolCalls.map((tc) => tc.name));
      }

      // 4. Parse the response
      const result = this.parseAgentResponse(request.intent, response.text);

      return {
        success: true,
        intent: request.intent,
        agentUsed: agentType,
        result,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        intent: request.intent,
        agentUsed: INTENT_MAP[request.intent],
        result: null,
        executionTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build user message from context based on intent
   */
  private buildUserMessage(intent: OrchestratorIntent, context: Record<string, unknown>): string {
    switch (intent) {
      case "refine_request":
        return `Please refine this consultation request:\n\n${
          context.rawDescription || context.description
        }`;

      case "match_consultants":
        return `Find the best consultant matches for this request:

Request ID: ${context.requestId}
Title: ${context.title || "N/A"}
Summary: ${context.summary || "N/A"}
Required Skills: ${JSON.stringify(context.skills || [])}
Desired Outcome: ${context.desiredOutcome || "N/A"}
Budget: ${context.budget || "Not specified"}`;

      case "generate_transfer_pack":
        return `Generate a Transfer Pack for this engagement:

Engagement ID: ${context.engagementId}
Request Title: ${context.requestTitle || "Direct consultation"}
Summary: ${context.requestSummary || "N/A"}
Desired Outcome: ${context.desiredOutcome || "N/A"}
Agenda: ${context.agenda || "No agenda set"}

Notes:
${context.notes || "No notes"}

Recent Messages:
${context.messages || "No messages"}`;

      case "redact_content":
        return `Please redact sensitive information from this content:

Content Type: ${context.contentType || "unknown"}

---
${context.contentToRedact || context.content || context.contribution}
---

Ensure all PII, secrets, and sensitive data are properly redacted.`;

      case "search_hive":
        return `Search the hive library for: ${context.searchQuery}

${context.filters ? `Filters: ${JSON.stringify(context.filters)}` : ""}`;

      default:
        return JSON.stringify(context);
    }
  }

  /**
   * Parse agent response based on intent
   */
  private parseAgentResponse(intent: OrchestratorIntent, text: string): unknown {
    const defaultResponses: Record<OrchestratorIntent, unknown> = {
      refine_request: {
        summary: "",
        constraints: "",
        desiredOutcome: "",
        suggestedDuration: 60,
        suggestedSkills: [],
        sensitiveDataWarning: false,
      },
      match_consultants: {
        matches: [],
        searchCriteria: {},
        recommendations: "",
      },
      generate_transfer_pack: {
        summary: "",
        keyDecisions: "",
        runbook: "",
        nextSteps: "",
        internalizationChecklist: "",
      },
      redact_content: {
        redactedText: "",
        detectedPII: [],
        detectedSecrets: [],
        confidence: "low",
        requiresManualReview: true,
      },
      search_hive: {
        results: [],
        suggestions: [],
      },
      unknown: {},
    };

    return parseJsonFromGeminiResponse(text, defaultResponses[intent]);
  }

  /**
   * Get appropriate temperature for intent
   */
  private getTemperatureForIntent(intent: OrchestratorIntent): number {
    const temperatures: Record<OrchestratorIntent, number> = {
      refine_request: 0.5, // More structured
      match_consultants: 0.5, // More analytical
      generate_transfer_pack: 0.6, // Slightly creative
      redact_content: 0.3, // Very conservative
      search_hive: 0.4, // Balanced
      unknown: 0.7,
    };
    return temperatures[intent];
  }

  /**
   * Get appropriate max tokens for intent
   */
  private getMaxTokensForIntent(intent: OrchestratorIntent): number {
    const tokens: Record<OrchestratorIntent, number> = {
      refine_request: 1500,
      match_consultants: 2000,
      generate_transfer_pack: 3000,
      redact_content: 2000,
      search_hive: 1500,
      unknown: 1500,
    };
    return tokens[intent];
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

// Singleton instance
let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    orchestratorInstance = new Orchestrator(model);
  }
  return orchestratorInstance;
}

/**
 * Quick access functions for common operations
 */
export async function refineRequest(rawDescription: string): Promise<OrchestratorResponse> {
  return getOrchestrator().process({
    intent: "refine_request",
    context: { rawDescription },
  });
}

export async function matchConsultants(
  requestId: string,
  requestDetails: Record<string, unknown>
): Promise<OrchestratorResponse> {
  return getOrchestrator().process({
    intent: "match_consultants",
    context: { requestId, findConsultants: true, ...requestDetails },
  });
}

export async function generateTransferPack(
  engagementId: string,
  engagementDetails: Record<string, unknown>
): Promise<OrchestratorResponse> {
  return getOrchestrator().process({
    intent: "generate_transfer_pack",
    context: { engagementId, generateTransferPack: true, ...engagementDetails },
  });
}

export async function redactContent(
  content: string,
  contentType?: string
): Promise<OrchestratorResponse> {
  return getOrchestrator().process({
    intent: "redact_content",
    context: { contentToRedact: content, contentType },
  });
}

export async function searchHive(
  query: string,
  filters?: Record<string, unknown>
): Promise<OrchestratorResponse> {
  return getOrchestrator().process({
    intent: "search_hive",
    context: { searchQuery: query, searchHive: true, filters },
  });
}
