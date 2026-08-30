import { EnrollmentStatus, Gender } from '@prisma/client';

/** Stable identifiers for grades demo seed and e2e tests. */
export const DEMO_GRADES_INSTITUTION_CODE = 'demo-grades';

export const DEMO_CURRENT_PERIOD_NAME = '2025-2026 Demo';
export const DEMO_PREVIOUS_PERIOD_NAME = '2024-2025 Demo';

export const DEMO_GRADES_ASSESSMENT_TITLE = 'Demo Unit 1 Exam';
export const DEMO_FORMATIVE_ASSESSMENT_TITLE = 'Tarea en clase 1';

/** Stable SHA-256 input for a revoked refresh-token row (never a real JWT). */
export const DEMO_REVOKED_REFRESH_TOKEN_SEED =
  'seed-revoked-refresh-token-demo-grades';

export const DEMO_INSTITUTION_PROFILE = {
  name: 'Escuela Demo Calificaciones',
  email: 'demo@zerocademy.edu',
  phone: '+593-2-234-5678',
  address: 'Av. Amazonas N12-34 y Colón, Quito',
  primaryColor: '#1B4F72',
  secondaryColor: '#F4D03F',
} as const;

export const DEMO_GRADES_CREDENTIALS = {
  admin: {
    email: 'admin.demo@zerocademy.edu',
    password: 'DemoAdmin123!',
  },
  teacher: {
    email: 'teacher.demo@zerocademy.edu',
    password: 'DemoTeacher123!',
  },
  representative: {
    email: 'rep.demo@zerocademy.edu',
    password: 'DemoRep123!',
    firstName: 'Carmen',
    lastName: 'Representante',
  },
  students: [
    {
      email: 'student1.demo@zerocademy.edu',
      password: 'DemoStudent123!',
      firstName: 'Ana',
      lastName: 'Demo',
      nationalId: '1710000001',
      gender: Gender.FEMALE,
      birthDate: '2012-03-15',
    },
    {
      email: 'student2.demo@zerocademy.edu',
      password: 'DemoStudent123!',
      firstName: 'Luis',
      lastName: 'Demo',
      nationalId: '1710000002',
      gender: Gender.MALE,
      birthDate: '2012-07-22',
    },
  ],
} as const;

export type DemoCourseSlot = 'current-A' | 'current-B' | 'previous-A';

/** Extra students covering remaining enrollment statuses (e2e keeps 2 ACTIVE on 8vo A). */
export const DEMO_VALIDATION_STUDENTS: ReadonlyArray<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  gender: Gender;
  birthDate: string;
  course: DemoCourseSlot;
  status: EnrollmentStatus;
}> = [
  {
    email: 'student3.demo@zerocademy.edu',
    password: 'DemoStudent123!',
    firstName: 'Carla',
    lastName: 'Retirada',
    nationalId: '1710000003',
    gender: Gender.FEMALE,
    birthDate: '2012-01-08',
    course: 'current-A',
    status: EnrollmentStatus.WITHDRAWN,
  },
  {
    email: 'student4.demo@zerocademy.edu',
    password: 'DemoStudent123!',
    firstName: 'Diego',
    lastName: 'Paralelo',
    nationalId: '1710000004',
    gender: Gender.MALE,
    birthDate: '2012-11-02',
    course: 'current-B',
    status: EnrollmentStatus.ACTIVE,
  },
  {
    email: 'student5.demo@zerocademy.edu',
    password: 'DemoStudent123!',
    firstName: 'Elena',
    lastName: 'Paralelo',
    nationalId: '1710000005',
    gender: Gender.FEMALE,
    birthDate: '2012-05-19',
    course: 'current-B',
    status: EnrollmentStatus.ACTIVE,
  },
  {
    email: 'student6.demo@zerocademy.edu',
    password: 'DemoStudent123!',
    firstName: 'Fabio',
    lastName: 'Traslado',
    nationalId: '1710000006',
    gender: Gender.MALE,
    birthDate: '2012-09-30',
    course: 'current-B',
    status: EnrollmentStatus.TRANSFERRED,
  },
  {
    email: 'student7.demo@zerocademy.edu',
    password: 'DemoStudent123!',
    firstName: 'Gabriela',
    lastName: 'Egresada',
    nationalId: '1710000007',
    gender: Gender.FEMALE,
    birthDate: '2011-04-12',
    course: 'previous-A',
    status: EnrollmentStatus.COMPLETED,
  },
  {
    email: 'student8.demo@zerocademy.edu',
    password: 'DemoStudent123!',
    firstName: 'Héctor',
    lastName: 'Reprobado',
    nationalId: '1710000008',
    gender: Gender.MALE,
    birthDate: '2011-08-27',
    course: 'previous-A',
    status: EnrollmentStatus.FAILED,
  },
];
