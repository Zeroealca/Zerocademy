export interface CategoryAverage {
  assessmentCategoryId: string;
  assessmentCategoryName: string;
  weight: number;
  average: number | null;
  gradeCount: number;
}

export interface TermAverage {
  academicTermId: string;
  academicTermName: string;
  order: number;
  weight: number;
  average: number | null;
  categories: CategoryAverage[];
}

export interface SubjectAverage {
  subjectId: string;
  subjectName: string;
  average: number | null;
  isPassing: boolean | null;
  terms: TermAverage[];
}

export interface StudentSubjectAverages {
  academicPeriodId: string;
  enrollmentId: string;
  subjects: SubjectAverage[];
}

export interface StudentTermAverages {
  academicPeriodId: string;
  enrollmentId: string;
  subjectId?: string;
  terms: TermAverage[];
}

export interface StudentPerformanceSummary {
  academicPeriodId: string;
  enrollmentId: string;
  overallAverage: number | null;
  subjectCount: number;
  passingSubjectCount: number;
  subjects: SubjectAverage[];
}

export interface CourseSubjectAverageItem {
  subjectId: string;
  subjectName: string;
  classAverage: number | null;
  studentCount: number;
  gradedStudentCount: number;
}

export interface TeacherCourseAverages {
  courseId: string;
  courseName: string;
  academicPeriodId: string;
  subjects: CourseSubjectAverageItem[];
}

export interface StudentPerformanceItem {
  studentId: string;
  studentName: string;
  subjectAverage: number | null;
  isPassing: boolean | null;
}

export interface TeacherSubjectPerformance {
  courseId: string;
  subjectId: string;
  subjectName: string;
  academicPeriodId: string;
  classAverage: number | null;
  students: StudentPerformanceItem[];
}

export interface TeacherStudentPerformance {
  studentId: string;
  studentName: string;
  academicPeriodId: string;
  courseId?: string;
  overallAverage: number | null;
  subjects: SubjectAverage[];
}

export interface InstitutionCourseSummaryItem {
  courseId: string;
  courseName: string;
  averagePerformance: number | null;
  studentCount: number;
}

export interface AdminInstitutionPerformance {
  institutionId: string;
  academicPeriodId: string;
  institutionAverage: number | null;
  courseCount: number;
  courses: InstitutionCourseSummaryItem[];
}

export interface AdminCoursePerformance {
  courseId: string;
  courseName: string;
  academicPeriodId: string;
  courseAverage: number | null;
  subjects: CourseSubjectAverageItem[];
}

export interface PerformancePeriodQuery {
  academicPeriodId: string;
}

export interface PerformanceCourseQuery extends PerformancePeriodQuery {
  courseId: string;
}

export interface PerformanceSubjectQuery extends PerformanceCourseQuery {
  subjectId: string;
}

export interface PerformanceStudentQuery extends PerformancePeriodQuery {
  studentId: string;
  courseId?: string;
}
