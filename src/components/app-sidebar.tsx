"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  MessageSquare,
  BookOpen,
  User,
  Settings,
  PlusCircle,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  { name: "Settings", href: "/app/settings", icon: Settings },
];

export function AppSidebar({ user }: { user: User }) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-slate-700/50 lg:bg-slate-800/30">
      <AppSidebarContent user={user} />
    </aside>
  );
}

export function AppSidebarContent({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 py-4">
        {/* Quick Actions */}
        <div className="px-3 mb-6">
          <Link
            href="/app/requests/new"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            New Request
          </Link>
        </div>

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
                    ? "bg-slate-700/50 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
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
          <div className="border-t border-slate-700/50" />
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
                    ? "bg-slate-700/50 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
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
                  ? "bg-slate-700/50 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/30"
              )}
            >
              <Shield className="h-5 w-5" />
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 text-center">
          Scaffolding, not a toll bridge.
        </div>
      </div>
    </div>
  );
}
