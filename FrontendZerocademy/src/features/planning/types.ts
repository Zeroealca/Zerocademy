export type AcademicPlanStatus = "DRAFT" | "PUBLISHED";
export interface AcademicPlan { id:string; teacherAssignmentId:string; academicPeriodId:string; academicPeriodName:string; academicPeriodStatus:string; academicTermId:string; academicTermName:string; academicTermOrder:number; courseId:string; courseName:string; courseSection:string; subjectId:string; subjectName:string; subjectCode:string; teacherId:string; teacherFirstName:string; teacherLastName:string; title:string; description:string|null; startDate:string|null; endDate:string|null; objectives:string|null; contents:string|null; activities:string|null; resources:string|null; evaluationNotes:string|null; notes:string|null; status:AcademicPlanStatus; createdByUserId:string; publishedAt:string|null; publishedByUserId:string|null; createdAt:string; updatedAt:string; }
export interface AcademicPlansFilters { page:number; limit:number; academicPeriodId?:string; teacherAssignmentId?:string; courseId?:string; subjectId?:string; academicTermId?:string; status?:AcademicPlanStatus; search?:string; }
export interface AcademicPlansListResponse { data:AcademicPlan[]; meta:{page:number;limit:number;total:number;totalPages:number}; }
export interface AcademicPlanInput { teacherAssignmentId:string; academicTermId:string; title:string; description?:string; startDate?:string; endDate?:string; objectives?:string; contents?:string; activities?:string; resources?:string; evaluationNotes?:string; notes?:string; }
export type UpdateAcademicPlanInput = Omit<Partial<AcademicPlanInput>, "teacherAssignmentId">;

export interface AcademicUnit {
  id: string;
  academicPlanId: string;
  title: string;
  description: string | null;
  objectives: string | null;
  contents: string | null;
  activities: string | null;
  resources: string | null;
  evaluationNotes: string | null;
  startDate: string | null;
  endDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicUnitInput {
  title: string;
  description?: string;
  objectives?: string;
  contents?: string;
  activities?: string;
  resources?: string;
  evaluationNotes?: string;
  startDate?: string;
  endDate?: string;
}

export type UpdateAcademicUnitInput = Partial<AcademicUnitInput>;

export interface ReorderAcademicUnitsInput {
  unitIds: string[];
}

export interface LessonPlan {
  id: string;
  academicUnitId: string;
  title: string;
  lessonDate: string;
  durationMinutes: number | null;
  objectives: string | null;
  introduction: string | null;
  development: string | null;
  closure: string | null;
  resources: string | null;
  evaluationStrategy: string | null;
  notes: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicPlanLessonPlan extends LessonPlan {
  academicUnitTitle: string;
}

export interface LessonPlanInput {
  title: string;
  lessonDate: string;
  durationMinutes?: number;
  objectives?: string;
  introduction?: string;
  development?: string;
  closure?: string;
  resources?: string;
  evaluationStrategy?: string;
  notes?: string;
}

export type UpdateLessonPlanInput = Partial<LessonPlanInput>;

export interface ReorderLessonPlansInput {
  lessonPlanIds: string[];
}
