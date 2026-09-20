export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceCourse {
  id: string;
  name: string;
  section: string;
  gradeLevelName: string;
}
export interface DailyAttendanceStudent {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  status: AttendanceStatus | null;
  notes: string | null;
}
export interface DailyAttendance {
  course: AttendanceCourse;
  date: string;
  isReadOnly: boolean;
  students: DailyAttendanceStudent[];
}
export interface BulkAttendanceRecord {
  enrollmentId: string;
  status: AttendanceStatus;
  notes?: string;
}
export interface BulkUpsertAttendanceInput {
  academicPeriodId: string;
  courseId: string;
  date: string;
  records: BulkAttendanceRecord[];
}
export interface BulkAttendanceResult {
  processed: number;
  created: number;
  updated: number;
}
export interface AttendanceCounts {
  recordedDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number | null;
}
export interface AttendanceHistoryItem {
  id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  courseName: string;
  justification: {
    id: string;
    status: AttendanceJustificationStatus;
  } | null;
  canSubmitJustification: boolean;
}
export interface MyAttendanceHistory {
  summary: AttendanceCounts;
  records: AttendanceHistoryItem[];
}
export interface CourseAttendanceStudentSummary extends AttendanceCounts {
  enrollmentId: string;
  fullName: string;
}
export interface CourseAttendanceReport {
  course: AttendanceCourse;
  academicPeriodName: string;
  startDate: string;
  endDate: string;
  students: CourseAttendanceStudentSummary[];
}
export type AttendanceJustificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface AttendanceJustification {
  id: string;
  reason: string;
  status: AttendanceJustificationStatus;
  createdAt: string;
  reviewComment: string | null;
  submittedByUser: {
    firstName: string;
    lastName: string;
    role: "STUDENT" | "REPRESENTATIVE";
  };
  attendanceRecord: {
    id: string;
    date: string;
    course: { name: string; section: string };
    enrollment: { student: { user: { firstName: string; lastName: string } } };
  };
}
