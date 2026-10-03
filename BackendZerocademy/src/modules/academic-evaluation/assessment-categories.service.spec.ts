import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AssessmentCategoriesService } from './assessment-categories.service';

describe('AssessmentCategoriesService weight validation', () => {
  const actor = {
    id: 'admin-1',
    role: Role.ADMIN,
    institutionId: 'institution-1',
  } as AuthenticatedUser;
  const activeCategories = [
    { id: 'category-1', weight: 70 },
    { id: 'category-2', weight: 30 },
  ];
  const prisma = {
    institution: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'institution-1', isActive: true }),
    },
    assessmentCategory: {
      findMany: jest.fn().mockResolvedValue(activeCategories),
      findUnique: jest.fn().mockResolvedValue({
        id: 'category-1',
        institutionId: 'institution-1',
        isActive: true,
      }),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const logger = { log: jest.fn() };
  const service = new AssessmentCategoriesService(
    prisma as never,
    logger as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.institution.findUnique.mockResolvedValue({
      id: 'institution-1',
      isActive: true,
    });
    prisma.assessmentCategory.findMany.mockResolvedValue(activeCategories);
    prisma.assessmentCategory.findUnique.mockResolvedValue({
      id: 'category-1',
      institutionId: 'institution-1',
      isActive: true,
    });
  });

  it('rejects an additional category that would exceed 100 before creating it', async () => {
    await expect(
      service.create(
        {
          institutionId: 'institution-1',
          name: 'Invalid extra category',
          weight: 10,
        },
        actor,
      ),
    ).rejects.toThrow('Assessment category weights must not exceed 100');

    expect(prisma.assessmentCategory.create).not.toHaveBeenCalled();
  });

  it('allows incremental create while the running total stays at or below 100', async () => {
    prisma.assessmentCategory.findMany.mockResolvedValue([]);
    prisma.assessmentCategory.create.mockResolvedValue({
      id: 'category-new',
      institutionId: 'institution-1',
      name: 'TAI',
      weight: 30,
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.create(
        {
          institutionId: 'institution-1',
          name: 'TAI',
          weight: 30,
        },
        actor,
      ),
    ).resolves.toMatchObject({ id: 'category-new', weight: 30 });

    expect(prisma.assessmentCategory.create).toHaveBeenCalled();
  });

  it('rejects an invalid category update before persisting it', async () => {
    await expect(
      service.update('category-1', { weight: 60 }, actor),
    ).rejects.toThrow('Assessment category weights must sum to 100');

    expect(prisma.assessmentCategory.update).not.toHaveBeenCalled();
  });
});
