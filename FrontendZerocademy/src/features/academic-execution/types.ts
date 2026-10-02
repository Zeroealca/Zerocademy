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

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export interface ClassSessionAttendanceRoster {
  classSession: Pick<
    ClassSession,
    "id" | "status" | "scheduledDate" | "occurredOn"
  >;
  isReadOnly: boolean;
  records: Array<{
    enrollmentId: string;
    studentId: string;
    firstName: string;
    lastName: string;
    status: AttendanceStatus | null;
    note: string | null;
  }>;
}
export interface ReplaceClassSessionAttendanceInput {
  records: Array<{
    enrollmentId: string;
    status: AttendanceStatus;
    note?: string | null;
  }>;
}
