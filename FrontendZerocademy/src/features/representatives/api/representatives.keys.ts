export const representativeKeys = {
  all: ["representatives"] as const,
  myStudents: () => [...representativeKeys.all, "me", "students"] as const,
};
