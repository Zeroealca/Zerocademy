import { z } from "zod";

const regimeSchema = z.enum(["COSTA_GALAPAGOS", "SIERRA_AMAZONIA"]);

const dateRangeEndAfterStartMessage =
  "La fecha de fin debe ser posterior a la de inicio";

function isEndDateAfterStartDate(data: {
  startDate?: string;
  endDate?: string;
}): boolean {
  if (!data.startDate || !data.endDate) {
    return true;
  }
  return data.startDate < data.endDate;
}

const academicPeriodBaseSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(100),
  regime: regimeSchema,
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  endDate: z.string().min(1, "La fecha de fin es obligatoria"),
});

export const createAcademicPeriodSchema = academicPeriodBaseSchema.refine(
  (data) => data.startDate < data.endDate,
  {
    message: dateRangeEndAfterStartMessage,
    path: ["endDate"],
  },
);

export type CreateAcademicPeriodInput = z.infer<
  typeof createAcademicPeriodSchema
>;

export const updateAcademicPeriodSchema = academicPeriodBaseSchema
  .partial()
  .refine(isEndDateAfterStartDate, {
    message: dateRangeEndAfterStartMessage,
    path: ["endDate"],
  });

export type UpdateAcademicPeriodInput = z.infer<
  typeof updateAcademicPeriodSchema
>;

const academicTermBaseSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(100),
  order: z.number().int().min(1, "El orden debe ser al menos 1"),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  endDate: z.string().min(1, "La fecha de fin es obligatoria"),
});

export const createAcademicTermSchema = academicTermBaseSchema.refine(
  (data) => data.startDate < data.endDate,
  {
    message: dateRangeEndAfterStartMessage,
    path: ["endDate"],
  },
);

export type CreateAcademicTermInput = z.infer<typeof createAcademicTermSchema>;

export const updateAcademicTermSchema = academicTermBaseSchema
  .partial()
  .refine(isEndDateAfterStartDate, {
    message: dateRangeEndAfterStartMessage,
    path: ["endDate"],
  });

export type UpdateAcademicTermInput = z.infer<typeof updateAcademicTermSchema>;
