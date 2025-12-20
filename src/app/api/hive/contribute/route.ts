import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRedactionAgent } from "@/lib/ai/agents";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      type,
      title,
      description,
      content,
      useCase,
      tags,
      // Stack-specific fields
      uiTech,
      backendTech,
      databaseTech,
      releaseTech,
    } = await request.json();

    if (!type || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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
