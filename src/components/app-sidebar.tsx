"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  MessageSquare,
  BookOpen,
  User,
  PlusCircle,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Directory", href: "/app/directory", icon: Users },
  { name: "Requests", href: "/app/requests", icon: FileText },
  { name: "Engagements", href: "/app/engagements", icon: MessageSquare },
  { name: "Hive Mind", href: "/app/hive", icon: BookOpen },
];

const userNavigation = [
  { name: "Profile", href: "/app/profile", icon: User },
  // Settings page hidden until implemented
  // { name: "Settings", href: "/app/settings", icon: Settings },
];

export function AppSidebar({ user }: { user: User }) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border lg:bg-sidebar/30">
      <AppSidebarContent user={user} />
    </aside>
  );
}

export function AppSidebarContent({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 py-4">
        {/* Quick Actions - Only for CLIENT or BOTH (not pure CONSULTANT) */}
        {(user.role === "CLIENT" || user.role === "BOTH") && (
          <div className="px-3 mb-6">
            <Link
              href="/app/requests/new"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              New Request
            </Link>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-6 px-6">
          <div className="border-t border-border" />
        </div>

        {/* User Navigation */}
        <nav className="space-y-1 px-3">
          {userNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

          {/* Admin link for admins only */}
          {user.role === "ADMIN" && (
            <Link
              href="/app/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/app/admin")
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Shield className="h-5 w-5" />
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* Theme Toggle */}
      <div className="px-3 mb-2">
        <ThemeToggle />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Scaffolding, not a toll bridge.
        </div>
      </div>
    </div>
  );
}
