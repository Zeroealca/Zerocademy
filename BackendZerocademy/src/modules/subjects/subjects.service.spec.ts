import { SubjectsService } from './subjects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Role } from '@prisma/client';

describe('Subject list assignment eligibility', () => {
  it('includes system subjects without grade links alongside eligible institution subjects', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      subject: { findMany, count },
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    };
    const service = new SubjectsService(prisma as unknown as PrismaService, {} as AppLoggerService);
    await service.findAll({ page: 1, limit: 100, institutionId: 'school-a', gradeLevelId: 'grade', isActive: true, search: 'Math' });
    const where = findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual([
      { OR: [{ institutionId: 'school-a' }, { institutionId: null, isSystem: true }] },
      { OR: [{ isSystem: true }, { gradeLevelLinks: { some: { gradeLevelId: 'grade' } } }] },
    ]);
    expect(where.isActive).toBe(true);
    expect(where.OR).toHaveLength(2);
    expect(count).toHaveBeenCalledWith({ where });
  });

  it('preserves an explicit non-system filter while scoping to an institution', async () => {
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      subject: { count, findMany: jest.fn().mockResolvedValue([]) },
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    };
    const service = new SubjectsService(prisma as unknown as PrismaService, {} as AppLoggerService);
    await service.findAll({ page: 1, limit: 100, institutionId: 'school-a', isSystem: false });
    expect(count.mock.calls[0][0].where.isSystem).toBe(false);
    expect(count.mock.calls[0][0].where.AND).toHaveLength(1);
  });
});

describe('Admin subject editing scope', () => {
  const actor = { id: 'admin', role: Role.ADMIN, institutionId: 'school-a', email: 'admin@example.test', firstName: 'Admin', lastName: 'Test' };

  function setup(institutionId: string | null, isSystem = false) {
    const subject = { id: 'subject', institutionId, isSystem, name: 'Math', code: 'MATH', isActive: true, createdAt: new Date(0), updatedAt: new Date(0) };
    const update = jest.fn();
    const tx = { subject: { update, findUniqueOrThrow: jest.fn().mockResolvedValue(subject) } };
    const prisma = {
      subject: { findUnique: jest.fn().mockResolvedValue(subject) },
      institutionMembership: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback: (value: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const service = new SubjectsService(prisma as unknown as PrismaService, { log: jest.fn() } as unknown as AppLoggerService);
    return { service, update };
  }

  it('allows an admin to edit a subject in their institution', async () => {
    const { service, update } = setup('school-a');
    await service.update('subject', { name: 'New name' }, actor);
    expect(update).toHaveBeenCalled();
  });

  it('rejects editing subjects outside the admin institutions', async () => {
    const { service, update } = setup('school-b');
    await expect(service.update('subject', { name: 'New name' }, actor)).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects editing the global catalog', async () => {
    const { service, update } = setup(null, true);
    await expect(service.update('subject', { name: 'New name' }, actor)).rejects.toThrow('catálogo global');
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects promoting an institutional subject to the global catalog', async () => {
    const { service, update } = setup('school-a');
    await expect(service.update('subject', { isSystem: true }, actor)).rejects.toThrow('catálogo global');
    expect(update).not.toHaveBeenCalled();
  });
});
