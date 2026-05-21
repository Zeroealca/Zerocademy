import { z } from "zod";

const optionalUuid = z
  .string()
  .uuid("Identificador inválido")
  .optional()
  .or(z.literal(""));

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, "Color inválido (use formato #RRGGBB)")
  .optional()
  .or(z.literal(""));

export const institutionFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "El nombre es demasiado largo"),
  code: z
    .string()
    .min(3, "El código debe tener al menos 3 caracteres")
    .max(50, "El código es demasiado largo")
    .regex(
      /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/,
      "Use solo minúsculas, números y guiones (sin guiones al inicio o final)",
    ),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(40, "Teléfono demasiado largo").optional().or(z.literal("")),
  address: z
    .string()
    .max(500, "Dirección demasiado larga")
    .optional()
    .or(z.literal("")),
  region: z
    .enum(["COSTA", "SIERRA", "AMAZONIA", "GALAPAGOS"])
    .optional()
    .or(z.literal("")),
  regime: z
    .enum(["COSTA_GALAPAGOS", "SIERRA_AMAZONIA"])
    .optional()
    .or(z.literal("")),
  primaryColor: hexColor,
  secondaryColor: hexColor,
});

export type InstitutionFormValues = z.infer<typeof institutionFormSchema>;

export const institutionSettingsSchema = z.object({
  email: z
    .string()
    .email("Correo electrónico inválido")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  region: z
    .enum(["COSTA", "SIERRA", "AMAZONIA", "GALAPAGOS"])
    .optional()
    .or(z.literal("")),
  regime: z
    .enum(["COSTA_GALAPAGOS", "SIERRA_AMAZONIA"])
    .optional()
    .or(z.literal("")),
});

export type InstitutionSettingsFormValues = z.infer<
  typeof institutionSettingsSchema
>;

export const institutionBrandingSchema = z.object({
  primaryColor: hexColor,
  secondaryColor: hexColor,
});

export type InstitutionBrandingFormValues = z.infer<
  typeof institutionBrandingSchema
>;

// Re-export for optional UUID fields used elsewhere
export { optionalUuid };
