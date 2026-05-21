import { z } from "zod";

const transitionOptionsSchema = z.object({
  copyCourses: z.boolean(),
  copyTeacherAssignments: z.boolean(),
  copyTerms: z.boolean(),
  activateTargetPeriod: z.boolean(),
  closeSourcePeriod: z.boolean(),
});

const createTargetPeriodSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  regime: z.enum(["COSTA_GALAPAGOS", "SIERRA_AMAZONIA"]),
  startDate: z.string().min(1, "Indica la fecha de inicio"),
  endDate: z.string().min(1, "Indica la fecha de fin"),
});

export const academicTransitionWizardSchema = z
  .object({
    fromAcademicPeriodId: z.string().uuid("Selecciona el período origen"),
    targetMode: z.enum(["existing", "create"]),
    toAcademicPeriodId: z.string().uuid().optional(),
    createTargetPeriod: createTargetPeriodSchema.optional(),
    options: transitionOptionsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.targetMode === "existing" && !data.toAcademicPeriodId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el período destino",
        path: ["toAcademicPeriodId"],
      });
    }
    if (data.targetMode === "create" && !data.createTargetPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Completa los datos del nuevo período",
        path: ["createTargetPeriod"],
      });
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
): import("@/features/academic-period-transitions/types").AcademicTransitionRequest {
  return {
    fromAcademicPeriodId: values.fromAcademicPeriodId,
    toAcademicPeriodId:
      values.targetMode === "existing" ? values.toAcademicPeriodId : undefined,
    createTargetPeriod:
      values.targetMode === "create" ? values.createTargetPeriod : undefined,
    options: values.options,
  };
}
