import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { engagementId, revieweeId, type, rating, comment } = await request.json();

    if (!engagementId || !revieweeId || !type || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Verify engagement exists and user is participant
    const engagement = await db.engagement.findUnique({
      where: { id: engagementId },
      include: { booking: true },
    });

    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    const isClient = engagement.booking.clientId === user.id;
    const isConsultant = engagement.booking.consultantId === user.id;

    if (!isClient && !isConsultant) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Verify review type matches user role
    if (type === "CLIENT_TO_CONSULTANT" && !isClient) {
      return NextResponse.json({ error: "Only clients can submit this review type" }, { status: 403 });
    }

    if (type === "CONSULTANT_TO_CLIENT" && !isConsultant) {
      return NextResponse.json({ error: "Only consultants can submit this review type" }, { status: 403 });
    }

    // Check if review already exists
    const existingReview = await db.review.findFirst({
      where: {
        engagementId,
        reviewerId: user.id,
        type,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: "Review already submitted" }, { status: 400 });
    }

    // Create review
    const review = await db.review.create({
      data: {
        engagementId,
        reviewerId: user.id,
        revieweeId,
        type,
        rating,
        comment,
      },
    });

    // Update consultant's average rating if applicable
    if (type === "CLIENT_TO_CONSULTANT") {
      const allReviews = await db.review.findMany({
        where: {
          revieweeId,
          type: "CLIENT_TO_CONSULTANT",
        },
      });

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await db.consultantProfile.update({
        where: { userId: revieweeId },
        data: {
          avgRating,
          totalReviews: allReviews.length,
        },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "REVIEW_SUBMITTED",
        entity: "Review",
        entityId: review.id,
        metadata: { type, rating },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const engagementId = searchParams.get("engagementId");
    const consultantId = searchParams.get("consultantId");

    if (engagementId) {
      // Get reviews for a specific engagement
      const reviews = await db.review.findMany({
        where: { engagementId },
        include: {
          reviewer: true,
          reviewee: true,
        },
      });
      return NextResponse.json(reviews);
    }

    if (consultantId) {
      // Get reviews for a consultant (public)
      const reviews = await db.review.findMany({
        where: {
          revieweeId: consultantId,
          type: "CLIENT_TO_CONSULTANT",
        },
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return NextResponse.json(reviews);
    }

    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
