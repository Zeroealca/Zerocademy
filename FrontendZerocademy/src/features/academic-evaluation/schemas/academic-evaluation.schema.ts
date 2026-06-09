import { z } from "zod";

export const gradingSchemeSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    minScore: z.number(),
    maxScore: z.number(),
    passingScore: z.number(),
    decimalPlaces: z.number().int().min(0).max(4),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => data.minScore < data.maxScore, {
    message: "La nota mínima debe ser menor que la máxima",
    path: ["maxScore"],
  })
  .refine(
    (data) =>
      data.passingScore >= data.minScore && data.passingScore <= data.maxScore,
    {
      message: "La nota de aprobación debe estar dentro del rango",
      path: ["passingScore"],
    },
  );

export const gradeScaleSchema = z
  .object({
    code: z.string().min(1, "El código es obligatorio"),
    description: z.string().min(2, "La descripción es obligatoria"),
    minValue: z.number(),
    maxValue: z.number(),
    order: z.number().int().min(1, "El orden debe ser al menos 1"),
  })
  .refine((data) => data.minValue <= data.maxValue, {
    message: "El valor mínimo no puede ser mayor que el máximo",
    path: ["maxValue"],
  });

export const evaluationTermSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  order: z.number().int().min(1, "El orden debe ser al menos 1"),
  weight: z
    .number()
    .gt(0, "El peso debe ser mayor que 0")
    .max(100, "El peso no puede superar 100"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const assessmentCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  weight: z
    .number()
    .gt(0, "El peso debe ser mayor que 0")
    .max(100, "El peso no puede superar 100"),
  description: z.string().optional(),
});

export const assessmentCategoryTemplateSchema = assessmentCategorySchema.extend({
  order: z.number().int().min(1, "El orden debe ser al menos 1"),
});

export const evaluationTermTemplateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  order: z.number().int().min(1, "El orden debe ser al menos 1"),
  weight: z
    .number()
    .gt(0, "El peso debe ser mayor que 0")
    .max(100, "El peso no puede superar 100"),
  description: z.string().optional(),
});

export const platformConfigurationSchema = z.object({
  roundingStrategy: z.enum([
    "ROUND_HALF_UP",
    "ROUND_DOWN",
    "ROUND_UP",
    "TRUNCATE",
  ]),
  decimalPlaces: z.number().int().min(0).max(4),
});

export const institutionConfigurationSchema = z.object({
  gradingSchemeId: z.string().uuid("Seleccione un esquema de calificación"),
  activeAcademicPeriodId: z.string().uuid().optional().or(z.literal("")),
  roundingStrategy: z.enum([
    "ROUND_HALF_UP",
    "ROUND_DOWN",
    "ROUND_UP",
    "TRUNCATE",
  ]),
  decimalPlaces: z
    .number()
    .int("Los decimales deben ser un número entero")
    .min(0)
    .max(4),
});

export const ROUNDING_STRATEGY_LABELS: Record<
  "ROUND_HALF_UP" | "ROUND_DOWN" | "ROUND_UP" | "TRUNCATE",
  string
> = {
  ROUND_HALF_UP: "Redondeo estándar (mitad hacia arriba)",
  ROUND_DOWN: "Redondeo hacia abajo",
  ROUND_UP: "Redondeo hacia arriba",
  TRUNCATE: "Truncar decimales",
};
