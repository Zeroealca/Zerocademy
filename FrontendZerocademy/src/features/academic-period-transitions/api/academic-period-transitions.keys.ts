export const academicPeriodTransitionsKeys = {
  all: ["academic-period-transitions"] as const,
  activePeriod: (institutionId: string) =>
    [...academicPeriodTransitionsKeys.all, "active-period", institutionId] as const,
  history: (institutionId: string, page: number, limit: number) =>
    [...academicPeriodTransitionsKeys.all, "history", institutionId, page, limit] as const,
};
