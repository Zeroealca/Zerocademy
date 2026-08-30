import { z } from "zod";

const numberField = (message: string) =>
  z.number({ error: message });

const decimalPlacesField = z
  .number({ error: "Indica los decimales" })
  .int("Los decimales deben ser un número entero")
  .min(0, "Los decimales no pueden ser menores que 0")
  .max(4, "Los decimales no pueden ser mayores que 4");

const orderField = z
  .number({ error: "Indica el orden" })
  .int("El orden debe ser un número entero")
  .min(1, "El orden debe ser al menos 1");

const roundingStrategyField = z.enum(
  ["ROUND_HALF_UP", "ROUND_DOWN", "ROUND_UP", "TRUNCATE"],
  { error: "Selecciona una estrategia de redondeo" },
);

export const gradingSchemeSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    minScore: numberField("Indica la nota mínima"),
    maxScore: numberField("Indica la nota máxima"),
    passingScore: numberField("Indica la nota de aprobación"),
    decimalPlaces: decimalPlacesField,
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
    minValue: numberField("Indica el valor mínimo"),
    maxValue: numberField("Indica el valor máximo"),
    order: orderField,
  })
  .refine((data) => data.minValue <= data.maxValue, {
    message: "El valor mínimo no puede ser mayor que el máximo",
    path: ["maxValue"],
  });

export const evaluationTermSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  order: orderField,
  weight: z
    .number({ error: "Indica el peso" })
    .gt(0, "El peso debe ser mayor que 0")
    .max(100, "El peso no puede superar 100"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const assessmentCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  weight: z
    .number({ error: "Indica el peso" })
    .gt(0, "El peso debe ser mayor que 0")
    .max(100, "El peso no puede superar 100"),
  description: z.string().optional(),
});

export const assessmentCategoryTemplateSchema = assessmentCategorySchema.extend({
  order: orderField,
});

export const evaluationTermTemplateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  order: orderField,
  weight: z
    .number({ error: "Indica el peso" })
    .gt(0, "El peso debe ser mayor que 0")
    .max(100, "El peso no puede superar 100"),
  description: z.string().optional(),
});

export const platformConfigurationSchema = z.object({
  roundingStrategy: roundingStrategyField,
  decimalPlaces: decimalPlacesField,
});

export const institutionConfigurationSchema = z.object({
  gradingSchemeId: z.string().uuid("Seleccione un esquema de calificación"),
  activeAcademicPeriodId: z
    .string()
    .uuid("Seleccione un período académico válido")
    .optional()
    .or(z.literal("")),
  roundingStrategy: roundingStrategyField,
  decimalPlaces: decimalPlacesField,
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
