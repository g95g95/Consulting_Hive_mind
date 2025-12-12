import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyName, industry, companySize } = await request.json();

    const clientProfile = await db.clientProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName,
        industry,
        companySize,
      },
      create: {
        userId: user.id,
        companyName,
        industry,
        companySize,
      },
    });

    return NextResponse.json(clientProfile);
  } catch (error) {
    console.error("Client profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
