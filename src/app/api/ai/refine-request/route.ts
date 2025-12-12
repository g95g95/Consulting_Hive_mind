import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { refineRequest } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rawDescription } = await request.json();

    if (!rawDescription) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    const result = await refineRequest(rawDescription);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Refine request error:", error);
    return NextResponse.json(
      { error: "Failed to refine request" },
      { status: 500 }
    );
  }
}
