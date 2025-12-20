import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getHiveContributionAgent, type ContributionType } from "@/lib/ai/agents";

/**
 * POST /api/ai/refine-contribution
 *
 * Refines a hive library contribution using the HiveContributionAgent.
 * Uses Gemini AI to improve title, description, tags, and content structure.
 *
 * Request body:
 * {
 *   type: "pattern" | "prompt" | "stack",
 *   title: string,
 *   description?: string,
 *   content: string,
 *   tags?: string[],
 *   // Stack-specific (optional)
 *   uiTech?: string,
 *   backendTech?: string,
 *   databaseTech?: string,
 *   releaseTech?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      content,
      tags,
      uiTech,
      backendTech,
      databaseTech,
      releaseTech,
    } = body;

    // Validate required fields
    if (!type || !["pattern", "prompt", "stack"].includes(type)) {
      return NextResponse.json(
        { error: "Valid type required: pattern, prompt, or stack" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Use the HiveContributionAgent
    const hiveAgent = getHiveContributionAgent();
    const result = await hiveAgent.refine(type as ContributionType, {
      title,
      description,
      content,
      tags,
      uiTech,
      backendTech,
      databaseTech,
      releaseTech,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Refine contribution error:", error);
    return NextResponse.json(
      { error: "Failed to refine contribution" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/refine-contribution
 *
 * Returns information about the refine contribution endpoint.
 */
export async function GET() {
  return NextResponse.json({
    description: "Refine hive library contributions with AI assistance",
    supportedTypes: ["pattern", "prompt", "stack"],
    requiredFields: ["type", "title", "content"],
    optionalFields: ["description", "tags", "uiTech", "backendTech", "databaseTech", "releaseTech"],
    response: {
      refinedTitle: "Improved title",
      refinedDescription: "Improved description",
      suggestedTags: ["Tag1", "Tag2"],
      suggestedCategory: "Category",
      refinedContent: "Structured and improved content",
      stackMetadata: "For stack type only",
      qualityScore: "0-100",
      improvements: ["List of improvements made"],
      suggestions: ["Additional suggestions"],
      isReadyForSubmission: "boolean",
      confidence: "high | medium | low",
    },
  });
}
