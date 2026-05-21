import type { InstitutionMembershipRole } from "@/features/institution-memberships/types";

export const MEMBERSHIP_ROLE_LABELS: Record<InstitutionMembershipRole, string> = {
  ADMIN: "Administrador",
  TEACHER: "Docente",
};

export const MEMBERSHIP_STATUS_LABELS = {
  active: "Activo",
  inactive: "Inactivo",
} as const;
