import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getOrchestrator,
  detectIntent,
  type OrchestratorIntent,
} from "@/lib/ai/orchestrator";

/**
 * POST /api/ai/orchestrate
 *
 * Central API endpoint for all AI operations.
 * Routes requests to the appropriate agent based on intent.
 *
 * Request body:
 * {
 *   intent?: "refine_request" | "match_consultants" | "generate_transfer_pack" | "redact_content" | "search_hive" | "refine_contribution",
 *   context: { ... } // Intent-specific data
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { intent: explicitIntent, context } = body;

    if (!context || typeof context !== "object") {
      return NextResponse.json(
        { error: "Context is required" },
        { status: 400 }
      );
    }

    // Determine intent (explicit or auto-detected)
    const intent: OrchestratorIntent = explicitIntent || detectIntent(context);

    // Process through orchestrator
    const orchestrator = getOrchestrator();
    const result = await orchestrator.process({
      intent,
      context,
      userId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "AI processing failed",
          intent: result.intent,
          executionTimeMs: result.executionTimeMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      intent: result.intent,
      agentUsed: result.agentUsed,
      result: result.result,
      toolsUsed: result.toolsUsed,
      executionTimeMs: result.executionTimeMs,
    });
  } catch (error) {
    console.error("Orchestrator API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/orchestrate
 *
 * Returns available intents and their descriptions.
 * Useful for API discovery.
 */
export async function GET() {
  return NextResponse.json({
    availableIntents: [
      {
        intent: "refine_request",
        description: "Transform messy problem descriptions into structured consultation scopes",
        requiredContext: ["rawDescription"],
        optionalContext: [],
      },
      {
        intent: "match_consultants",
        description: "Find and score consultant matches for a request",
        requiredContext: ["requestId"],
        optionalContext: ["title", "summary", "skills", "desiredOutcome", "budget"],
      },
      {
        intent: "generate_transfer_pack",
        description: "Generate knowledge transfer documents for engagement closure",
        requiredContext: ["engagementId"],
        optionalContext: ["requestTitle", "requestSummary", "desiredOutcome", "agenda", "notes", "messages"],
      },
      {
        intent: "redact_content",
        description: "Detect and redact sensitive information from content",
        requiredContext: ["contentToRedact"],
        optionalContext: ["contentType"],
      },
      {
        intent: "search_hive",
        description: "Search the hive library for patterns, prompts, and templates",
        requiredContext: ["searchQuery"],
        optionalContext: ["filters"],
      },
      {
        intent: "refine_contribution",
        description: "Refine and improve hive library contributions (patterns, prompts, stacks)",
        requiredContext: ["contributionType", "title", "contributionContent"],
        optionalContext: ["description", "tags", "uiTech", "backendTech", "databaseTech", "releaseTech"],
      },
    ],
    defaultModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
}
