import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail, getNewRequestEmailHtml } from "@/lib/email";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { createRequestSchema, validateSchema } from "@/lib/validation";

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

    const rateLimit = checkRateLimit(`requests:${user.id}`, RATE_LIMITS.strict);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const rawData = await request.json();
    const validation = validateSchema(createRequestSchema, rawData);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

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
    } = validation.data;

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
        budget: budget ? parseInt(String(budget)) * 100 : null, // Convert to cents
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

    // If direct consultant booking, create an offer and send email
    if (consultantId) {
      const consultantProfile = await db.consultantProfile.findUnique({
        where: { userId: consultantId },
        include: { user: true },
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

        // Send email notification to consultant
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!baseUrl) {
          console.error("NEXT_PUBLIC_APP_URL not configured");
        }
        const requestUrl = `${baseUrl || ""}/app/requests`;

        await sendEmail({
          to: consultantProfile.user.email,
          subject: `New consultation request: ${title}`,
          html: getNewRequestEmailHtml({
            consultantName: consultantProfile.user.firstName || "Consultant",
            clientName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "A client",
            requestTitle: title,
            requestSummary: refinedSummary || rawDescription || "No description provided",
            requestUrl,
          }),
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
