import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redactSensitiveContent } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, title, description, content, useCase, tags } = await request.json();

    if (!type || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create redaction job
    const redactionJob = await db.redactionJob.create({
      data: {
        originalText: content,
        status: "PROCESSING",
      },
    });

    // Run redaction
    let redactedContent = content;
    let detectedPII: string[] = [];
    let detectedSecrets: string[] = [];

    try {
      const redactionResult = await redactSensitiveContent(content);
      redactedContent = redactionResult.redactedText;
      detectedPII = redactionResult.detectedPII;
      detectedSecrets = redactionResult.detectedSecrets;

      await db.redactionJob.update({
        where: { id: redactionJob.id },
        data: {
          redactedText: redactedContent,
          detectedPII,
          detectedSecrets,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Redaction error:", error);
      await db.redactionJob.update({
        where: { id: redactionJob.id },
        data: {
          status: "FAILED",
          errorMessage: "Redaction failed",
        },
      });
      // Continue with original content but mark for manual review
    }

    // Create the contribution based on type
    let contribution;

    switch (type) {
      case "pattern":
        contribution = await db.pattern.create({
          data: {
            creatorId: user.id,
            title,
            description: description || "",
            content: redactedContent,
            tags: tags || [],
            status: "PENDING_REVIEW",
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
            content: redactedContent,
            useCase,
            tags: tags || [],
            status: "PENDING_REVIEW",
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
            content: redactedContent,
            tags: tags || [],
            status: "PENDING_REVIEW",
            redactionJobId: redactionJob.id,
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "HIVE_CONTRIBUTION",
        entity: type.charAt(0).toUpperCase() + type.slice(1),
        entityId: contribution.id,
        metadata: { detectedPII, detectedSecrets },
      },
    });

    return NextResponse.json(contribution);
  } catch (error) {
    console.error("Contribute error:", error);
    return NextResponse.json({ error: "Failed to submit contribution" }, { status: 500 });
  }
}
