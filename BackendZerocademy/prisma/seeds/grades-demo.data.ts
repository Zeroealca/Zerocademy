/** Stable identifiers for grades demo seed and e2e tests. */
export const DEMO_GRADES_INSTITUTION_CODE = 'demo-grades';

export const DEMO_GRADES_CREDENTIALS = {
  admin: {
    email: 'admin.demo@zerocademy.edu',
    password: 'DemoAdmin123!',
  },
  teacher: {
    email: 'teacher.demo@zerocademy.edu',
    password: 'DemoTeacher123!',
  },
  students: [
    {
      email: 'student1.demo@zerocademy.edu',
      password: 'DemoStudent123!',
      firstName: 'Ana',
      lastName: 'Demo',
    },
    {
      email: 'student2.demo@zerocademy.edu',
      password: 'DemoStudent123!',
      firstName: 'Luis',
      lastName: 'Demo',
    },
  ],
} as const;

export const DEMO_GRADES_ASSESSMENT_TITLE = 'Demo Unit 1 Exam';
