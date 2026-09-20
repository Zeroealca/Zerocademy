export interface QualitativeResult {
  code: string;
  description: string;
}
export interface ReportCardTerm {
  id: string;
  name: string;
  order: number;
  average: number | null;
  qualitativeResult: QualitativeResult | null;
}
export interface ReportCardSubject {
  id: string;
  name: string;
  code: string;
  terms: ReportCardTerm[];
  average: number | null;
  qualitativeResult: QualitativeResult | null;
}
export interface ReportCard {
  enrollmentId: string;
  student: {
    id: string;
    fullName: string;
    nationalId: string | null;
    registrationNumber: string | null;
  };
  institution: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  academicPeriod: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  enrollment: {
    courseId: string;
    courseName: string;
    section: string;
    gradeLevelName: string;
  };
  subjects: ReportCardSubject[];
  overallAverage: number | null;
  overallQualitativeResult: QualitativeResult | null;
}
