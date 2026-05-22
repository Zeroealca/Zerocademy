import { Gender } from '@prisma/client';

/** Column order — must match the student creation form fields. */
export const STUDENT_CSV_FIELD_KEYS = [
  'email',
  'password',
  'firstName',
  'lastName',
  'nationalId',
  'birthDate',
  'gender',
  'phone',
  'address',
  'emergencyContact',
] as const;

export const STUDENT_CSV_FIELD_COUNT = STUDENT_CSV_FIELD_KEYS.length;

export const STUDENT_CSV_REQUIRED_FIELD_KEYS = [
  'email',
  'password',
  'firstName',
  'lastName',
  'nationalId',
] as const;

export const STUDENT_CSV_HEADER_LINE = `${STUDENT_CSV_FIELD_KEYS.join(',')};`;

export const STUDENT_CSV_VALID_GENDERS: readonly Gender[] = [
  Gender.MALE,
  Gender.FEMALE,
  Gender.OTHER,
  Gender.UNSPECIFIED,
];
