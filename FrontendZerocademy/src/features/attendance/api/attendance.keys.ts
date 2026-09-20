export const attendanceKeys = {
  all: ["attendance"] as const,
  courses: (academicPeriodId: string) =>
    [...attendanceKeys.all, "courses", academicPeriodId] as const,
  daily: (academicPeriodId: string, courseId: string, date: string) =>
    [...attendanceKeys.all, "daily", academicPeriodId, courseId, date] as const,
};
