"use client";

import { UserButton } from "@clerk/nextjs";
import { Hexagon, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebarContent } from "./app-sidebar";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export function AppHeader({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-400">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-slate-800 border-slate-700 p-0">
            <AppSidebarContent user={user} />
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/app" className="flex items-center gap-2 ml-2 lg:ml-0">
          <Hexagon className="h-6 w-6 text-amber-500" />
          <span className="font-semibold text-white hidden sm:inline">Hive Mind</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info and menu */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
