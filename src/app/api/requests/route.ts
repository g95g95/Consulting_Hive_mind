import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db.request.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          {
            isPublic: true,
            status: { in: ["PUBLISHED", "MATCHING"] },
          },
        ],
      },
      include: {
        creator: true,
        skills: {
          include: { skillTag: true },
        },
        offers: {
          include: {
            consultant: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      title,
      rawDescription,
      refinedSummary,
      constraints,
      desiredOutcome,
      suggestedDuration,
      urgency,
      budget,
      selectedSkills,
      sensitiveData,
      isPublic,
      consultantId,
    } = data;

    // Create the request
    const newRequest = await db.request.create({
      data: {
        creatorId: user.id,
        title,
        rawDescription,
        refinedSummary,
        constraints,
        desiredOutcome,
        suggestedDuration: suggestedDuration || 60,
        urgency: urgency || "NORMAL",
        budget: budget ? parseInt(budget) * 100 : null, // Convert to cents
        sensitiveData: sensitiveData || false,
        isPublic: isPublic !== false,
        status: "PUBLISHED",
      },
    });

    // Add skills
    if (selectedSkills && selectedSkills.length > 0) {
      for (const skillName of selectedSkills) {
        const skillTag = await db.skillTag.findFirst({
          where: { name: skillName },
        });

        if (skillTag) {
          await db.requestSkill.create({
            data: {
              requestId: newRequest.id,
              skillTagId: skillTag.id,
            },
          });
        }
      }
    }

    // If direct consultant booking, create an offer
    if (consultantId) {
      const consultantProfile = await db.consultantProfile.findUnique({
        where: { userId: consultantId },
      });

      if (consultantProfile) {
        await db.offer.create({
          data: {
            requestId: newRequest.id,
            consultantId: consultantProfile.id,
            status: "PENDING",
          },
        });

        // Update request status
        await db.request.update({
          where: { id: newRequest.id },
          data: { status: "MATCHING", isPublic: false },
        });
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "REQUEST_CREATED",
        entity: "Request",
        entityId: newRequest.id,
      },
    });

    return NextResponse.json(newRequest);
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
