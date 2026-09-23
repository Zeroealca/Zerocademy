import { Role } from '@prisma/client';
import { GradeScalesService } from './grade-scales.service';

const actor = {
  id: 'admin-1', email: 'admin@example.test', role: Role.ADMIN,
  firstName: 'Admin', lastName: 'Test', institutionId: 'institution-1',
};
const complete = {
  scales: [
    { code: 'NAAR', description: 'No alcanza', minValue: 0, maxValue: 6.99, order: 1 },
    { code: 'AAR', description: 'Alcanza', minValue: 7, maxValue: 10, order: 2 },
  ],
};

describe('GradeScalesService.replaceAll', () => {
  const scheme = { id: 'scheme-1', institutionId: 'institution-1', minScore: 0, maxScore: 10 };
  const transaction = {
    gradeScale: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const prisma = {
    gradingScheme: { findUnique: jest.fn().mockResolvedValue(scheme) },
    $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  };
  const logger = { log: jest.fn() };
  const service = new GradeScalesService(prisma as never, logger as never);

  beforeEach(() => jest.clearAllMocks());

  it('replaces all rows inside one transaction for a complete set', async () => {
    await expect(service.replaceAll('scheme-1', complete, actor)).resolves.toEqual([]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.gradeScale.deleteMany).toHaveBeenCalledWith({ where: { gradingSchemeId: 'scheme-1' } });
    expect(transaction.gradeScale.createMany).toHaveBeenCalledWith({ data: [
      { ...complete.scales[0], gradingSchemeId: 'scheme-1' },
      { ...complete.scales[1], gradingSchemeId: 'scheme-1' },
    ] });
  });

  it('does not start a transaction when bands leave a gap', async () => {
    const invalid = { scales: [{ ...complete.scales[0], maxValue: 6.98 }, complete.scales[1]] };
    await expect(service.replaceAll('scheme-1', invalid, actor)).rejects.toThrow(/gap/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
