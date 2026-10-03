export const representativeKeys = {
  all: ["representatives"] as const,
  myStudents: () => [...representativeKeys.all, "me", "students"] as const,
  forStudent: (studentId: string) =>
    [...representativeKeys.all, "student", studentId] as const,
};
