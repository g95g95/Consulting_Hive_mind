import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, requestId } = await request.json();

    // Get the offer
    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        request: true,
        consultant: {
          include: { user: true },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Only request creator can accept/decline
    if (offer.request.creatorId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (action === "accept") {
      // Update offer status
      await db.offer.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });

      // Decline all other offers
      await db.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: id },
        },
        data: { status: "DECLINED" },
      });

      // Update request status
      await db.request.update({
        where: { id: offer.requestId },
        data: { status: "BOOKED" },
      });

      // Create booking
      const booking = await db.booking.create({
        data: {
          requestId: offer.requestId,
          clientId: user.id,
          consultantId: offer.consultant.userId,
          duration: offer.request.suggestedDuration || 60,
          status: "PENDING", // Will be CONFIRMED after payment
        },
      });

      // Create engagement
      const engagement = await db.engagement.create({
        data: {
          bookingId: booking.id,
          status: "ACTIVE",
        },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "OFFER_ACCEPTED",
          entity: "Offer",
          entityId: id,
          metadata: { engagementId: engagement.id, bookingId: booking.id },
        },
      });

      return NextResponse.json({
        success: true,
        engagementId: engagement.id,
        bookingId: booking.id,
      });
    }

    if (action === "decline") {
      await db.offer.update({
        where: { id },
        data: { status: "DECLINED" },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "OFFER_DECLINED",
          entity: "Offer",
          entityId: id,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update offer error:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}
