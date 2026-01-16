import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMatcherAgent } from "@/lib/ai/agents";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { createOfferSchema, validateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`offers:${user.id}`, RATE_LIMITS.strict);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    // Check user is a consultant
    if (user.role !== "CONSULTANT" && user.role !== "BOTH") {
      return NextResponse.json({ error: "Only consultants can make offers" }, { status: 403 });
    }

    const consultantProfile = await db.consultantProfile.findUnique({
      where: { userId: user.id },
      include: {
        skills: { include: { skillTag: true } },
      },
    });

    if (!consultantProfile) {
      return NextResponse.json({ error: "Consultant profile not found" }, { status: 404 });
    }

    const rawData = await request.json();
    const validation = validateSchema(createOfferSchema, rawData);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { requestId, message, proposedRate } = validation.data;

    // Check request exists and is open
    const req = await db.request.findUnique({
      where: { id: requestId },
      include: {
        skills: { include: { skillTag: true } },
      },
    });

    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (req.status !== "PUBLISHED" && req.status !== "MATCHING") {
      return NextResponse.json({ error: "Request is not open for offers" }, { status: 400 });
    }

    // Check if already offered
    const existingOffer = await db.offer.findUnique({
      where: {
        requestId_consultantId: {
          requestId,
          consultantId: consultantProfile.id,
        },
      },
    });

    if (existingOffer) {
      return NextResponse.json({ error: "You have already made an offer" }, { status: 400 });
    }

    // Calculate AI match score using MatcherAgent
    let matchScore: number | null = null;
    let matchReason: string | null = null;

    try {
      const matcherAgent = getMatcherAgent();
      const matchResult = await matcherAgent.calculateScore(
        {
          title: req.title,
          summary: req.refinedSummary || req.title,
          skills: req.skills.map((s: { skillTag: { name: string } }) => s.skillTag.name),
          desiredOutcome: req.desiredOutcome || "",
        },
        {
          id: consultantProfile.id,
          name: user.firstName || "Consultant",
          headline: consultantProfile.headline || "",
          bio: consultantProfile.bio || "",
          skills: consultantProfile.skills.map((s: { skillTag: { name: string } }) => s.skillTag.name),
          rating: 0, // Rating computed separately
        }
      );
      matchScore = matchResult.score;
      matchReason = matchResult.reason;
    } catch (error) {
      // Log but don't fail - matching is enhancement, not critical
      console.error("AI match calculation failed:", error);
    }

    // Create offer with AI-calculated match score
    const offer = await db.offer.create({
      data: {
        requestId,
        consultantId: consultantProfile.id,
        message,
        proposedRate: proposedRate ? parseInt(String(proposedRate)) * 100 : consultantProfile.hourlyRate,
        status: "PENDING",
        matchScore,
        matchReason,
      },
    });

    // Update request status if first offer
    if (req.status === "PUBLISHED") {
      await db.request.update({
        where: { id: requestId },
        data: { status: "MATCHING" },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "OFFER_CREATED",
        entity: "Offer",
        entityId: offer.id,
        metadata: { requestId, matchScore },
      },
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Create offer error:", error);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
