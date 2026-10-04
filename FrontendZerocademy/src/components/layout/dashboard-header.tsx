"use client";

import { ChevronsLeft, ChevronsRight, LogOut, Menu, X } from "lucide-react";
import { AcademicPeriodSelector } from "@/components/layout/academic-period-selector";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/features/users/constants";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAuthStore } from "@/stores/use-auth-store";
import type { UserRole } from "@/stores/use-auth-store";

interface DashboardHeaderProps {
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  isDesktopSidebarCollapsed: boolean;
  onDesktopSidebarToggle: () => void;
}

export function DashboardHeader({
  isMobileMenuOpen,
  onMobileMenuToggle,
  isDesktopSidebarCollapsed,
  onDesktopSidebarToggle,
}: DashboardHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const roleLabel =
    user?.role && user.role in ROLE_LABELS
      ? ROLE_LABELS[user.role as UserRole]
      : user?.role;

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMobileMenuOpen}
          onClick={onMobileMenuToggle}
        >
          {isMobileMenuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden shrink-0 md:inline-flex"
          aria-label={
            isDesktopSidebarCollapsed
              ? "Expandir barra lateral"
              : "Contraer barra lateral"
          }
          aria-expanded={!isDesktopSidebarCollapsed}
          onClick={onDesktopSidebarToggle}
        >
          {isDesktopSidebarCollapsed ? (
            <ChevronsRight aria-hidden />
          ) : (
            <ChevronsLeft aria-hidden />
          )}
        </Button>
        <div className="min-w-0">
          <p className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
            Bienvenido de nuevo
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AcademicPeriodSelector />
        <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
          {roleLabel}
        </span>
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-2">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
