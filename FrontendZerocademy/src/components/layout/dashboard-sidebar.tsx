"use client";

import { CalendarDays, GraduationCap, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { canManageUsers, canViewAcademicPeriods } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const baseNavItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
];

const adminNavItem = {
  href: "/users",
  label: "Usuarios",
  icon: Users,
};

const academicPeriodsNavItem = {
  href: "/academic-periods",
  label: "Períodos académicos",
  icon: CalendarDays,
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.user);

  const navItems = [...baseNavItems];

  if (canViewAcademicPeriods(currentUser?.role)) {
    navItems.push(academicPeriodsNavItem);
  }

  if (canManageUsers(currentUser?.role)) {
    navItems.push(adminNavItem);
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
        <span className="font-semibold tracking-tight">Zerocademy</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Navegación principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
