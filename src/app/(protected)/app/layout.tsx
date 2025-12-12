import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <div className="flex">
        <AppSidebar user={user} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
