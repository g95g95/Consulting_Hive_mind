import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
        booking: true,
      },
    });

    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (
      engagement.booking.clientId !== user.id &&
      engagement.booking.consultantId !== user.id
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        engagementId: id,
        authorId: user.id,
        content: content.trim(),
      },
    });

    // Update engagement timestamp
    await db.engagement.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Create message error:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
