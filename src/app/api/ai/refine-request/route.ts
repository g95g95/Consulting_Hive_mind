import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getIntakeAgent } from "@/lib/ai/agents";

/**
 * POST /api/ai/refine-request
 *
 * Refines a raw consultation request using the IntakeAgent.
 * Uses Gemini AI to transform messy descriptions into structured scopes.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rawDescription } = await request.json();

    if (!rawDescription) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    // Use the new IntakeAgent with Gemini
    const intakeAgent = getIntakeAgent();
    const result = await intakeAgent.refine(rawDescription);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Refine request error:", error);

    // Check for rate limiting errors
    const isRateLimited = error instanceof Error &&
      (error.message.includes("429") ||
       error.message.includes("quota") ||
       error.message.includes("rate"));

    if (isRateLimited) {
      return NextResponse.json(
        { error: "AI service is temporarily busy. Please try again in a few seconds." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to refine request" },
      { status: 500 }
    );
  }
}
