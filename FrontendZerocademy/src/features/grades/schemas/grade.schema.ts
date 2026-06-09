import { z } from "zod";

export const gradeEntryRowSchema = z.object({
  enrollmentId: z.string().uuid(),
  score: z
    .number({ error: "Indica una nota válida" })
    .min(0, "La nota no puede ser negativa"),
  observations: z.string().max(2000).optional(),
});

export const bulkGradeEntrySchema = z.object({
  assessmentId: z.string().uuid("Selecciona una evaluación"),
  rows: z.array(gradeEntryRowSchema).min(1, "Debes ingresar al menos una nota"),
});

export type BulkGradeEntryFormInput = z.infer<typeof bulkGradeEntrySchema>;
