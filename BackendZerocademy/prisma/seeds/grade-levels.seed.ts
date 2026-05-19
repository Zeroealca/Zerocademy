import type { GradeLevelSeedRow, SeedContext, SeedStepResult } from './types';
import { seedLog, seedWarn } from './seed-logger';
import { emptyCounters } from './seed-summary';

export async function seedGradeLevels(
  ctx: SeedContext,
  gradesByLevelCode: Record<string, GradeLevelSeedRow[]>,
  options?: { catalogKey?: string; expectedLevelCodes?: Set<string> },
): Promise<SeedStepResult> {
  const counters = emptyCounters();
  const catalogKey = options?.catalogKey ?? 'default';

  for (const [levelCode, grades] of Object.entries(gradesByLevelCode)) {
    const parent = await ctx.prisma.academicLevel.findFirst({
      where: { code: levelCode, institutionId: null },
    });

    if (!parent) {
      if (ctx.dryRun && options?.expectedLevelCodes?.has(levelCode)) {
        for (const grade of grades) {
          counters.inserted += 1;
        }
        continue;
      }

      seedWarn({
        event: 'GRADE_LEVEL_PARENT_MISSING',
        message: 'Skipping grades: parent academic level not found',
        metadata: { levelCode, catalogKey },
      });
      counters.skipped += grades.length;
      continue;
    }

    for (const grade of grades) {
      const existing = await ctx.prisma.gradeLevel.findUnique({
        where: {
          academicLevelId_code: {
            academicLevelId: parent.id,
            code: grade.code,
          },
        },
      });

      if (ctx.dryRun) {
        if (existing) {
          counters.updated += 1;
        } else {
          counters.inserted += 1;
        }
        continue;
      }

      const record = await ctx.prisma.gradeLevel.upsert({
        where: {
          academicLevelId_code: {
            academicLevelId: parent.id,
            code: grade.code,
          },
        },
        create: {
          name: grade.name,
          code: grade.code,
          order: grade.order,
          description: grade.description,
          academicLevelId: parent.id,
          isSystem: true,
          isActive: true,
          institutionId: null,
        },
        update: {
          name: grade.name,
          order: grade.order,
          description: grade.description,
          isSystem: true,
          isActive: true,
        },
      });

      if (existing) {
        counters.updated += 1;
        seedLog({
          event: 'GRADE_LEVEL_UPDATED',
          message: 'Grade level catalog row updated',
          metadata: {
            gradeLevelId: record.id,
            code: grade.code,
            levelCode,
            catalogKey,
          },
        });
      } else {
        counters.inserted += 1;
        seedLog({
          event: 'GRADE_LEVEL_INSERTED',
          message: 'Grade level catalog row inserted',
          metadata: {
            gradeLevelId: record.id,
            code: grade.code,
            levelCode,
            catalogKey,
          },
        });
      }
    }
  }

  return { step: 'grade-levels', ...counters };
}
