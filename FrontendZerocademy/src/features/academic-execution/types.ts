export type ClassSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface ClassSession {
  id: string;
  teacherAssignmentId: string;
  lessonPlanId: string | null;
  status: ClassSessionStatus;
  scheduledDate: string | null;
  occurredOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassSessionInput {
  lessonPlanId?: string | null;
  status?: ClassSessionStatus;
  scheduledDate?: string;
  occurredOn?: string;
}

export type UpdateClassSessionInput = Partial<CreateClassSessionInput>;
