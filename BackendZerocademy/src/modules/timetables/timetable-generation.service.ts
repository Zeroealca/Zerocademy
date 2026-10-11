import { Injectable } from '@nestjs/common';
import { ScheduleBlockKind, Weekday } from '@prisma/client';
import { TimetableConflictEngine } from './timetable-conflict-engine.service';
import {
  TimetableValidationMode,
  type TimetableCandidateSlot,
  type TimetableConflictValidationInput,
  type TimetableConflictValidationResult,
} from './timetable-conflict.types';
import {
  TimetableGenerationDiagnosticCode,
  TimetableGenerationStatus,
  type TimetableGenerationAssignment,
  type TimetableGenerationDiagnostic,
  type TimetableGenerationInput,
  type TimetableGenerationResult,
  type TimetableGenerationScheduleBlock,
} from './timetable-generation.types';

const DEFAULT_MAX_SEARCH_NODES = 100_000;
const weekdayOrder: Record<Weekday, number> = {
  [Weekday.MON]: 0,
  [Weekday.TUE]: 1,
  [Weekday.WED]: 2,
  [Weekday.THU]: 3,
  [Weekday.FRI]: 4,
};

type Requirement = { assignmentId: string; ordinal: number };
type SearchState = {
  slots: TimetableCandidateSlot[];
  teacherOccupancy: Set<string>;
  courseOccupancy: Set<string>;
  assignmentOccupancy: Set<string>;
  nodes: number;
  backtracks: number;
  limitReached: boolean;
};

/**
 * Pure deterministic timetable CSP solver. Callers must authorize and load the
 * trusted, normalized scheduling context; this service never reads or writes Prisma.
 */
@Injectable()
export class TimetableGenerationService {
  constructor(private readonly conflictEngine: TimetableConflictEngine) {}

  generate(input: TimetableGenerationInput): TimetableGenerationResult {
    const diagnostics = this.validateConfiguration(input);
    const requirements = this.buildRequirements(input);
    const initialStatistics = {
      searchNodesExplored: 0,
      backtracks: 0,
      requirements: requirements.length,
      generatedSlots: 0,
    };
    if (diagnostics.length)
      return this.result(
        input,
        TimetableGenerationStatus.INVALID_CONFIGURATION,
        [],
        diagnostics,
        null,
        initialStatistics,
      );

    const assignments = new Map(
      input.assignments.map((item) => [item.id, item]),
    );
    const teachingBlocks = input.scheduleBlocks
      .filter((block) => block.kind === ScheduleBlockKind.TEACHING)
      .sort(
        (left, right) =>
          left.position - right.position || left.id.localeCompare(right.id),
      );
    const weekdays = [...input.context.enabledWeekdays].sort(
      (left, right) => weekdayOrder[left] - weekdayOrder[right],
    );
    const positions = weekdays.flatMap((weekday) =>
      teachingBlocks.map((block) => ({ weekday, scheduleBlockId: block.id })),
    );
    const capacityDiagnostics = this.capacityDiagnostics(
      input,
      assignments,
      positions.length,
    );
    if (capacityDiagnostics.length)
      return this.result(
        input,
        TimetableGenerationStatus.UNSATISFIABLE,
        [],
        capacityDiagnostics,
        null,
        initialStatistics,
      );

    const maxSearchNodes =
      input.options?.maxSearchNodes ?? DEFAULT_MAX_SEARCH_NODES;
    const state: SearchState = {
      slots: [],
      teacherOccupancy: new Set(),
      courseOccupancy: new Set(),
      assignmentOccupancy: new Set(),
      nodes: 0,
      backtracks: 0,
      limitReached: false,
    };
    const solved = this.search(
      input,
      assignments,
      positions,
      requirements,
      state,
      maxSearchNodes,
    );
    const statistics = {
      searchNodesExplored: state.nodes,
      backtracks: state.backtracks,
      requirements: requirements.length,
      generatedSlots: solved ? state.slots.length : 0,
    };
    if (!solved) {
      const code = state.limitReached
        ? TimetableGenerationDiagnosticCode.SEARCH_NODE_LIMIT_REACHED
        : TimetableGenerationDiagnosticCode.NO_FEASIBLE_TIMETABLE;
      return this.result(
        input,
        state.limitReached
          ? TimetableGenerationStatus.SEARCH_LIMIT_REACHED
          : TimetableGenerationStatus.UNSATISFIABLE,
        [],
        [
          this.diagnostic(
            code,
            state.limitReached
              ? 'The deterministic search-node budget was exhausted'
              : 'No timetable satisfies the modeled hard constraints',
          ),
        ],
        null,
        statistics,
      );
    }
    const validation = this.conflictEngine.validate(
      this.validationInput(
        input,
        state.slots,
        TimetableValidationMode.COMPLETE,
      ),
    );
    if (!validation.valid)
      return this.result(
        input,
        TimetableGenerationStatus.UNSATISFIABLE,
        [],
        validation.conflicts.map((conflict) =>
          this.diagnostic(
            TimetableGenerationDiagnosticCode.AUTHORITATIVE_CONFLICT,
            `${conflict.code}: ${conflict.message}`,
            conflict.teacherAssignmentIds,
            [],
            conflict.courseIds,
          ),
        ),
        validation,
        statistics,
      );
    return this.result(
      input,
      TimetableGenerationStatus.SUCCESS,
      state.slots,
      [],
      validation,
      statistics,
    );
  }

  private search(
    input: TimetableGenerationInput,
    assignments: Map<string, TimetableGenerationAssignment>,
    positions: Array<{ weekday: Weekday; scheduleBlockId: string }>,
    unassigned: Requirement[],
    state: SearchState,
    maxSearchNodes: number,
  ): boolean {
    if (!unassigned.length) return true;
    if (state.nodes >= maxSearchNodes) {
      state.limitReached = true;
      return false;
    }
    const choices = unassigned
      .map((requirement) => ({
        requirement,
        candidates: this.candidatesFor(
          requirement,
          assignments,
          positions,
          state,
        ),
      }))
      .sort(
        (left, right) =>
          left.candidates.length - right.candidates.length ||
          left.requirement.assignmentId.localeCompare(
            right.requirement.assignmentId,
          ) ||
          left.requirement.ordinal - right.requirement.ordinal,
      );
    const next = choices[0];
    if (!next.candidates.length) return false;
    const remaining = unassigned.filter((item) => item !== next.requirement);
    for (const candidate of next.candidates) {
      state.nodes += 1;
      if (state.nodes > maxSearchNodes) {
        state.limitReached = true;
        return false;
      }
      if (!this.isAuthoritativelyValidPartial(input, state.slots, candidate))
        continue;
      const assignment = assignments.get(candidate.teacherAssignmentId);
      if (!assignment) return false;
      this.apply(candidate, assignment, state);
      if (
        this.forwardCheck(remaining, assignments, positions, state) &&
        this.search(
          input,
          assignments,
          positions,
          remaining,
          state,
          maxSearchNodes,
        )
      )
        return true;
      this.undo(candidate, assignment, state);
      state.backtracks += 1;
      if (state.limitReached) return false;
    }
    return false;
  }

  private candidatesFor(
    requirement: Requirement,
    assignments: Map<string, TimetableGenerationAssignment>,
    positions: Array<{ weekday: Weekday; scheduleBlockId: string }>,
    state: SearchState,
  ): TimetableCandidateSlot[] {
    const assignment = assignments.get(requirement.assignmentId);
    if (!assignment) return [];
    return positions
      .filter(
        ({ weekday, scheduleBlockId }) =>
          !this.occupied(assignment, weekday, scheduleBlockId, state),
      )
      .map(({ weekday, scheduleBlockId }) => ({
        id: `${requirement.assignmentId}:${weekday}:${scheduleBlockId}`,
        teacherAssignmentId: requirement.assignmentId,
        weekday,
        scheduleBlockId,
      }));
  }

  private forwardCheck(
    requirements: Requirement[],
    assignments: Map<string, TimetableGenerationAssignment>,
    positions: Array<{ weekday: Weekday; scheduleBlockId: string }>,
    state: SearchState,
  ): boolean {
    return requirements.every(
      (requirement) =>
        this.candidatesFor(requirement, assignments, positions, state).length >
        0,
    );
  }

  private occupied(
    assignment: TimetableGenerationAssignment,
    weekday: Weekday,
    blockId: string,
    state: SearchState,
  ): boolean {
    return (
      state.teacherOccupancy.has(
        `${assignment.teacherId}|${weekday}|${blockId}`,
      ) ||
      state.courseOccupancy.has(
        `${assignment.courseId}|${weekday}|${blockId}`,
      ) ||
      state.assignmentOccupancy.has(`${assignment.id}|${weekday}|${blockId}`)
    );
  }

  private apply(
    candidate: TimetableCandidateSlot,
    assignment: TimetableGenerationAssignment,
    state: SearchState,
  ): void {
    state.slots.push(candidate);
    state.teacherOccupancy.add(
      `${assignment.teacherId}|${candidate.weekday}|${candidate.scheduleBlockId}`,
    );
    state.courseOccupancy.add(
      `${assignment.courseId}|${candidate.weekday}|${candidate.scheduleBlockId}`,
    );
    state.assignmentOccupancy.add(
      `${assignment.id}|${candidate.weekday}|${candidate.scheduleBlockId}`,
    );
  }

  private undo(
    candidate: TimetableCandidateSlot,
    assignment: TimetableGenerationAssignment,
    state: SearchState,
  ): void {
    state.slots.pop();
    state.teacherOccupancy.delete(
      `${assignment.teacherId}|${candidate.weekday}|${candidate.scheduleBlockId}`,
    );
    state.courseOccupancy.delete(
      `${assignment.courseId}|${candidate.weekday}|${candidate.scheduleBlockId}`,
    );
    state.assignmentOccupancy.delete(
      `${assignment.id}|${candidate.weekday}|${candidate.scheduleBlockId}`,
    );
  }

  private isAuthoritativelyValidPartial(
    input: TimetableGenerationInput,
    slots: TimetableCandidateSlot[],
    candidate: TimetableCandidateSlot,
  ): boolean {
    return this.conflictEngine.validate(
      this.validationInput(
        input,
        [...slots, candidate],
        TimetableValidationMode.PARTIAL,
      ),
    ).valid;
  }

  private validationInput(
    input: TimetableGenerationInput,
    candidates: TimetableCandidateSlot[],
    mode: TimetableValidationMode,
  ): TimetableConflictValidationInput {
    const periodScheduleStructureId =
      input.context.periodScheduleStructureId ?? '';
    return {
      mode,
      context: {
        institutionId: input.context.institutionId,
        academicPeriodId: input.context.academicPeriodId,
        periodScheduleStructureId,
        enabledWeekdays: input.context.enabledWeekdays,
      },
      assignments: input.assignments,
      scheduleBlocks: input.scheduleBlocks.map(
        ({ id, periodScheduleStructureId, kind }) => ({
          id,
          periodScheduleStructureId,
          kind,
        }),
      ),
      teachingLoads: input.teachingLoads,
      candidates,
    };
  }

  private buildRequirements(input: TimetableGenerationInput): Requirement[] {
    const loads = new Map(
      input.teachingLoads.map((load) => [
        load.teacherAssignmentId,
        load.weeklyPeriods,
      ]),
    );
    return [...input.assignments]
      .sort((left, right) => left.id.localeCompare(right.id))
      .flatMap((assignment) =>
        Array.from({ length: loads.get(assignment.id) ?? 0 }, (_, ordinal) => ({
          assignmentId: assignment.id,
          ordinal,
        })),
      );
  }

  private validateConfiguration(
    input: TimetableGenerationInput,
  ): TimetableGenerationDiagnostic[] {
    const diagnostics: TimetableGenerationDiagnostic[] = [];
    const { context } = input;
    if (!context.periodScheduleStructureId)
      diagnostics.push(
        this.diagnostic(
          TimetableGenerationDiagnosticCode.MISSING_SCHEDULE_STRUCTURE,
          'A period schedule structure is required',
        ),
      );
    if (
      !context.enabledWeekdays.length ||
      new Set(context.enabledWeekdays).size !== context.enabledWeekdays.length
    )
      diagnostics.push(
        this.diagnostic(
          TimetableGenerationDiagnosticCode.NO_ENABLED_WEEKDAYS,
          'At least one unique enabled weekday is required',
        ),
      );
    const teaching = input.scheduleBlocks.filter(
      (block) => block.kind === ScheduleBlockKind.TEACHING,
    );
    if (!teaching.length)
      diagnostics.push(
        this.diagnostic(
          TimetableGenerationDiagnosticCode.NO_TEACHING_BLOCKS,
          'At least one teaching schedule block is required',
        ),
      );
    const blockIds = new Set<string>();
    const positions = new Set<number>();
    for (const block of input.scheduleBlocks) {
      if (
        blockIds.has(block.id) ||
        positions.has(block.position) ||
        block.periodScheduleStructureId !== context.periodScheduleStructureId ||
        !Number.isInteger(block.position) ||
        block.position < 1
      )
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.INVALID_SCHEDULE_BLOCK,
            'Schedule blocks must be unique, ordered, and belong to the requested structure',
          ),
        );
      blockIds.add(block.id);
      positions.add(block.position);
    }
    if (this.blocksOverlap(input.scheduleBlocks))
      diagnostics.push(
        this.diagnostic(
          TimetableGenerationDiagnosticCode.OVERLAPPING_SCHEDULE_BLOCKS,
          'Schedule blocks must not overlap',
        ),
      );
    const assignmentIds = new Set<string>();
    for (const assignment of input.assignments) {
      if (assignmentIds.has(assignment.id))
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.DUPLICATE_ASSIGNMENT,
            'TeacherAssignment identifiers must be unique',
            [assignment.id],
          ),
        );
      assignmentIds.add(assignment.id);
      if (
        assignment.institutionId !== context.institutionId ||
        assignment.academicPeriodId !== context.academicPeriodId
      )
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.INVALID_ASSIGNMENT_CONTEXT,
            'TeacherAssignment does not belong to the requested institution and academic period',
            [assignment.id],
            [assignment.teacherId],
            [assignment.courseId],
          ),
        );
    }
    const loads = new Set<string>();
    for (const load of input.teachingLoads) {
      if (
        loads.has(load.teacherAssignmentId) ||
        !assignmentIds.has(load.teacherAssignmentId)
      )
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.MISSING_TEACHING_LOAD,
            'TeachingLoad must belong to exactly one supplied TeacherAssignment',
            [load.teacherAssignmentId],
          ),
        );
      loads.add(load.teacherAssignmentId);
      if (!Number.isInteger(load.weeklyPeriods) || load.weeklyPeriods <= 0)
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.INVALID_WEEKLY_PERIODS,
            'TeachingLoad weeklyPeriods must be a positive integer',
            [load.teacherAssignmentId],
          ),
        );
    }
    for (const id of assignmentIds)
      if (!loads.has(id))
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.MISSING_TEACHING_LOAD,
            'Every supplied TeacherAssignment requires a TeachingLoad',
            [id],
          ),
        );
    const maxNodes = input.options?.maxSearchNodes;
    if (maxNodes !== undefined && (!Number.isInteger(maxNodes) || maxNodes < 1))
      diagnostics.push(
        this.diagnostic(
          TimetableGenerationDiagnosticCode.INVALID_WEEKLY_PERIODS,
          'maxSearchNodes must be a positive integer',
        ),
      );
    return this.sortDiagnostics(diagnostics);
  }

  private blocksOverlap(blocks: TimetableGenerationScheduleBlock[]): boolean {
    const timed = blocks
      .filter(
        (
          block,
        ): block is TimetableGenerationScheduleBlock & {
          startTime: string;
          endTime: string;
        } => block.startTime !== undefined && block.endTime !== undefined,
      )
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
    return timed.some((block, index) => {
      const previous = timed[index - 1];
      return previous !== undefined && block.startTime < previous.endTime;
    });
  }

  private capacityDiagnostics(
    input: TimetableGenerationInput,
    assignments: Map<string, TimetableGenerationAssignment>,
    positionCount: number,
  ): TimetableGenerationDiagnostic[] {
    const demandByCourse = new Map<string, number>();
    const demandByTeacher = new Map<string, number>();
    for (const load of input.teachingLoads) {
      const assignment = assignments.get(load.teacherAssignmentId);
      if (!assignment) continue;
      demandByCourse.set(
        assignment.courseId,
        (demandByCourse.get(assignment.courseId) ?? 0) + load.weeklyPeriods,
      );
      demandByTeacher.set(
        assignment.teacherId,
        (demandByTeacher.get(assignment.teacherId) ?? 0) + load.weeklyPeriods,
      );
    }
    const diagnostics: TimetableGenerationDiagnostic[] = [];
    for (const [courseId, demand] of demandByCourse)
      if (demand > positionCount)
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.COURSE_CAPACITY_EXCEEDED,
            `Course requires ${demand} weekly periods but only ${positionCount} positions exist`,
            [],
            [],
            [courseId],
          ),
        );
    for (const [teacherId, demand] of demandByTeacher)
      if (demand > positionCount)
        diagnostics.push(
          this.diagnostic(
            TimetableGenerationDiagnosticCode.TEACHER_CAPACITY_EXCEEDED,
            `Teacher requires ${demand} weekly periods but only ${positionCount} positions exist`,
            [],
            [teacherId],
          ),
        );
    return this.sortDiagnostics(diagnostics);
  }

  private result(
    input: TimetableGenerationInput,
    status: TimetableGenerationStatus,
    slots: TimetableCandidateSlot[],
    diagnostics: TimetableGenerationDiagnostic[],
    validation: TimetableConflictValidationResult | null,
    statistics: TimetableGenerationResult['statistics'],
  ): TimetableGenerationResult {
    return {
      status,
      institutionId: input.context.institutionId,
      academicPeriodId: input.context.academicPeriodId,
      slots: [...slots].sort(
        (left, right) =>
          left.teacherAssignmentId.localeCompare(right.teacherAssignmentId) ||
          weekdayOrder[left.weekday] - weekdayOrder[right.weekday] ||
          left.scheduleBlockId.localeCompare(right.scheduleBlockId),
      ),
      diagnostics: this.sortDiagnostics(diagnostics),
      validation,
      statistics,
    };
  }

  private diagnostic(
    code: TimetableGenerationDiagnosticCode,
    message: string,
    teacherAssignmentIds: string[] = [],
    teacherIds: string[] = [],
    courseIds: string[] = [],
  ): TimetableGenerationDiagnostic {
    return {
      code,
      message,
      teacherAssignmentIds: [...teacherAssignmentIds].sort(),
      teacherIds: [...teacherIds].sort(),
      courseIds: [...courseIds].sort(),
    };
  }

  private sortDiagnostics(
    diagnostics: TimetableGenerationDiagnostic[],
  ): TimetableGenerationDiagnostic[] {
    return [...diagnostics].sort(
      (left, right) =>
        left.code.localeCompare(right.code) ||
        left.teacherAssignmentIds
          .join('|')
          .localeCompare(right.teacherAssignmentIds.join('|')) ||
        left.teacherIds.join('|').localeCompare(right.teacherIds.join('|')) ||
        left.courseIds.join('|').localeCompare(right.courseIds.join('|')) ||
        left.message.localeCompare(right.message),
    );
  }
}
