import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user is a consultant
    if (user.role !== "CONSULTANT" && user.role !== "BOTH") {
      return NextResponse.json({ error: "Only consultants can make offers" }, { status: 403 });
    }

    const consultantProfile = await db.consultantProfile.findUnique({
      where: { userId: user.id },
    });

    if (!consultantProfile) {
      return NextResponse.json({ error: "Consultant profile not found" }, { status: 404 });
    }

    const { requestId, message, proposedRate } = await request.json();

    // Check request exists and is open
    const req = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (req.status !== "PUBLISHED" && req.status !== "MATCHING") {
      return NextResponse.json({ error: "Request is not open for offers" }, { status: 400 });
    }

    // Check if already offered
    const existingOffer = await db.offer.findUnique({
      where: {
        requestId_consultantId: {
          requestId,
          consultantId: consultantProfile.id,
        },
      },
    });

    if (existingOffer) {
      return NextResponse.json({ error: "You have already made an offer" }, { status: 400 });
    }

    // Create offer
    const offer = await db.offer.create({
      data: {
        requestId,
        consultantId: consultantProfile.id,
        message,
        proposedRate: proposedRate ? parseInt(proposedRate) * 100 : consultantProfile.hourlyRate,
        status: "PENDING",
      },
    });

    // Update request status if first offer
    if (req.status === "PUBLISHED") {
      await db.request.update({
        where: { id: requestId },
        data: { status: "MATCHING" },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "OFFER_CREATED",
        entity: "Offer",
        entityId: offer.id,
        metadata: { requestId },
      },
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Create offer error:", error);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
