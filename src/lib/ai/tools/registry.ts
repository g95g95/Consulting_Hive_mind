/**
 * Tool Registry - Central repository for all AI agent tools
 *
 * Tools are functions that AI agents can call during their reasoning process.
 * Each tool has a schema that describes its parameters for function calling.
 */

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: { type: string };
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// TOOL DEFINITIONS
// ============================================

export const TOOLS: Record<string, Tool> = {
  // Intake Tools
  refine_request: {
    name: "refine_request",
    description: "Transform a messy problem description into a structured consultation scope",
    parameters: {
      rawDescription: {
        type: "string",
        description: "The raw, unstructured problem description from the client",
      },
    },
    required: ["rawDescription"],
  },

  classify_domain: {
    name: "classify_domain",
    description: "Classify a request into domain categories and suggest relevant skill tags",
    parameters: {
      summary: {
        type: "string",
        description: "The refined summary of the consultation request",
      },
    },
    required: ["summary"],
  },

  detect_sensitive_data: {
    name: "detect_sensitive_data",
    description: "Detect if a request contains potentially sensitive data (PII, credentials, etc.)",
    parameters: {
      content: {
        type: "string",
        description: "The content to analyze for sensitive data",
      },
    },
    required: ["content"],
  },

  // Matching Tools
  search_consultants: {
    name: "search_consultants",
    description: "Search for consultants matching specific criteria",
    parameters: {
      skills: {
        type: "array",
        description: "Array of skill tags to match",
        items: { type: "string" },
      },
      minRating: {
        type: "number",
        description: "Minimum rating threshold (0-5)",
      },
      maxRate: {
        type: "number",
        description: "Maximum hourly rate in USD",
      },
      availability: {
        type: "string",
        description: "Required availability window",
        enum: ["immediate", "this_week", "this_month", "flexible"],
      },
    },
    required: ["skills"],
  },

  calculate_match_score: {
    name: "calculate_match_score",
    description: "Calculate a match score between a request and a consultant",
    parameters: {
      requestId: {
        type: "string",
        description: "The ID of the consultation request",
      },
      consultantId: {
        type: "string",
        description: "The ID of the consultant profile",
      },
    },
    required: ["requestId", "consultantId"],
  },

  generate_match_explanation: {
    name: "generate_match_explanation",
    description: "Generate a human-readable explanation for why a consultant matches a request",
    parameters: {
      matchScore: {
        type: "number",
        description: "The calculated match score (0-100)",
      },
      requestSummary: {
        type: "string",
        description: "Summary of the client request",
      },
      consultantSkills: {
        type: "array",
        description: "List of consultant skills",
        items: { type: "string" },
      },
    },
    required: ["matchScore", "requestSummary", "consultantSkills"],
  },

  // Knowledge Transfer Tools
  summarize_engagement: {
    name: "summarize_engagement",
    description: "Generate an executive summary of an engagement",
    parameters: {
      engagementId: {
        type: "string",
        description: "The ID of the engagement to summarize",
      },
    },
    required: ["engagementId"],
  },

  extract_decisions: {
    name: "extract_decisions",
    description: "Extract key decisions made during an engagement",
    parameters: {
      notes: {
        type: "array",
        description: "Array of note contents from the engagement",
        items: { type: "string" },
      },
      messages: {
        type: "array",
        description: "Array of message contents from the engagement",
        items: { type: "string" },
      },
    },
    required: ["notes", "messages"],
  },

  generate_runbook: {
    name: "generate_runbook",
    description: "Generate a step-by-step runbook from engagement outcomes",
    parameters: {
      decisions: {
        type: "string",
        description: "Key decisions extracted from the engagement",
      },
      desiredOutcome: {
        type: "string",
        description: "The original desired outcome from the request",
      },
    },
    required: ["decisions", "desiredOutcome"],
  },

  // Redaction Tools
  redact_pii: {
    name: "redact_pii",
    description: "Detect and redact personally identifiable information from content",
    parameters: {
      content: {
        type: "string",
        description: "The content to redact PII from",
      },
    },
    required: ["content"],
  },

  redact_secrets: {
    name: "redact_secrets",
    description: "Detect and redact secrets (API keys, passwords, tokens) from content",
    parameters: {
      content: {
        type: "string",
        description: "The content to redact secrets from",
      },
    },
    required: ["content"],
  },

  anonymize_content: {
    name: "anonymize_content",
    description: "Fully anonymize content for public sharing in the hive library",
    parameters: {
      content: {
        type: "string",
        description: "The content to anonymize",
      },
      contentType: {
        type: "string",
        description: "The type of content being anonymized",
        enum: ["pattern", "prompt", "stack_template"],
      },
    },
    required: ["content", "contentType"],
  },

  // Hive Library Tools
  search_patterns: {
    name: "search_patterns",
    description: "Search the hive pattern library for relevant patterns",
    parameters: {
      query: {
        type: "string",
        description: "Search query for patterns",
      },
      domain: {
        type: "string",
        description: "Optional domain filter",
      },
    },
    required: ["query"],
  },

  search_prompts: {
    name: "search_prompts",
    description: "Search the hive prompt library for relevant prompts",
    parameters: {
      query: {
        type: "string",
        description: "Search query for prompts",
      },
      category: {
        type: "string",
        description: "Optional category filter",
      },
    },
    required: ["query"],
  },
};

// ============================================
// TOOL GROUPS BY AGENT TYPE
// ============================================

export const AGENT_TOOLS = {
  intake: [
    TOOLS.refine_request,
    TOOLS.classify_domain,
    TOOLS.detect_sensitive_data,
  ],

  matcher: [
    TOOLS.search_consultants,
    TOOLS.calculate_match_score,
    TOOLS.generate_match_explanation,
  ],

  transfer: [
    TOOLS.summarize_engagement,
    TOOLS.extract_decisions,
    TOOLS.generate_runbook,
  ],

  redaction: [
    TOOLS.redact_pii,
    TOOLS.redact_secrets,
    TOOLS.anonymize_content,
  ],

  hive: [
    TOOLS.search_patterns,
    TOOLS.search_prompts,
  ],
};

/**
 * Get tools for a specific agent type
 */
export function getToolsForAgent(agentType: keyof typeof AGENT_TOOLS): Tool[] {
  return AGENT_TOOLS[agentType] || [];
}

/**
 * Get all available tools
 */
export function getAllTools(): Tool[] {
  return Object.values(TOOLS);
}
