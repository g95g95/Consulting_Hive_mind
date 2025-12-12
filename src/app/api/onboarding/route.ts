import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      role,
      headline,
      bio,
      hourlyRate,
      languages,
      timezone,
      linkedinUrl,
      yearsExperience,
      selectedSkills,
      consentDirectory,
      consentHiveMind,
      companyName,
      companyRole,
      billingEmail,
    } = data;

    // Update user role
    await db.user.update({
      where: { id: user.id },
      data: {
        role: role,
        onboarded: true,
      },
    });

    // Create/update consultant profile if applicable
    if (role === "CONSULTANT" || role === "BOTH") {
      const consultantData = {
        headline,
        bio,
        hourlyRate: hourlyRate ? parseInt(hourlyRate) * 100 : null, // Convert to cents
        languages: languages || [],
        timezone,
        linkedinUrl,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        consentDirectory: consentDirectory ?? true,
        consentHiveMind: consentHiveMind ?? false,
      };

      const consultantProfile = await db.consultantProfile.upsert({
        where: { userId: user.id },
        update: consultantData,
        create: {
          userId: user.id,
          ...consultantData,
        },
      });

      // Add skills
      if (selectedSkills && selectedSkills.length > 0) {
        // First, remove existing skills
        await db.consultantSkill.deleteMany({
          where: { profileId: consultantProfile.id },
        });

        // Then add new skills
        for (const skillName of selectedSkills) {
          const skillTag = await db.skillTag.findFirst({
            where: { name: skillName },
          });

          if (skillTag) {
            await db.consultantSkill.create({
              data: {
                profileId: consultantProfile.id,
                skillTagId: skillTag.id,
              },
            });
          }
        }
      }
    }

    // Create/update client profile if applicable
    if (role === "CLIENT" || role === "BOTH") {
      const clientData = {
        companyName,
        companyRole,
        billingEmail,
      };

      await db.clientProfile.upsert({
        where: { userId: user.id },
        update: clientData,
        create: {
          userId: user.id,
          ...clientData,
        },
      });
    }

    // Log consent
    if (role === "CONSULTANT" || role === "BOTH") {
      await db.consentLog.create({
        data: {
          userId: user.id,
          type: "DIRECTORY_LISTING",
          granted: consentDirectory ?? true,
        },
      });

      await db.consentLog.create({
        data: {
          userId: user.id,
          type: "HIVE_MIND_CONTRIBUTION",
          granted: consentHiveMind ?? false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
