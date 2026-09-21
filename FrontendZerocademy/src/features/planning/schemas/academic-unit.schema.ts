import { z } from "zod";

const optionalText = z.string().optional();
const calendarDate = z
  .string()
  .refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Ingresa una fecha válida.",
  );

export const academicUnitSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "El título es obligatorio.")
      .max(200, "El título no puede superar 200 caracteres."),
    description: optionalText,
    objectives: optionalText,
    contents: optionalText,
    activities: optionalText,
    resources: optionalText,
    evaluationNotes: optionalText,
    startDate: calendarDate,
    endDate: calendarDate,
  })
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.startDate <= value.endDate,
    {
      message: "La fecha de inicio no puede ser posterior a la fecha de fin.",
      path: ["endDate"],
    },
  );

export type AcademicUnitFormValues = z.infer<typeof academicUnitSchema>;
