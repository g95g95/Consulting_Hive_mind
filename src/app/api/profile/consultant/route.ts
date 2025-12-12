import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      bio,
      headline,
      hourlyRate,
      linkedinUrl,
      portfolioUrl,
      timezone,
      yearsExperience,
      isAvailable,
      consentDirectory,
      consentHiveMind,
    } = await request.json();

    const consultantProfile = await db.consultantProfile.upsert({
      where: { userId: user.id },
      update: {
        bio,
        headline,
        hourlyRate,
        linkedinUrl,
        portfolioUrl,
        timezone,
        yearsExperience,
        isAvailable,
        consentDirectory,
        consentHiveMind,
      },
      create: {
        userId: user.id,
        bio,
        headline,
        hourlyRate,
        linkedinUrl,
        portfolioUrl,
        timezone,
        yearsExperience,
        isAvailable: isAvailable ?? true,
        consentDirectory: consentDirectory ?? true,
        consentHiveMind: consentHiveMind ?? false,
        languages: ["English"],
      },
    });

    return NextResponse.json(consultantProfile);
  } catch (error) {
    console.error("Consultant profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
