import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTransferPack } from "@/lib/ai/provider";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const engagement = await db.engagement.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            request: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        notes: true,
      },
    });

    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    if (
      engagement.booking.clientId !== user.id &&
      engagement.booking.consultantId !== user.id
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Generate with AI
    const aiResult = await generateTransferPack({
      agenda: engagement.agenda,
      notes: engagement.notes.map((n) => ({ content: n.content, title: n.title })),
      messages: engagement.messages.map((m) => ({ content: m.content, authorId: m.authorId })),
      request: engagement.booking.request
        ? {
            title: engagement.booking.request.title,
            refinedSummary: engagement.booking.request.refinedSummary,
            desiredOutcome: engagement.booking.request.desiredOutcome,
          }
        : null,
    });

    // Create or update transfer pack
    const transferPack = await db.transferPack.upsert({
      where: { engagementId: id },
      update: {
        summary: aiResult.summary,
        keyDecisions: aiResult.keyDecisions,
        runbook: aiResult.runbook,
        nextSteps: aiResult.nextSteps,
        internalizationChecklist: aiResult.internalizationChecklist,
        aiGenerated: true,
      },
      create: {
        engagementId: id,
        summary: aiResult.summary,
        keyDecisions: aiResult.keyDecisions,
        runbook: aiResult.runbook,
        nextSteps: aiResult.nextSteps,
        internalizationChecklist: aiResult.internalizationChecklist,
        aiGenerated: true,
      },
    });

    return NextResponse.json(transferPack);
  } catch (error) {
    console.error("Generate transfer pack error:", error);
    return NextResponse.json({ error: "Failed to generate transfer pack" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const engagement = await db.engagement.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    if (
      engagement.booking.clientId !== user.id &&
      engagement.booking.consultantId !== user.id
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const data = await request.json();

    const transferPack = await db.transferPack.upsert({
      where: { engagementId: id },
      update: {
        summary: data.summary,
        keyDecisions: data.keyDecisions,
        runbook: data.runbook,
        nextSteps: data.nextSteps,
        internalizationChecklist: data.internalizationChecklist,
        isFinalized: data.isFinalized || false,
      },
      create: {
        engagementId: id,
        summary: data.summary,
        keyDecisions: data.keyDecisions,
        runbook: data.runbook,
        nextSteps: data.nextSteps,
        internalizationChecklist: data.internalizationChecklist,
        isFinalized: data.isFinalized || false,
      },
    });

    // If finalized, update engagement status
    if (data.isFinalized) {
      await db.engagement.update({
        where: { id },
        data: {
          status: "TRANSFERRED",
          endedAt: new Date(),
        },
      });

      // Update booking status
      await db.booking.update({
        where: { id: engagement.bookingId },
        data: { status: "COMPLETED" },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "ENGAGEMENT_COMPLETED",
          entity: "Engagement",
          entityId: id,
        },
      });
    }

    return NextResponse.json(transferPack);
  } catch (error) {
    console.error("Update transfer pack error:", error);
    return NextResponse.json({ error: "Failed to update transfer pack" }, { status: 500 });
  }
}
