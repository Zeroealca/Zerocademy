"use client";

import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAuthStore } from "@/stores/use-auth-store";

export function DashboardHeader() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Welcome back
        </p>
        <p className="text-sm font-semibold text-foreground">
          {user ? `${user.firstName} ${user.lastName}` : "User"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
          {user?.role.replace("_", " ")}
        </span>
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-2">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
