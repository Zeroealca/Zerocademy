export const timetablesKeys = {
  all: ["timetables"] as const,
  structure: (institutionId: string, academicPeriodId: string) =>
    [
      ...timetablesKeys.all,
      "structure",
      institutionId,
      academicPeriodId,
    ] as const,
  validation: (institutionId: string, academicPeriodId: string) =>
    [
      ...timetablesKeys.structure(institutionId, academicPeriodId),
      "validation",
    ] as const,
  list: (institutionId: string, academicPeriodId: string) =>
    [...timetablesKeys.all, "list", institutionId, academicPeriodId] as const,
  detail: (timetableId: string) =>
    [...timetablesKeys.all, "detail", timetableId] as const,
  timetableValidation: (timetableId: string) =>
    [...timetablesKeys.detail(timetableId), "validation"] as const,
  teachingLoads: (institutionId: string, academicPeriodId: string) =>
    [
      ...timetablesKeys.all,
      "teaching-loads",
      institutionId,
      academicPeriodId,
    ] as const,
  mine: (academicPeriodId: string) =>
    [...timetablesKeys.all, "mine", academicPeriodId] as const,
  mineToday: (academicPeriodId: string) =>
    [...timetablesKeys.mine(academicPeriodId), "today"] as const,
};
