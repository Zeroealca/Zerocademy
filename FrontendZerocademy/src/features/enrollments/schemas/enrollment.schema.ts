import { z } from "zod";

const statusSchema = z.enum([
  "ACTIVE",
  "WITHDRAWN",
  "COMPLETED",
  "FAILED",
  "TRANSFERRED",
]);

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid("Selecciona un estudiante"),
  courseId: z.string().uuid("Selecciona un curso"),
  academicPeriodId: z.string().uuid("Selecciona un período académico"),
  enrollmentDate: z.string().optional(),
  status: statusSchema.optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentSchema = z.object({
  enrollmentDate: z.string().optional(),
  status: statusSchema.optional(),
});

export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
