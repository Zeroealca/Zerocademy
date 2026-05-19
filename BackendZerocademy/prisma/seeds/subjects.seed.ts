import type { SeedContext, SeedStepResult, SubjectSeedRow } from './types';
import { seedLog } from './seed-logger';
import { emptyCounters } from './seed-summary';

function normalizeSubjectCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function seedSubjects(
  ctx: SeedContext,
  rows: SubjectSeedRow[],
  options?: { catalogKey?: string },
): Promise<SeedStepResult> {
  const counters = emptyCounters();
  const catalogKey = options?.catalogKey ?? 'default';

  for (const row of rows) {
    const code = normalizeSubjectCode(row.code);
    const existing = await ctx.prisma.subject.findUnique({
      where: { code },
    });

    if (ctx.dryRun) {
      if (existing) {
        counters.updated += 1;
      } else {
        counters.inserted += 1;
      }
      continue;
    }

    if (existing) {
      await ctx.prisma.subject.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          description: row.description,
          isSystem: true,
          isActive: true,
        },
      });
      counters.updated += 1;
      seedLog({
        event: 'SUBJECT_UPDATED',
        message: 'Subject catalog row updated',
        metadata: { subjectId: existing.id, code, catalogKey },
      });
    } else {
      const created = await ctx.prisma.subject.create({
        data: {
          name: row.name,
          code,
          description: row.description,
          isSystem: true,
          isActive: true,
        },
      });
      counters.inserted += 1;
      seedLog({
        event: 'SUBJECT_INSERTED',
        message: 'Subject catalog row inserted',
        metadata: { subjectId: created.id, code, catalogKey },
      });
    }
  }

  return { step: 'subjects', ...counters };
}
