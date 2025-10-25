"use client";

import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

interface TopbarProps {
  workspace: Tables<"workspaces">;
  user: Session["user"];
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Topbar({ workspace, user, onToggleSidebar, isSidebarOpen }: TopbarProps) {
  const initials = user.email?.charAt(0).toUpperCase() ?? "A";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className={cn("lg:hidden", isSidebarOpen && "bg-slate-100")}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </Button>
        <span className="text-lg font-semibold text-slate-900">
          {workspace.icon ?? "📘"} {workspace.name}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Avatar initials={initials} src={(user.user_metadata?.avatar_url as string) ?? null} />
        <div className="hidden flex-col text-right text-sm leading-tight sm:flex">
          <span className="font-medium text-slate-900">{user.email}</span>
          <span className="text-xs text-slate-500">{user.user_metadata?.full_name as string}</span>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
