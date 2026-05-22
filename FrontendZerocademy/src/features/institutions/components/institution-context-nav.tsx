"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  canManageInstitutionSettings,
  canViewAcademicTransitions,
  canViewInstitutionMemberships,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface InstitutionContextNavProps {
  institutionId: string;
}

export function InstitutionContextNav({ institutionId }: InstitutionContextNavProps) {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);

  const items = [
    {
      href: `/institutions/${institutionId}/settings`,
      label: "Configuración",
      visible: canManageInstitutionSettings(role),
    },
    {
      href: `/institutions/${institutionId}/members`,
      label: "Miembros",
      visible: canViewInstitutionMemberships(role),
    },
    {
      href: `/institutions/${institutionId}/transitions`,
      label: "Transiciones",
      visible: canViewAcademicTransitions(role),
    },
  ].filter((item) => item.visible);

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-4"
      aria-label="Secciones de la institución"
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
