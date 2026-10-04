"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AcademicPeriodContextLoader } from "@/components/layout/academic-period-context-loader";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { AuthGuard } from "@/features/auth/components/auth-guard";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  return (
    <AuthGuard>
      <AcademicPeriodContextLoader />
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuChange={setIsMobileMenuOpen}
          isDesktopCollapsed={isDesktopSidebarCollapsed}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuToggle={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
            onDesktopSidebarToggle={() =>
              setIsDesktopSidebarCollapsed((isCollapsed) => !isCollapsed)
            }
          />
          <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
