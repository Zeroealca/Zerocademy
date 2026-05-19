import { z } from "zod";

export const createTeacherAssignmentSchema = z.object({
  teacherId: z.string().uuid("Selecciona un docente válido"),
  subjectId: z.string().uuid("Selecciona una materia válida"),
  courseId: z.string().uuid("Selecciona un curso válido"),
  academicPeriodId: z.string().uuid("Selecciona un período válido"),
});

export type CreateTeacherAssignmentInput = z.infer<
  typeof createTeacherAssignmentSchema
>;
