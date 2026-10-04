import { BadRequestException } from '@nestjs/common';
import { assertSubLevelMatchesGradeAndIsActive } from './course.validation';

describe('assertSubLevelMatchesGradeAndIsActive', () => {
  const activeSubLevel = {
    id: 'sublevel-1',
    academicLevelId: 'level-1',
    isActive: true,
  };

  it('accepts a grade mapped to the selected active sublevel', async () => {
    const prisma = {
      subLevel: { findUnique: jest.fn().mockResolvedValue(activeSubLevel) },
      gradeLevel: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'grade-1',
          academicLevelId: 'level-1',
          subLevelId: 'sublevel-1',
        }),
      },
    };

    await expect(
      assertSubLevelMatchesGradeAndIsActive(
        prisma as never,
        'sublevel-1',
        'grade-1',
      ),
    ).resolves.toEqual(activeSubLevel);
  });

  it('rejects a grade belonging to another sublevel in the same level', async () => {
    const prisma = {
      subLevel: { findUnique: jest.fn().mockResolvedValue(activeSubLevel) },
      gradeLevel: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'grade-2',
          academicLevelId: 'level-1',
          subLevelId: 'sublevel-2',
        }),
      },
    };

    await expect(
      assertSubLevelMatchesGradeAndIsActive(
        prisma as never,
        'sublevel-1',
        'grade-2',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
