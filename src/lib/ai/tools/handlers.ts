/**
 * Tool Handlers - Implementation of AI tool functions
 *
 * Each handler executes the actual logic when an AI agent calls a tool.
 * Handlers interact with the database and other services.
 */

import { db } from "@/lib/db";
import type { ToolResult } from "./registry";

// ============================================
// INTAKE TOOL HANDLERS
// ============================================

export async function handleRefineRequest(args: {
  rawDescription: string;
}): Promise<ToolResult> {
  // This is handled by the AI itself through prompt engineering
  // The handler just validates and returns success
  return {
    success: true,
    data: {
      message: "Request refinement should be performed by the AI with proper prompting",
      rawDescription: args.rawDescription,
    },
  };
}

export async function handleClassifyDomain(args: {
  summary: string;
}): Promise<ToolResult> {
  // Fetch available skill tags from database
  try {
    const skills = await db.skillTag.findMany({
      select: { id: true, name: true, category: true },
    });

    return {
      success: true,
      data: {
        availableSkills: skills,
        summary: args.summary,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch skills: ${error}`,
    };
  }
}

export async function handleDetectSensitiveData(args: {
  content: string;
}): Promise<ToolResult> {
  // Simple pattern-based detection as a first pass
  const patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    apiKey: /(sk-|pk-|api[_-]?key)[a-zA-Z0-9]{20,}/gi,
    awsKey: /AKIA[0-9A-Z]{16}/g,
  };

  const detections: string[] = [];
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(args.content)) {
      detections.push(type);
    }
  }

  return {
    success: true,
    data: {
      hasSensitiveData: detections.length > 0,
      detectedTypes: detections,
      recommendation: detections.length > 0
        ? "Content contains potentially sensitive data. Proceed with caution."
        : "No obvious sensitive data patterns detected.",
    },
  };
}

// ============================================
// MATCHING TOOL HANDLERS
// ============================================

export async function handleSearchConsultants(args: {
  skills: string[];
  minRating?: number;
  maxRate?: number;
  availability?: string;
}): Promise<ToolResult> {
  try {
    const consultants = await db.consultantProfile.findMany({
      where: {
        AND: [
          args.skills.length > 0
            ? {
                skills: {
                  some: {
                    skillTag: {
                      name: { in: args.skills },
                    },
                  },
                },
              }
            : {},
          args.maxRate ? { hourlyRate: { lte: args.maxRate } } : {},
        ],
      },
      include: {
        user: true,
        skills: { include: { skillTag: true } },
      },
      take: 20,
    });

    return {
      success: true,
      data: {
        consultants: consultants.map((c) => ({
          id: c.id,
          name: c.user?.firstName || "Unknown",
          headline: c.headline,
          hourlyRate: c.hourlyRate,
          skills: c.skills?.map((s) => s.skillTag?.name).filter(Boolean) || [],
        })),
        total: consultants.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search consultants: ${error}`,
    };
  }
}

export async function handleCalculateMatchScore(args: {
  requestId: string;
  consultantId: string;
}): Promise<ToolResult> {
  try {
    const [request, consultant] = await Promise.all([
      db.request.findUnique({
        where: { id: args.requestId },
        include: { skills: { include: { skillTag: true } } },
      }),
      db.consultantProfile.findUnique({
        where: { id: args.consultantId },
        include: { skills: { include: { skillTag: true } } },
      }),
    ]);

    if (!request || !consultant) {
      return {
        success: false,
        error: "Request or consultant not found",
      };
    }

    // Calculate skill overlap
    const requestSkills = new Set(request.skills.map((s: { skillTag: { name: string } }) => s.skillTag.name));
    const consultantSkills = new Set(consultant.skills.map((s: { skillTag: { name: string } }) => s.skillTag.name));

    const overlap = [...requestSkills].filter((s) => consultantSkills.has(s));
    const skillScore = requestSkills.size > 0
      ? (overlap.length / requestSkills.size) * 100
      : 50;

    // Combined score (simplified without rating field)
    const matchScore = Math.round(skillScore);

    return {
      success: true,
      data: {
        matchScore,
        skillOverlap: overlap,
        requestSkills: [...requestSkills],
        consultantSkills: [...consultantSkills],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to calculate match score: ${error}`,
    };
  }
}

export async function handleGenerateMatchExplanation(args: {
  matchScore: number;
  requestSummary: string;
  consultantSkills: string[];
}): Promise<ToolResult> {
  // This is handled by the AI itself
  return {
    success: true,
    data: {
      matchScore: args.matchScore,
      requestSummary: args.requestSummary,
      consultantSkills: args.consultantSkills,
    },
  };
}

// ============================================
// TRANSFER TOOL HANDLERS
// ============================================

export async function handleSummarizeEngagement(args: {
  engagementId: string;
}): Promise<ToolResult> {
  try {
    const engagement = await db.engagement.findUnique({
      where: { id: args.engagementId },
      include: {
        booking: {
          include: {
            request: true,
          },
        },
        notes: true,
        messages: { take: 50, orderBy: { createdAt: "desc" } },
      },
    });

    if (!engagement) {
      return {
        success: false,
        error: "Engagement not found",
      };
    }

    return {
      success: true,
      data: {
        engagement: {
          agenda: engagement.agenda,
          request: engagement.booking?.request || null,
          notes: engagement.notes.map((n) => ({
            title: n.title,
            content: n.content,
          })),
          messageCount: engagement.messages.length,
          recentMessages: engagement.messages.slice(0, 10).map((m) => m.content),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch engagement: ${error}`,
    };
  }
}

export async function handleExtractDecisions(args: {
  notes: string[];
  messages: string[];
}): Promise<ToolResult> {
  // This is handled by the AI itself through prompt engineering
  return {
    success: true,
    data: {
      notes: args.notes,
      messages: args.messages,
    },
  };
}

export async function handleGenerateRunbook(args: {
  decisions: string;
  desiredOutcome: string;
}): Promise<ToolResult> {
  // This is handled by the AI itself
  return {
    success: true,
    data: {
      decisions: args.decisions,
      desiredOutcome: args.desiredOutcome,
    },
  };
}

// ============================================
// REDACTION TOOL HANDLERS
// ============================================

export async function handleRedactPII(args: {
  content: string;
}): Promise<ToolResult> {
  // First pass: pattern-based redaction
  let redacted = args.content;
  const detectedPII: string[] = [];

  // Email
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(redacted)) {
    redacted = redacted.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[EMAIL]"
    );
    detectedPII.push("email");
  }

  // Phone
  if (/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(redacted)) {
    redacted = redacted.replace(
      /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      "[PHONE]"
    );
    detectedPII.push("phone");
  }

  // SSN
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(redacted)) {
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]");
    detectedPII.push("ssn");
  }

  return {
    success: true,
    data: {
      originalLength: args.content.length,
      redactedContent: redacted,
      detectedPII,
      requiresAIReview: true, // Names, addresses need AI
    },
  };
}

export async function handleRedactSecrets(args: {
  content: string;
}): Promise<ToolResult> {
  let redacted = args.content;
  const detectedSecrets: string[] = [];

  // API Keys (generic)
  if (/(api[_-]?key|apikey)[=:\s]["']?[a-zA-Z0-9]{20,}["']?/i.test(redacted)) {
    redacted = redacted.replace(
      /(api[_-]?key|apikey)[=:\s]["']?[a-zA-Z0-9]{20,}["']?/gi,
      "[REDACTED_API_KEY]"
    );
    detectedSecrets.push("api_key");
  }

  // OpenAI Keys
  if (/sk-[a-zA-Z0-9]{48}/.test(redacted)) {
    redacted = redacted.replace(/sk-[a-zA-Z0-9]{48}/g, "[REDACTED_OPENAI_KEY]");
    detectedSecrets.push("openai_key");
  }

  // AWS Keys
  if (/AKIA[0-9A-Z]{16}/.test(redacted)) {
    redacted = redacted.replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_KEY]");
    detectedSecrets.push("aws_key");
  }

  // Passwords in connection strings
  if (/password[=:][^\s&]+/i.test(redacted)) {
    redacted = redacted.replace(/password[=:][^\s&]+/gi, "password=[REDACTED]");
    detectedSecrets.push("password");
  }

  // Bearer tokens
  if (/Bearer\s+[a-zA-Z0-9._-]+/.test(redacted)) {
    redacted = redacted.replace(/Bearer\s+[a-zA-Z0-9._-]+/g, "Bearer [REDACTED]");
    detectedSecrets.push("bearer_token");
  }

  return {
    success: true,
    data: {
      originalLength: args.content.length,
      redactedContent: redacted,
      detectedSecrets,
    },
  };
}

export async function handleAnonymizeContent(args: {
  content: string;
  contentType: string;
}): Promise<ToolResult> {
  // Combine PII and secret redaction
  const piiResult = await handleRedactPII({ content: args.content });
  const secretResult = await handleRedactSecrets({
    content: (piiResult.data as { redactedContent: string }).redactedContent,
  });

  return {
    success: true,
    data: {
      contentType: args.contentType,
      anonymizedContent: (secretResult.data as { redactedContent: string }).redactedContent,
      detectedPII: (piiResult.data as { detectedPII: string[] }).detectedPII,
      detectedSecrets: (secretResult.data as { detectedSecrets: string[] }).detectedSecrets,
      requiresManualReview:
        (piiResult.data as { requiresAIReview?: boolean }).requiresAIReview || false,
    },
  };
}

// ============================================
// HIVE LIBRARY TOOL HANDLERS
// ============================================

export async function handleSearchPatterns(args: {
  query: string;
  domain?: string;
}): Promise<ToolResult> {
  try {
    const patterns = await db.pattern.findMany({
      where: {
        AND: [
          { status: "APPROVED" },
          {
            OR: [
              { title: { contains: args.query, mode: "insensitive" } },
              { content: { contains: args.query, mode: "insensitive" } },
            ],
          },
          args.domain
            ? { category: { contains: args.domain, mode: "insensitive" } }
            : {},
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: {
        patterns: patterns.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          preview: p.content.slice(0, 200),
        })),
        total: patterns.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search patterns: ${error}`,
    };
  }
}

export async function handleSearchPrompts(args: {
  query: string;
  category?: string;
}): Promise<ToolResult> {
  try {
    const prompts = await db.prompt.findMany({
      where: {
        AND: [
          { status: "APPROVED" },
          {
            OR: [
              { title: { contains: args.query, mode: "insensitive" } },
              { content: { contains: args.query, mode: "insensitive" } },
            ],
          },
          // Note: category field might not exist in Prompt model
          // Filter by tags or useCase instead if needed
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: {
        prompts: prompts.map((p) => ({
          id: p.id,
          title: p.title,
          useCase: p.useCase,
          preview: p.content.slice(0, 200),
        })),
        total: prompts.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search prompts: ${error}`,
    };
  }
}

// ============================================
// HANDLER REGISTRY
// ============================================

export const TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>) => Promise<ToolResult>
> = {
  refine_request: handleRefineRequest as (args: Record<string, unknown>) => Promise<ToolResult>,
  classify_domain: handleClassifyDomain as (args: Record<string, unknown>) => Promise<ToolResult>,
  detect_sensitive_data: handleDetectSensitiveData as (args: Record<string, unknown>) => Promise<ToolResult>,
  search_consultants: handleSearchConsultants as (args: Record<string, unknown>) => Promise<ToolResult>,
  calculate_match_score: handleCalculateMatchScore as (args: Record<string, unknown>) => Promise<ToolResult>,
  generate_match_explanation: handleGenerateMatchExplanation as (args: Record<string, unknown>) => Promise<ToolResult>,
  summarize_engagement: handleSummarizeEngagement as (args: Record<string, unknown>) => Promise<ToolResult>,
  extract_decisions: handleExtractDecisions as (args: Record<string, unknown>) => Promise<ToolResult>,
  generate_runbook: handleGenerateRunbook as (args: Record<string, unknown>) => Promise<ToolResult>,
  redact_pii: handleRedactPII as (args: Record<string, unknown>) => Promise<ToolResult>,
  redact_secrets: handleRedactSecrets as (args: Record<string, unknown>) => Promise<ToolResult>,
  anonymize_content: handleAnonymizeContent as (args: Record<string, unknown>) => Promise<ToolResult>,
  search_patterns: handleSearchPatterns as (args: Record<string, unknown>) => Promise<ToolResult>,
  search_prompts: handleSearchPrompts as (args: Record<string, unknown>) => Promise<ToolResult>,
};
