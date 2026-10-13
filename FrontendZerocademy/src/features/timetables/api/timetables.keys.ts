export const timetablesKeys = {
  all: ["timetables"] as const,
  structure: (institutionId: string, academicPeriodId: string) =>
    [...timetablesKeys.all, "structure", institutionId, academicPeriodId] as const,
  validation: (institutionId: string, academicPeriodId: string) =>
    [...timetablesKeys.structure(institutionId, academicPeriodId), "validation"] as const,
};
