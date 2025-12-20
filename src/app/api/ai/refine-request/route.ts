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
    return NextResponse.json(
      { error: "Failed to refine request" },
      { status: 500 }
    );
  }
}
