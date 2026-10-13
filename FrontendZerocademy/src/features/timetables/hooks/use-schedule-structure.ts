"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createScheduleBlock, deleteScheduleBlock, fetchScheduleStructure, fetchScheduleStructureValidation, reorderScheduleBlocks, updateEnabledWeekdays, updateScheduleBlock } from "@/features/timetables/api/timetables.api";
import { timetablesKeys } from "@/features/timetables/api/timetables.keys";
import type { ScheduleBlockInput, Weekday } from "@/features/timetables/types";

export function useScheduleStructure(institutionId?: string, academicPeriodId?: string) {
  return useQuery({ queryKey: timetablesKeys.structure(institutionId ?? "", academicPeriodId ?? ""), queryFn: () => fetchScheduleStructure(institutionId!, academicPeriodId!), enabled: Boolean(institutionId && academicPeriodId) });
}

export function useScheduleStructureValidation(institutionId?: string, academicPeriodId?: string) {
  return useQuery({ queryKey: timetablesKeys.validation(institutionId ?? "", academicPeriodId ?? ""), queryFn: () => fetchScheduleStructureValidation(institutionId!, academicPeriodId!), enabled: Boolean(institutionId && academicPeriodId) });
}

export function useScheduleStructureMutations(institutionId: string, academicPeriodId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: timetablesKeys.structure(institutionId, academicPeriodId) }),
    queryClient.invalidateQueries({ queryKey: timetablesKeys.validation(institutionId, academicPeriodId) }),
  ]);
  return {
    saveWeekdays: useMutation({ mutationFn: (days: Weekday[]) => updateEnabledWeekdays(institutionId, academicPeriodId, days), onSuccess: invalidate }),
    createBlock: useMutation({ mutationFn: (payload: ScheduleBlockInput) => createScheduleBlock(institutionId, academicPeriodId, payload), onSuccess: invalidate }),
    updateBlock: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<ScheduleBlockInput> }) => updateScheduleBlock(id, payload), onSuccess: invalidate }),
    deleteBlock: useMutation({ mutationFn: deleteScheduleBlock, onSuccess: invalidate }),
    reorder: useMutation({ mutationFn: (ids: string[]) => reorderScheduleBlocks(institutionId, academicPeriodId, ids), onSuccess: invalidate }),
  };
}
