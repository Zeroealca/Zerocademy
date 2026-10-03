import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { EvaluationTermsService } from './evaluation-terms.service';

describe('EvaluationTermsService.updateWeights', () => {
  const actor = {
    id: 'admin-1',
    role: Role.ADMIN,
    institutionId: 'institution-1',
  } as AuthenticatedUser;
  const activeTerms = [
    { id: 'term-1', weight: 50 },
    { id: 'term-2', weight: 50 },
  ];
  const prisma = {
    institution: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'institution-1', isActive: true }),
    },
    academicPeriod: {
      findFirst: jest.fn().mockResolvedValue({ id: 'period-1' }),
    },
    evaluationTerm: {
      findMany: jest.fn().mockResolvedValue(activeTerms),
      create: jest.fn(),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: { weight: number };
        }) =>
          Promise.resolve({
            id: where.id,
            institutionId: 'institution-1',
            academicPeriodId: 'period-1',
            name: where.id,
            order: where.id === 'term-1' ? 1 : 2,
            weight: data.weight,
            startDate: null,
            endDate: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      ),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const logger = { log: jest.fn() };
  const service = new EvaluationTermsService(prisma as never, logger as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.institution.findUnique.mockResolvedValue({
      id: 'institution-1',
      isActive: true,
    });
    prisma.academicPeriod.findFirst.mockResolvedValue({ id: 'period-1' });
    prisma.evaluationTerm.findMany.mockResolvedValue(activeTerms);
  });

  it('updates the complete active distribution in one transaction when it totals 100', async () => {
    await expect(
      service.updateWeights(
        'institution-1',
        'period-1',
        {
          items: [
            { id: 'term-1', weight: 60 },
            { id: 'term-2', weight: 40 },
          ],
        },
        actor,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'term-1', weight: 60 }),
        expect.objectContaining({ id: 'term-2', weight: 40 }),
      ]),
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.evaluationTerm.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'term-1' },
      data: { weight: 60 },
    });
    expect(prisma.evaluationTerm.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'term-2' },
      data: { weight: 40 },
    });
  });

  it('rejects an incomplete distribution before persisting any change', async () => {
    await expect(
      service.updateWeights(
        'institution-1',
        'period-1',
        {
          items: [
            { id: 'term-1', weight: 60 },
            { id: 'term-2', weight: 30 },
          ],
        },
        actor,
      ),
    ).rejects.toThrow('Evaluation term weights must sum to 100');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.evaluationTerm.update).not.toHaveBeenCalled();
  });

  it('rejects a payload that omits an active term before persisting any change', async () => {
    await expect(
      service.updateWeights(
        'institution-1',
        'period-1',
        {
          items: [{ id: 'term-1', weight: 100 }],
        },
        actor,
      ),
    ).rejects.toThrow(
      'Weight updates must include each active evaluation term exactly once',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.evaluationTerm.update).not.toHaveBeenCalled();
  });

  it('rejects a new term that would exceed 100 before creating it', async () => {
    await expect(
      service.create(
        {
          institutionId: 'institution-1',
          academicPeriodId: 'period-1',
          name: 'Invalid extra term',
          order: 3,
          weight: 10,
        },
        actor,
      ),
    ).rejects.toThrow('Evaluation term weights must not exceed 100');

    expect(prisma.evaluationTerm.create).not.toHaveBeenCalled();
  });

  it('allows incremental create while the running total stays at or below 100', async () => {
    prisma.evaluationTerm.findMany.mockResolvedValue([]);
    prisma.evaluationTerm.create.mockResolvedValue({
      id: 'term-new',
      institutionId: 'institution-1',
      academicPeriodId: 'period-1',
      name: 'Primer quimestre',
      order: 1,
      weight: 50,
      startDate: null,
      endDate: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.create(
        {
          institutionId: 'institution-1',
          academicPeriodId: 'period-1',
          name: 'Primer quimestre',
          order: 1,
          weight: 50,
        },
        actor,
      ),
    ).resolves.toMatchObject({ id: 'term-new', weight: 50 });

    expect(prisma.evaluationTerm.create).toHaveBeenCalled();
  });
});

describe('EvaluationTermsService.reorder', () => {
  const actor = {
    id: 'admin-1',
    role: Role.ADMIN,
    institutionId: 'institution-1',
  } as AuthenticatedUser;
  const terms = [{ id: 'term-1' }, { id: 'term-2' }];
  const prisma = {
    institution: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'institution-1', isActive: true }),
    },
    academicPeriod: {
      findFirst: jest.fn().mockResolvedValue({ id: 'period-1' }),
    },
    evaluationTerm: {
      findMany: jest.fn().mockResolvedValue(terms),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: { order: number };
        }) =>
          Promise.resolve({
            id: where.id,
            institutionId: 'institution-1',
            academicPeriodId: 'period-1',
            name: where.id,
            order: data.order,
            weight: 50,
            startDate: null,
            endDate: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      ),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) =>
      callback(prisma),
    ),
  };
  const logger = { log: jest.fn() };
  const service = new EvaluationTermsService(prisma as never, logger as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.evaluationTerm.findMany.mockResolvedValue(terms);
  });

  it('reorders through temporary order values to avoid unique collisions', async () => {
    prisma.evaluationTerm.findMany
      .mockResolvedValueOnce(terms)
      .mockResolvedValueOnce([
        {
          id: 'term-2',
          institutionId: 'institution-1',
          academicPeriodId: 'period-1',
          name: 'term-2',
          order: 1,
          weight: 50,
          startDate: null,
          endDate: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'term-1',
          institutionId: 'institution-1',
          academicPeriodId: 'period-1',
          name: 'term-1',
          order: 2,
          weight: 50,
          startDate: null,
          endDate: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

    await expect(
      service.reorder(
        'institution-1',
        'period-1',
        {
          items: [
            { id: 'term-2', order: 1 },
            { id: 'term-1', order: 2 },
          ],
        },
        actor,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'term-2', order: 1 }),
        expect.objectContaining({ id: 'term-1', order: 2 }),
      ]),
    );

    expect(prisma.evaluationTerm.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'term-2' },
      data: { order: 10_000 },
    });
    expect(prisma.evaluationTerm.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'term-1' },
      data: { order: 10_001 },
    });
    expect(prisma.evaluationTerm.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'term-2' },
      data: { order: 1 },
    });
    expect(prisma.evaluationTerm.update).toHaveBeenNthCalledWith(4, {
      where: { id: 'term-1' },
      data: { order: 2 },
    });
  });
});
