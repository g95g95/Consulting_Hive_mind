import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pending contributions
    const [patterns, prompts, stacks] = await Promise.all([
      db.pattern.findMany({
        where: { status: "PENDING_REVIEW" },
        include: {
          creator: true,
          redactionJob: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      db.prompt.findMany({
        where: { status: "PENDING_REVIEW" },
        include: {
          creator: true,
          redactionJob: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      db.stackTemplate.findMany({
        where: { status: "PENDING_REVIEW" },
        include: {
          creator: true,
          redactionJob: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      patterns,
      prompts,
      stacks,
    });
  } catch (error) {
    console.error("Moderation fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch moderation queue" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id, action, reason } = await request.json();

    if (!type || !id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    let result;

    switch (type) {
      case "pattern":
        result = await db.pattern.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedBy: user.id,
            reviewedAt: new Date(),
          },
        });
        break;
      case "prompt":
        result = await db.prompt.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedBy: user.id,
            reviewedAt: new Date(),
          },
        });
        break;
      case "stack":
        result = await db.stackTemplate.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedBy: user.id,
            reviewedAt: new Date(),
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
        action: action === "approve" ? "CONTRIBUTION_APPROVED" : "CONTRIBUTION_REJECTED",
        entity: type.charAt(0).toUpperCase() + type.slice(1),
        entityId: id,
        metadata: { reason },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json({ error: "Failed to process moderation action" }, { status: 500 });
  }
}
