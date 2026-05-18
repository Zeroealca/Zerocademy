import { z } from "zod";

const optionalUuid = z
  .string()
  .uuid("El identificador no es válido")
  .optional()
  .or(z.literal(""));

const optionalDescription = z
  .string()
  .max(500, "La descripción no puede superar 500 caracteres")
  .optional()
  .or(z.literal(""));

export const createGradeLevelSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar 120 caracteres"),
  code: z
    .string()
    .min(1, "El código es obligatorio")
    .max(32, "El código no puede superar 32 caracteres"),
  order: z.number().int().min(1, "El orden debe ser al menos 1"),
  description: optionalDescription,
  academicLevelId: z
    .string()
    .uuid("Selecciona un nivel académico válido"),
  institutionId: optionalUuid,
  isSystem: z.boolean().optional(),
});

export type CreateGradeLevelInput = z.infer<typeof createGradeLevelSchema>;

export const updateGradeLevelSchema = createGradeLevelSchema.partial();

export type UpdateGradeLevelInput = z.infer<typeof updateGradeLevelSchema>;
