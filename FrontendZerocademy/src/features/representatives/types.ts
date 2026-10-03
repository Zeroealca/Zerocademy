export type RepresentativeRelationshipType =
  | "MOTHER"
  | "FATHER"
  | "LEGAL_GUARDIAN"
  | "GRANDPARENT"
  | "OTHER";

export interface RepresentativeStudent {
  id: string;
  representativeUserId: string;
  studentId: string;
  relationshipType: RepresentativeRelationshipType;
  isPrimary: boolean;
  isActive: boolean;
  fullName: string;
  representativeFullName?: string;
  representativeEmail?: string;
  academicPeriodId?: string;
  academicPeriodName?: string;
  gradeLevelName?: string;
  courseName?: string;
  section?: string;
}

export interface CreateRepresentativeStudentInput {
  representativeUserId: string;
  relationshipType: RepresentativeRelationshipType;
  isPrimary?: boolean;
}

export interface UpdateRepresentativeStudentInput {
  relationshipType: RepresentativeRelationshipType;
  isPrimary?: boolean;
}
