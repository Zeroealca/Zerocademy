export const ACTIVE_STATUS_LABELS = {
  true: "Activo",
  false: "Inactivo",
} as const;

export const SYSTEM_SCOPE_LABELS = {
  true: "Sistema",
  false: "Personalizado",
} as const;

export const ACTIVE_STATUS_VARIANTS = {
  true: "success",
  false: "muted",
} as const satisfies Record<
  "true" | "false",
  "default" | "success" | "secondary" | "muted"
>;
