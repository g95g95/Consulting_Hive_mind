import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
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

    const { isCompleted, text } = await request.json();

    const item = await db.checklistItem.update({
      where: { id: itemId },
      data: {
        ...(isCompleted !== undefined && { isCompleted }),
        ...(text !== undefined && { text }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update checklist item error:", error);
    return NextResponse.json({ error: "Failed to update checklist item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
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

    await db.checklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete checklist item error:", error);
    return NextResponse.json({ error: "Failed to delete checklist item" }, { status: 500 });
  }
}
