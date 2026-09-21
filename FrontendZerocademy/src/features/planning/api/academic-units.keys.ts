export const academicUnitsKeys = {
  all: ["academic-units"] as const,
  lists: () => [...academicUnitsKeys.all, "list"] as const,
  list: (academicPlanId: string) =>
    [...academicUnitsKeys.lists(), academicPlanId] as const,
  details: () => [...academicUnitsKeys.all, "detail"] as const,
  detail: (academicPlanId: string, academicUnitId: string) =>
    [...academicUnitsKeys.details(), academicPlanId, academicUnitId] as const,
};
