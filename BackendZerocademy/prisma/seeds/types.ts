import type { Prisma, PrismaClient } from '@prisma/client';

/** Full client or interactive transaction client (model delegates only). */
export type SeedPrismaClient = PrismaClient | Prisma.TransactionClient;

export interface SeedContext {
  prisma: SeedPrismaClient;
  /** When true, logs actions without writing to the database. */
  dryRun?: boolean;
}

export interface SeedCounters {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface SeedStepResult extends SeedCounters {
  step: string;
}

export interface SeedRunSummary {
  steps: SeedStepResult[];
  totals: SeedCounters;
  durationMs: number;
}

export interface AcademicLevelSeedRow {
  code: string;
  name: string;
  order: number;
  description?: string;
}

export interface GradeLevelSeedRow {
  code: string;
  name: string;
  order: number;
  description?: string;
}

export interface SubjectSeedRow {
  code: string;
  name: string;
  description?: string;
}

export interface SubjectAssignmentSeedRow {
  subjectCode: string;
  gradeLevelCodes: string[];
}
