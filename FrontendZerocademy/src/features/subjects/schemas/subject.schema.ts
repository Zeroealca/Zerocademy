import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(32, "El código es demasiado largo"),
  description: z
    .string()
    .max(500, "La descripción es demasiado larga")
    .optional(),
  isSystem: z.boolean().optional(),
  gradeLevelIds: z.array(z.string().uuid("Grado inválido")).optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
