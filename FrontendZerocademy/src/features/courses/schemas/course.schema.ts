import { z } from "zod";

export const createCourseSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar 120 caracteres"),
  section: z
    .string()
    .min(1, "El paralelo es obligatorio")
    .max(16, "El paralelo no puede superar 16 caracteres"),
  capacity: z.number().int().min(1, "La capacidad debe ser al menos 1").optional(),
  academicPeriodId: z
    .string()
    .uuid("Selecciona un período académico válido"),
  gradeLevelId: z.string().uuid("Selecciona un grado válido"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.partial();

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
