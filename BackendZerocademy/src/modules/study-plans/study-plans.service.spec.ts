import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AcademicPeriodStatus,
  OfficialStudyPlanStatus,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { StudyPlansService } from './study-plans.service';

jest.mock('../../common/rbac/academic-scope.util', () => ({
  assertActorCanAccessInstitution: jest.fn().mockResolvedValue(undefined),
}));

const admin: AuthenticatedUser = {
  id: 'admin-a', email: 'admin@example.test', firstName: 'Admin', lastName: 'A',
  role: Role.ADMIN, profileId: 'admin-profile', institutionId: 'institution-a',
};
const plan = {
  id: 'plan-a', status: OfficialStudyPlanStatus.ACTIVE,
  applicabilityKey: 'ORDINARY_EGB', effectiveFrom: new Date('2023-03-10'), effectiveTo: null,
};

describe('StudyPlansService adoption contract', () => {
  const prisma = {
    academicPeriod: { findUnique: jest.fn() },
    officialStudyPlan: { findUnique: jest.fn(), findMany: jest.fn() },
    institutionStudyPlanAdoption: { create: jest.fn(), findMany: jest.fn() },
  };
  const logger = { log: jest.fn() };
  const permissionEnforcer = { requireForInstitutionMembership: jest.fn().mockResolvedValue(undefined) };
  let service: StudyPlansService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.academicPeriod.findUnique.mockResolvedValue({ id: 'period-a', institutionId: 'institution-a', status: AcademicPeriodStatus.PLANNED, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') });
    prisma.officialStudyPlan.findUnique.mockResolvedValue(plan);
    prisma.institutionStudyPlanAdoption.create.mockResolvedValue({ id: 'adoption-a', institutionId: 'institution-a', academicPeriodId: 'period-a', officialStudyPlanId: 'plan-a', applicabilityKey: 'ORDINARY_EGB', adoptedByUserId: 'admin-a', adoptedAt: new Date('2026-01-01') });
    service = new StudyPlansService(prisma as unknown as PrismaService, logger as unknown as AppLoggerService, permissionEnforcer as never);
  });

  it('allows an ADMIN to adopt an active applicable plan for a planned period', async () => {
    await expect(service.adopt(admin, 'institution-a', 'period-a', { officialStudyPlanId: 'plan-a' })).resolves.toMatchObject({ id: 'adoption-a', applicabilityKey: 'ORDINARY_EGB' });
    expect(prisma.institutionStudyPlanAdoption.create).toHaveBeenCalledWith({ data: expect.objectContaining({ institutionId: 'institution-a', academicPeriodId: 'period-a', officialStudyPlanId: 'plan-a', adoptedByUserId: 'admin-a' }) });
  });

  it.each([AcademicPeriodStatus.CLOSED, AcademicPeriodStatus.ARCHIVED])('rejects adoption for a %s period', async (status) => {
    prisma.academicPeriod.findUnique.mockResolvedValueOnce({ id: 'period-a', institutionId: 'institution-a', status, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') });
    await expect(service.adopt(admin, 'institution-a', 'period-a', { officialStudyPlanId: 'plan-a' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.institutionStudyPlanAdoption.create).not.toHaveBeenCalled();
  });

  it('rejects an academic period owned by another institution', async () => {
    prisma.academicPeriod.findUnique.mockResolvedValueOnce({ id: 'period-b', institutionId: 'institution-b', status: AcademicPeriodStatus.PLANNED, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') });
    await expect(service.adopt(admin, 'institution-a', 'period-b', { officialStudyPlanId: 'plan-a' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a superseded plan and an effective-date mismatch', async () => {
    prisma.officialStudyPlan.findUnique.mockResolvedValueOnce({ ...plan, status: OfficialStudyPlanStatus.SUPERSEDED });
    await expect(service.adopt(admin, 'institution-a', 'period-a', { officialStudyPlanId: 'plan-a' })).rejects.toBeInstanceOf(BadRequestException);
    prisma.officialStudyPlan.findUnique.mockResolvedValueOnce({ ...plan, effectiveFrom: new Date('2027-01-01') });
    await expect(service.adopt(admin, 'institution-a', 'period-a', { officialStudyPlanId: 'plan-a' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps a uniqueness violation to a non-mutating adoption error', async () => {
    prisma.institutionStudyPlanAdoption.create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(service.adopt(admin, 'institution-a', 'period-a', { officialStudyPlanId: 'plan-a' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([Role.TEACHER, Role.STUDENT, Role.REPRESENTATIVE, Role.SUPER_ADMIN])('denies %s institutional adoption', async (role) => {
    await expect(service.adopt({ ...admin, role }, 'institution-a', 'period-a', { officialStudyPlanId: 'plan-a' })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.institutionStudyPlanAdoption.create).not.toHaveBeenCalled();
  });
});
