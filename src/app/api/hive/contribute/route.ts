import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
// TODO: Re-enable PII redaction when implemented
// import { redactSensitiveContent } from "@/lib/ai/provider";

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

    // TODO: Re-enable PII redaction when implemented
    // For now, bypass redaction and use content as-is
    const redactedContent = content;

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
            // redactionJobId: redactionJob.id, // TODO: Re-enable
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
            // redactionJobId: redactionJob.id, // TODO: Re-enable
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
            uiTech: uiTech || null,
            backendTech: backendTech || null,
            databaseTech: databaseTech || null,
            releaseTech: releaseTech || null,
            status: "PENDING_REVIEW",
            // redactionJobId: redactionJob.id, // TODO: Re-enable
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
        metadata: {}, // TODO: Add PII detection results when re-enabled
      },
    });

    return NextResponse.json(contribution);
  } catch (error) {
    console.error("Contribute error:", error);
    return NextResponse.json({ error: "Failed to submit contribution" }, { status: 500 });
  }
}
