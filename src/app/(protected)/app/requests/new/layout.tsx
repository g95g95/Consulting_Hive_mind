import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateUser();

  // CLIENT or BOTH can always create requests
  if (user?.role === "CLIENT" || user?.role === "BOTH") {
    return <>{children}</>;
  }

  // CONSULTANT can only access if they have a client profile (for booking other consultants)
  if (user?.role === "CONSULTANT") {
    const clientProfile = await db.clientProfile.findUnique({
      where: { userId: user.id },
    });

    // If consultant has client profile, they can book (upgrade to BOTH role)
    if (clientProfile) {
      // Update role to BOTH since they have both profiles
      await db.user.update({
        where: { id: user.id },
        data: { role: "BOTH" },
      });
      return <>{children}</>;
    }

    // Pure consultant without client profile - redirect
    redirect("/app/requests");
  }

  return <>{children}</>;
}
