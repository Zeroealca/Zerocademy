export interface ClassroomCourseNode {
  id: string;
  name: string;
  section: string;
  capacity?: number | null;
  isActive: boolean;
}

export interface GradeLevelNode {
  id: string;
  name: string;
  code: string;
  order: number;
  isActive: boolean;
  courses: ClassroomCourseNode[];
}

export interface AcademicLevelNode {
  id: string;
  name: string;
  code: string;
  order: number;
  isActive: boolean;
  gradeLevels: GradeLevelNode[];
}

export interface AcademicHierarchyResponse {
  levels: AcademicLevelNode[];
}

export interface AcademicHierarchyFilters {
  academicPeriodId?: string;
  institutionId?: string;
}
