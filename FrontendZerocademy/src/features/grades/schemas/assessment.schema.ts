import { z } from "zod";

export const assessmentFormSchema = z.object({
  institutionId: z.string().uuid("Selecciona una institución válida"),
  academicPeriodId: z.string().uuid("Selecciona un período académico"),
  academicTermId: z.string().uuid("Selecciona un trimestre / quimestre"),
  teacherAssignmentId: z.string().uuid("Selecciona una asignación docente"),
  subjectId: z.string().uuid("Selecciona una materia"),
  assessmentCategoryId: z.string().uuid("Selecciona una categoría de evaluación"),
  title: z
    .string()
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(200, "El título no puede superar 200 caracteres"),
  description: z
    .string()
    .max(2000, "La descripción no puede superar 2000 caracteres")
    .optional(),
  maxScore: z
    .number({ error: "Indica la nota máxima" })
    .positive("La nota máxima debe ser mayor que 0"),
  weight: z
    .number({ error: "Indica el peso" })
    .min(0.01, "El peso debe ser mayor que 0")
    .max(100, "El peso no puede superar 100"),
  assessmentDate: z.string().min(1, "Indica la fecha de la evaluación"),
});

export type AssessmentFormInput = z.infer<typeof assessmentFormSchema>;
