import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRedactionAgent } from "@/lib/ai/agents";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { hiveContributionSchema, validateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`hive:${user.id}`, RATE_LIMITS.strict);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const rawData = await request.json();
    const validation = validateSchema(hiveContributionSchema, rawData);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      type,
      title,
      description,
      content,
      useCase,
      tags,
      uiTech,
      backendTech,
      databaseTech,
      releaseTech,
    } = validation.data;

    // Use RedactionAgent to detect and redact sensitive content
    const redactionAgent = getRedactionAgent();
    const contentType = type === "stack" ? "stack_template" : type;
    const redactionResult = await redactionAgent.redact(content, contentType as "pattern" | "prompt" | "stack_template");

    // Create redaction job record
    const redactionJob = await db.redactionJob.create({
      data: {
        originalText: content,
        redactedText: redactionResult.redactedText,
        detectedPII: redactionResult.detectedPII,
        detectedSecrets: redactionResult.detectedSecrets,
        status: redactionResult.requiresManualReview ? "PENDING" : "COMPLETED",
      },
    });

    // Determine initial status based on redaction confidence
    const initialStatus = redactionResult.requiresManualReview
      ? "PENDING_REVIEW"
      : "PENDING_REVIEW"; // Still requires admin review even if AI is confident

    // Create the contribution based on type
    let contribution;

    switch (type) {
      case "pattern":
        contribution = await db.pattern.create({
          data: {
            creatorId: user.id,
            title,
            description: description || "",
            content: redactionResult.redactedText,
            tags: tags || [],
            status: initialStatus,
            redactionJobId: redactionJob.id,
          },
        });
        break;

      case "prompt":
        contribution = await db.prompt.create({
          data: {
            creatorId: user.id,
            title,
            description,
            content: redactionResult.redactedText,
            useCase,
            tags: tags || [],
            status: initialStatus,
            redactionJobId: redactionJob.id,
          },
        });
        break;

      case "stack":
        contribution = await db.stackTemplate.create({
          data: {
            creatorId: user.id,
            title,
            description: description || "",
            content: redactionResult.redactedText,
            tags: tags || [],
            uiTech: uiTech || null,
            backendTech: backendTech || null,
            databaseTech: databaseTech || null,
            releaseTech: releaseTech || null,
            status: initialStatus,
            redactionJobId: redactionJob.id,
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Audit log with redaction details
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "HIVE_CONTRIBUTION",
        entity: type.charAt(0).toUpperCase() + type.slice(1),
        entityId: contribution.id,
        metadata: {
          redactionJobId: redactionJob.id,
          detectedPII: redactionResult.detectedPII,
          detectedSecrets: redactionResult.detectedSecrets,
          requiresManualReview: redactionResult.requiresManualReview,
          confidence: redactionResult.confidence,
        },
      },
    });

    return NextResponse.json({
      ...contribution,
      redactionInfo: {
        detectedPII: redactionResult.detectedPII,
        detectedSecrets: redactionResult.detectedSecrets,
        requiresReview: redactionResult.requiresManualReview,
        confidence: redactionResult.confidence,
      },
    });
  } catch (error) {
    console.error("Contribute error:", error);
    return NextResponse.json({ error: "Failed to submit contribution" }, { status: 500 });
  }
}
