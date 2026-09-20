import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type { ReportCardResponseDto } from './dto/report-card-response.dto';
import { ReportCardsPdfService } from './report-cards-pdf.service';
import { ReportCardsService } from './report-cards.service';

const actor: AuthenticatedUser = {
  id: 'user-1',
  email: 'student@example.test',
  firstName: 'Student',
  lastName: 'One',
  role: Role.STUDENT,
  profileId: 'student-1',
  profileType: 'student',
};

const reportCard: ReportCardResponseDto = {
  enrollmentId: 'enrollment-1',
  student: {
    id: 'student-1',
    fullName: 'Estudiante Prueba',
    nationalId: '0102030405',
    registrationNumber: null,
  },
  institution: {
    id: 'institution-1',
    name: 'Unidad Educativa Prueba',
    logoUrl: null,
    primaryColor: '#1f4f73',
    secondaryColor: null,
  },
  academicPeriod: {
    id: 'period-1',
    name: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
  },
  enrollment: {
    courseId: 'course-1',
    courseName: 'Décimo A',
    section: 'A',
    gradeLevelName: 'Décimo',
  },
  subjects: [
    {
      id: 'subject-1',
      name: 'Matemática',
      code: 'MAT',
      terms: [
        {
          id: 'term-1',
          name: 'Primer parcial',
          order: 1,
          average: 9.2,
          qualitativeResult: { code: 'DA', description: 'Domina' },
        },
      ],
      average: 9.2,
      qualitativeResult: { code: 'DA', description: 'Domina' },
    },
  ],
  overallAverage: 9.2,
  overallQualitativeResult: { code: 'DA', description: 'Domina' },
};

describe('ReportCardsPdfService', () => {
  it('renders a non-empty PDF from the existing report-card response', async () => {
    const reportCardsService = {
      getMyReportCard: jest.fn().mockResolvedValue(reportCard),
    } as unknown as ReportCardsService;
    const service = new ReportCardsPdfService(
      reportCardsService,
      { get: jest.fn().mockReturnValue('uploads') } as never,
      { log: jest.fn(), error: jest.fn() } as never,
    );

    const pdf = await service.getMyPdf(actor, { academicPeriodId: 'period-1' });

    expect(pdf.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.buffer.length).toBeGreaterThan(500);
    expect(pdf.filename).toBe('report-card-estudiante-prueba-2026-2027.pdf');
  });
});
