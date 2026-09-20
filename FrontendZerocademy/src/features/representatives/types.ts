export interface RepresentativeStudent {
  id: string;
  representativeUserId: string;
  studentId: string;
  relationshipType: "MOTHER" | "FATHER" | "LEGAL_GUARDIAN" | "GRANDPARENT" | "OTHER";
  isPrimary: boolean;
  isActive: boolean;
  fullName: string;
  academicPeriodName?: string;
  gradeLevelName?: string;
  courseName?: string;
  section?: string;
}
