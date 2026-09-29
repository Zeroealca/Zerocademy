import { EvaluationTermsService } from './evaluation-terms.service';

describe('EvaluationTermsService.updateWeights', () => {
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
      service.updateWeights('institution-1', 'period-1', {
        items: [
          { id: 'term-1', weight: 60 },
          { id: 'term-2', weight: 40 },
        ],
      }),
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
      service.updateWeights('institution-1', 'period-1', {
        items: [
          { id: 'term-1', weight: 60 },
          { id: 'term-2', weight: 30 },
        ],
      }),
    ).rejects.toThrow('Evaluation term weights must sum to 100');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.evaluationTerm.update).not.toHaveBeenCalled();
  });

  it('rejects a payload that omits an active term before persisting any change', async () => {
    await expect(
      service.updateWeights('institution-1', 'period-1', {
        items: [{ id: 'term-1', weight: 100 }],
      }),
    ).rejects.toThrow(
      'Weight updates must include each active evaluation term exactly once',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.evaluationTerm.update).not.toHaveBeenCalled();
  });
});
