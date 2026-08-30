import { z } from "zod";
import type { AcademicTransitionRequest } from "@/features/academic-period-transitions/types";

const transitionOptionsSchema = z.object({
  copyCourses: z.boolean(),
  copyTeacherAssignments: z.boolean(),
  copyTerms: z.boolean(),
  activateTargetPeriod: z.boolean(),
  closeSourcePeriod: z.boolean(),
});

const createTargetPeriodSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  regime: z.enum(["COSTA_GALAPAGOS", "SIERRA_AMAZONIA"], {
    error: "Selecciona un régimen académico",
  }),
  startDate: z.string().min(1, "Indica la fecha de inicio"),
  endDate: z.string().min(1, "Indica la fecha de fin"),
});

/** Campos del formulario; la validación estricta solo aplica en modo «create». */
const createTargetPeriodDraftSchema = z.object({
  name: z.string(),
  regime: z.enum(["COSTA_GALAPAGOS", "SIERRA_AMAZONIA"]),
  startDate: z.string(),
  endDate: z.string(),
});

export const academicTransitionWizardSchema = z
  .object({
    fromAcademicPeriodId: z.string().uuid("Selecciona el período origen"),
    targetMode: z.enum(["existing", "create"], {
      error: "Selecciona cómo definir el período destino",
    }),
    toAcademicPeriodId: z
      .union([
        z.string().uuid("Selecciona un período destino válido"),
        z.literal(""),
      ])
      .optional(),
    createTargetPeriod: createTargetPeriodDraftSchema.optional(),
    options: transitionOptionsSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.targetMode === "existing" &&
      (!data.toAcademicPeriodId || data.toAcademicPeriodId === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el período destino",
        path: ["toAcademicPeriodId"],
      });
    }

    if (data.targetMode === "create") {
      const result = createTargetPeriodSchema.safeParse(data.createTargetPeriod);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["createTargetPeriod", ...issue.path],
          });
        }
      }
    }

    if (
      data.options.copyTeacherAssignments &&
      !data.options.copyCourses
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Para copiar asignaciones docentes debes copiar cursos",
        path: ["options", "copyTeacherAssignments"],
      });
    }
  });

export type AcademicTransitionWizardValues = z.infer<
  typeof academicTransitionWizardSchema
>;

export function wizardValuesToRequest(
  values: AcademicTransitionWizardValues,
): AcademicTransitionRequest {
  if (values.targetMode === "existing") {
    return {
      fromAcademicPeriodId: values.fromAcademicPeriodId,
      toAcademicPeriodId: values.toAcademicPeriodId || undefined,
      options: values.options,
    };
  }

  const createTargetPeriod = createTargetPeriodSchema.parse(
    values.createTargetPeriod,
  );

  return {
    fromAcademicPeriodId: values.fromAcademicPeriodId,
    createTargetPeriod,
    options: values.options,
  };
}
