import { Injectable } from '@nestjs/common';
import { ScheduleBlockKind } from '@prisma/client';
import {
  TimetableConflictCode,
  TimetableConflictSeverity,
  type TimetableCandidateSlot,
  type TimetableConflict,
  type TimetableConflictAssignment,
  type TimetableConflictValidationInput,
  type TimetableConflictValidationResult,
  TimetableValidationMode,
} from './timetable-conflict.types';

type ValidCandidate = TimetableCandidateSlot & {
  assignment: TimetableConflictAssignment;
};

const conflictOrder: Record<TimetableConflictCode, number> = {
  [TimetableConflictCode.CONTEXT_MISMATCH]: 0,
  [TimetableConflictCode.INVALID_BLOCK]: 1,
  [TimetableConflictCode.INVALID_DAY]: 2,
  [TimetableConflictCode.DUPLICATE_CANDIDATE]: 3,
  [TimetableConflictCode.TEACHER_CONFLICT]: 4,
  [TimetableConflictCode.COURSE_CONFLICT]: 5,
  [TimetableConflictCode.MISSING_TEACHING_LOAD]: 6,
  [TimetableConflictCode.LOAD_OVERSATISFIED]: 7,
  [TimetableConflictCode.LOAD_UNSATISFIED]: 8,
};

/**
 * Pure hard-constraint validator for an already normalized timetable proposal.
 * Persistence, authorization and client input normalization intentionally belong
 * to its callers so generation and manual editing can reuse the same core.
 */
@Injectable()
export class TimetableConflictEngine {
  validate(
    input: TimetableConflictValidationInput,
  ): TimetableConflictValidationResult {
    const conflicts: TimetableConflict[] = [];
    const assignments = new Map(
      input.assignments.map((assignment) => [assignment.id, assignment]),
    );
    const blocks = new Map(
      input.scheduleBlocks.map((block) => [block.id, block]),
    );
    const loads = new Map(
      input.teachingLoads.map((load) => [load.teacherAssignmentId, load]),
    );
    const enabledWeekdays = new Set(input.context.enabledWeekdays);
    const candidates = [...input.candidates].sort((left, right) =>
      left.id.localeCompare(right.id),
    );

    if (
      input.context.timetable &&
      (input.context.timetable.institutionId !== input.context.institutionId ||
        input.context.timetable.academicPeriodId !==
          input.context.academicPeriodId)
    ) {
      conflicts.push(
        this.conflict(
          TimetableConflictCode.CONTEXT_MISMATCH,
          'Timetable does not belong to the requested institution and academic period',
          { affectedCandidateIds: [] },
        ),
      );
    }

    const duplicateKeys = new Set<string>();
    const validCandidates: ValidCandidate[] = [];
    const candidateAssignmentIds = new Set<string>();

    for (const candidate of candidates) {
      candidateAssignmentIds.add(candidate.teacherAssignmentId);
      const assignment = assignments.get(candidate.teacherAssignmentId);
      let valid = true;
      if (
        !assignment ||
        assignment.institutionId !== input.context.institutionId ||
        assignment.academicPeriodId !== input.context.academicPeriodId
      ) {
        conflicts.push(
          this.conflict(
            TimetableConflictCode.CONTEXT_MISMATCH,
            'TeacherAssignment does not belong to the requested scheduling context',
            {
              affectedCandidateIds: [candidate.id],
              teacherAssignmentIds: [candidate.teacherAssignmentId],
            },
          ),
        );
        valid = false;
      }
      const block = blocks.get(candidate.scheduleBlockId);
      if (
        !block ||
        block.periodScheduleStructureId !==
          input.context.periodScheduleStructureId ||
        block.kind !== ScheduleBlockKind.TEACHING
      ) {
        conflicts.push(
          this.conflict(
            TimetableConflictCode.INVALID_BLOCK,
            'Schedule block must be a teaching block in the selected schedule structure',
            {
              affectedCandidateIds: [candidate.id],
              teacherAssignmentIds: [candidate.teacherAssignmentId],
              scheduleBlockId: candidate.scheduleBlockId,
              weekday: candidate.weekday,
            },
          ),
        );
        valid = false;
      }
      if (!enabledWeekdays.has(candidate.weekday)) {
        conflicts.push(
          this.conflict(
            TimetableConflictCode.INVALID_DAY,
            'Weekday is not enabled in the selected schedule structure',
            {
              affectedCandidateIds: [candidate.id],
              teacherAssignmentIds: [candidate.teacherAssignmentId],
              scheduleBlockId: candidate.scheduleBlockId,
              weekday: candidate.weekday,
            },
          ),
        );
        valid = false;
      }

      const duplicateKey = [
        candidate.teacherAssignmentId,
        candidate.weekday,
        candidate.scheduleBlockId,
      ].join('|');
      if (duplicateKeys.has(duplicateKey)) {
        conflicts.push(
          this.conflict(
            TimetableConflictCode.DUPLICATE_CANDIDATE,
            'Duplicate candidate does not create another timetable placement',
            {
              affectedCandidateIds: [candidate.id],
              teacherAssignmentIds: [candidate.teacherAssignmentId],
              scheduleBlockId: candidate.scheduleBlockId,
              weekday: candidate.weekday,
            },
          ),
        );
        valid = false;
      } else {
        duplicateKeys.add(duplicateKey);
      }
      if (valid && assignment)
        validCandidates.push({ ...candidate, assignment });
    }

    this.addOccupancyConflicts(validCandidates, conflicts);
    this.addLoadConflicts(
      input.mode,
      validCandidates,
      candidateAssignmentIds,
      assignments,
      loads,
      conflicts,
    );

    const orderedConflicts = conflicts.sort((left, right) =>
      this.compareConflicts(left, right),
    );
    return {
      valid: orderedConflicts.length === 0,
      mode: input.mode,
      conflicts: orderedConflicts,
    };
  }

  private addOccupancyConflicts(
    candidates: ValidCandidate[],
    conflicts: TimetableConflict[],
  ): void {
    const byTeacher = new Map<string, ValidCandidate[]>();
    const byCourse = new Map<string, ValidCandidate[]>();
    for (const candidate of candidates) {
      const location = `${candidate.weekday}|${candidate.scheduleBlockId}`;
      this.addToGroup(
        byTeacher,
        `${candidate.assignment.teacherId}|${location}`,
        candidate,
      );
      this.addToGroup(
        byCourse,
        `${candidate.assignment.courseId}|${location}`,
        candidate,
      );
    }
    for (const group of byTeacher.values()) {
      if (group.length > 1)
        conflicts.push(
          this.conflict(
            TimetableConflictCode.TEACHER_CONFLICT,
            'Teacher is assigned to more than one candidate in the same time block',
            this.groupDetails(group),
          ),
        );
    }
    for (const group of byCourse.values()) {
      if (group.length > 1)
        conflicts.push(
          this.conflict(
            TimetableConflictCode.COURSE_CONFLICT,
            'Course is assigned to more than one candidate in the same time block',
            this.groupDetails(group),
          ),
        );
    }
  }

  private addLoadConflicts(
    mode: TimetableValidationMode,
    candidates: ValidCandidate[],
    candidateAssignmentIds: Set<string>,
    assignments: Map<string, TimetableConflictAssignment>,
    loads: Map<string, { teacherAssignmentId: string; weeklyPeriods: number }>,
    conflicts: TimetableConflict[],
  ): void {
    const counts = new Map<string, number>();
    for (const candidate of candidates)
      counts.set(
        candidate.teacherAssignmentId,
        (counts.get(candidate.teacherAssignmentId) ?? 0) + 1,
      );
    for (const assignmentId of [...candidateAssignmentIds].sort()) {
      const assignment = assignments.get(assignmentId);
      if (!assignment || loads.has(assignmentId)) continue;
      conflicts.push(
        this.conflict(
          TimetableConflictCode.MISSING_TEACHING_LOAD,
          'TeacherAssignment has no configured operational TeachingLoad',
          {
            teacherAssignmentIds: [assignmentId],
            courseIds: [assignment.courseId],
            actualWeeklyPeriods: counts.get(assignmentId) ?? 0,
          },
        ),
      );
    }
    for (const [assignmentId, load] of [...loads.entries()].sort(
      ([left], [right]) => left.localeCompare(right),
    )) {
      const actual = counts.get(assignmentId) ?? 0;
      const assignment = assignments.get(assignmentId);
      const details = {
        teacherAssignmentIds: [assignmentId],
        courseIds: assignment ? [assignment.courseId] : [],
        expectedWeeklyPeriods: load.weeklyPeriods,
        actualWeeklyPeriods: actual,
      };
      if (actual > load.weeklyPeriods)
        conflicts.push(
          this.conflict(
            TimetableConflictCode.LOAD_OVERSATISFIED,
            'Candidate slots exceed the configured weekly teaching load',
            details,
          ),
        );
      if (
        mode === TimetableValidationMode.COMPLETE &&
        actual < load.weeklyPeriods
      )
        conflicts.push(
          this.conflict(
            TimetableConflictCode.LOAD_UNSATISFIED,
            'Candidate slots do not satisfy the configured weekly teaching load',
            details,
          ),
        );
    }
  }

  private addToGroup(
    groups: Map<string, ValidCandidate[]>,
    key: string,
    candidate: ValidCandidate,
  ): void {
    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }

  private groupDetails(candidates: ValidCandidate[]) {
    const first = candidates[0];
    return {
      affectedCandidateIds: candidates.map((candidate) => candidate.id).sort(),
      teacherAssignmentIds: candidates
        .map((candidate) => candidate.teacherAssignmentId)
        .sort(),
      courseIds: [
        ...new Set(
          candidates.map((candidate) => candidate.assignment.courseId),
        ),
      ].sort(),
      weekday: first.weekday,
      scheduleBlockId: first.scheduleBlockId,
    };
  }

  private conflict(
    code: TimetableConflictCode,
    message: string,
    details: Partial<
      Omit<TimetableConflict, 'code' | 'severity' | 'message'>
    > = {},
  ): TimetableConflict {
    return {
      code,
      severity: TimetableConflictSeverity.ERROR,
      message,
      affectedCandidateIds: [...(details.affectedCandidateIds ?? [])].sort(),
      teacherAssignmentIds: [...(details.teacherAssignmentIds ?? [])].sort(),
      courseIds: [...(details.courseIds ?? [])].sort(),
      weekday: details.weekday ?? null,
      scheduleBlockId: details.scheduleBlockId ?? null,
      expectedWeeklyPeriods: details.expectedWeeklyPeriods ?? null,
      actualWeeklyPeriods: details.actualWeeklyPeriods ?? null,
    };
  }

  private compareConflicts(
    left: TimetableConflict,
    right: TimetableConflict,
  ): number {
    return (
      conflictOrder[left.code] - conflictOrder[right.code] ||
      left.teacherAssignmentIds
        .join('|')
        .localeCompare(right.teacherAssignmentIds.join('|')) ||
      left.courseIds.join('|').localeCompare(right.courseIds.join('|')) ||
      (left.weekday ?? '').localeCompare(right.weekday ?? '') ||
      (left.scheduleBlockId ?? '').localeCompare(right.scheduleBlockId ?? '') ||
      left.affectedCandidateIds
        .join('|')
        .localeCompare(right.affectedCandidateIds.join('|'))
    );
  }
}
