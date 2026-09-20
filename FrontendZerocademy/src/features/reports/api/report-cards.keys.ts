export const reportCardsKeys = {
  all: ["report-cards"] as const,
  mine: (academicPeriodId: string) =>
    [...reportCardsKeys.all, "me", academicPeriodId] as const,
  student: (studentId: string, academicPeriodId: string) =>
    [...reportCardsKeys.all, "student", studentId, academicPeriodId] as const,
};
