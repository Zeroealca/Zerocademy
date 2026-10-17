export const timetablesKeys = {
  all: ["timetables"] as const,
  structure: (institutionId: string, academicPeriodId: string) =>
    [...timetablesKeys.all, "structure", institutionId, academicPeriodId] as const,
  validation: (institutionId: string, academicPeriodId: string) =>
    [...timetablesKeys.structure(institutionId, academicPeriodId), "validation"] as const,
  list: (institutionId: string, academicPeriodId: string) =>
    [...timetablesKeys.all, "list", institutionId, academicPeriodId] as const,
  detail: (timetableId: string) =>
    [...timetablesKeys.all, "detail", timetableId] as const,
  timetableValidation: (timetableId: string) =>
    [...timetablesKeys.detail(timetableId), "validation"] as const,
};
