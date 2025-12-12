import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyName, companyRole, preferredLanguage, billingEmail } = await request.json();

    const clientProfile = await db.clientProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName,
        companyRole,
        preferredLanguage,
        billingEmail,
      },
      create: {
        userId: user.id,
        companyName,
        companyRole,
        preferredLanguage,
        billingEmail,
      },
    });

    return NextResponse.json(clientProfile);
  } catch (error) {
    console.error("Client profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// POST - Create a new client profile (for consultants who want to also be clients)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if client profile already exists
    const existingProfile = await db.clientProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      return NextResponse.json({ error: "Client profile already exists" }, { status: 400 });
    }

    // Create client profile
    const clientProfile = await db.clientProfile.create({
      data: {
        userId: user.id,
      },
    });

    // Update user role to BOTH if they are a CONSULTANT
    if (user.role === "CONSULTANT") {
      await db.user.update({
        where: { id: user.id },
        data: { role: "BOTH" },
      });
    }

    return NextResponse.json(clientProfile);
  } catch (error) {
    console.error("Client profile creation error:", error);
    return NextResponse.json({ error: "Failed to create client profile" }, { status: 500 });
  }
}
