import { z } from "zod";

const optionalText = z.string().optional();

export const lessonPlanSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio.")
    .max(200, "El título no puede superar 200 caracteres."),
  lessonDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida."),
  durationMinutes: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || (/^\d+$/.test(value) && Number(value) > 0),
      "La duración debe ser un número entero positivo.",
    ),
  objectives: optionalText,
  introduction: optionalText,
  development: optionalText,
  closure: optionalText,
  resources: optionalText,
  evaluationStrategy: optionalText,
  notes: optionalText,
});

export type LessonPlanFormValues = z.infer<typeof lessonPlanSchema>;
