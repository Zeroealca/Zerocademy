export const lessonPlansKeys = {
  all: ["lesson-plans"] as const,
  plans: () => [...lessonPlansKeys.all, "plan"] as const,
  plan: (academicPlanId: string) =>
    [...lessonPlansKeys.plans(), academicPlanId] as const,
  units: (academicPlanId: string) =>
    [...lessonPlansKeys.plan(academicPlanId), "unit"] as const,
  unit: (academicPlanId: string, academicUnitId: string) =>
    [...lessonPlansKeys.units(academicPlanId), academicUnitId] as const,
  lists: (academicPlanId: string, academicUnitId: string) =>
    [...lessonPlansKeys.unit(academicPlanId, academicUnitId), "list"] as const,
  list: (academicPlanId: string, academicUnitId: string) =>
    [...lessonPlansKeys.lists(academicPlanId, academicUnitId)] as const,
  details: (academicPlanId: string, academicUnitId: string) =>
    [...lessonPlansKeys.unit(academicPlanId, academicUnitId), "detail"] as const,
  detail: (
    academicPlanId: string,
    academicUnitId: string,
    lessonPlanId: string,
  ) =>
    [
      ...lessonPlansKeys.details(academicPlanId, academicUnitId),
      lessonPlanId,
    ] as const,
};
