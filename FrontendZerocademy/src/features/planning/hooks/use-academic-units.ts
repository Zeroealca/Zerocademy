"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAcademicUnit,
  deleteAcademicUnit,
  fetchAcademicUnit,
  fetchAcademicUnits,
  reorderAcademicUnits,
  updateAcademicUnit,
} from "@/features/planning/api/academic-units.api";
import { academicUnitsKeys } from "@/features/planning/api/academic-units.keys";
import type {
  AcademicUnitInput,
  ReorderAcademicUnitsInput,
  UpdateAcademicUnitInput,
} from "@/features/planning/types";

export function useAcademicUnits(academicPlanId: string) {
  return useQuery({
    queryKey: academicUnitsKeys.list(academicPlanId),
    queryFn: () => fetchAcademicUnits(academicPlanId),
    enabled: Boolean(academicPlanId),
  });
}

export function useAcademicUnit(
  academicPlanId: string,
  academicUnitId: string,
) {
  return useQuery({
    queryKey: academicUnitsKeys.detail(academicPlanId, academicUnitId),
    queryFn: () => fetchAcademicUnit(academicPlanId, academicUnitId),
    enabled: Boolean(academicPlanId && academicUnitId),
  });
}

function useInvalidateAcademicUnits() {
  const queryClient = useQueryClient();

  return (academicPlanId: string) =>
    queryClient.invalidateQueries({
      queryKey: academicUnitsKeys.list(academicPlanId),
    });
}

export function useCreateAcademicUnit() {
  const invalidateAcademicUnits = useInvalidateAcademicUnits();

  return useMutation({
    mutationFn: ({ academicPlanId, payload }: {
      academicPlanId: string;
      payload: AcademicUnitInput;
    }) => createAcademicUnit(academicPlanId, payload),
    onSuccess: (_, { academicPlanId }) => invalidateAcademicUnits(academicPlanId),
  });
}

export function useUpdateAcademicUnit() {
  const queryClient = useQueryClient();
  const invalidateAcademicUnits = useInvalidateAcademicUnits();

  return useMutation({
    mutationFn: ({ academicPlanId, academicUnitId, payload }: {
      academicPlanId: string;
      academicUnitId: string;
      payload: UpdateAcademicUnitInput;
    }) => updateAcademicUnit(academicPlanId, academicUnitId, payload),
    onSuccess: (_, { academicPlanId, academicUnitId }) => {
      void queryClient.invalidateQueries({
        queryKey: academicUnitsKeys.detail(academicPlanId, academicUnitId),
      });
      return invalidateAcademicUnits(academicPlanId);
    },
  });
}

export function useDeleteAcademicUnit() {
  const queryClient = useQueryClient();
  const invalidateAcademicUnits = useInvalidateAcademicUnits();

  return useMutation({
    mutationFn: ({ academicPlanId, academicUnitId }: {
      academicPlanId: string;
      academicUnitId: string;
    }) => deleteAcademicUnit(academicPlanId, academicUnitId),
    onSuccess: (_, { academicPlanId, academicUnitId }) => {
      queryClient.removeQueries({
        queryKey: academicUnitsKeys.detail(academicPlanId, academicUnitId),
      });
      return invalidateAcademicUnits(academicPlanId);
    },
  });
}

export function useReorderAcademicUnits() {
  const invalidateAcademicUnits = useInvalidateAcademicUnits();

  return useMutation({
    mutationFn: ({ academicPlanId, payload }: {
      academicPlanId: string;
      payload: ReorderAcademicUnitsInput;
    }) => reorderAcademicUnits(academicPlanId, payload),
    onSuccess: (_, { academicPlanId }) => invalidateAcademicUnits(academicPlanId),
  });
}
