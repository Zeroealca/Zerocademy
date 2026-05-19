import type { SeedContext, SeedStepResult, SubjectAssignmentSeedRow } from './types';
import { seedLog, seedWarn } from './seed-logger';
import { emptyCounters } from './seed-summary';

export async function seedSubjectAssignments(
  ctx: SeedContext,
  rows: SubjectAssignmentSeedRow[],
  options?: {
    catalogKey?: string;
    expectedSubjectCodes?: Set<string>;
    expectedGradeCodes?: Set<string>;
  },
): Promise<SeedStepResult> {
  const counters = emptyCounters();
  const catalogKey = options?.catalogKey ?? 'default';

  const gradeLevels = await ctx.prisma.gradeLevel.findMany({
    where: { institutionId: null, isSystem: true },
    select: { id: true, code: true },
  });

  const gradeByCode = new Map(gradeLevels.map((grade) => [grade.code, grade.id]));

  const subjects = await ctx.prisma.subject.findMany({
    where: { isSystem: true },
    select: { id: true, code: true },
  });

  const subjectByCode = new Map(
    subjects.map((subject) => [subject.code, subject.id]),
  );

  for (const assignment of rows) {
    const subjectId = subjectByCode.get(assignment.subjectCode);

    if (!subjectId) {
      if (ctx.dryRun && options?.expectedSubjectCodes?.has(assignment.subjectCode)) {
        for (const gradeCode of assignment.gradeLevelCodes) {
          if (
            options.expectedGradeCodes?.has(gradeCode) ||
            gradeByCode.has(gradeCode)
          ) {
            counters.inserted += 1;
          } else {
            counters.skipped += 1;
          }
        }
        continue;
      }

      seedWarn({
        event: 'SUBJECT_ASSIGNMENT_SUBJECT_MISSING',
        message: 'Skipping assignments: subject not found in catalog',
        metadata: { subjectCode: assignment.subjectCode, catalogKey },
      });
      counters.skipped += assignment.gradeLevelCodes.length;
      continue;
    }

    for (const gradeCode of assignment.gradeLevelCodes) {
      const gradeLevelId = gradeByCode.get(gradeCode);

      if (!gradeLevelId) {
        if (ctx.dryRun && options?.expectedGradeCodes?.has(gradeCode)) {
          counters.inserted += 1;
          continue;
        }

        seedWarn({
          event: 'SUBJECT_ASSIGNMENT_GRADE_MISSING',
          message: 'Skipping link: grade level not found',
          metadata: {
            subjectCode: assignment.subjectCode,
            gradeCode,
            catalogKey,
          },
        });
        counters.skipped += 1;
        continue;
      }

      const existing = await ctx.prisma.subjectGradeLevel.findUnique({
        where: {
          subjectId_gradeLevelId: { subjectId, gradeLevelId },
        },
      });

      if (existing) {
        counters.skipped += 1;
        seedLog({
          event: 'SUBJECT_ASSIGNMENT_SKIPPED',
          message: 'Subject-grade link already exists',
          metadata: {
            subjectCode: assignment.subjectCode,
            gradeCode,
            catalogKey,
          },
        });
        continue;
      }

      if (ctx.dryRun) {
        counters.inserted += 1;
        continue;
      }

      await ctx.prisma.subjectGradeLevel.create({
        data: { subjectId, gradeLevelId },
      });

      counters.inserted += 1;
      seedLog({
        event: 'SUBJECT_ASSIGNMENT_INSERTED',
        message: 'Subject linked to grade level',
        metadata: {
          subjectCode: assignment.subjectCode,
          gradeCode,
          catalogKey,
        },
      });
    }
  }

  return { step: 'subject-assignments', ...counters };
}
