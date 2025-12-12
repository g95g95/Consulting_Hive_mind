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
      include: { booking: true, checklistItems: true },
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

    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const maxOrder = engagement.checklistItems.reduce(
      (max, item) => Math.max(max, item.order),
      -1
    );

    const item = await db.checklistItem.create({
      data: {
        engagementId: id,
        text: text.trim(),
        order: maxOrder + 1,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Create checklist item error:", error);
    return NextResponse.json({ error: "Failed to create checklist item" }, { status: 500 });
  }
}
