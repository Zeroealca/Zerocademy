import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateInstitution,
  createInstitution,
  deactivateInstitution,
  deleteInstitution,
  updateInstitution,
  updateInstitutionBranding,
  updateInstitutionSettings,
  uploadInstitutionLogo,
} from "@/features/institutions/api/institutions.api";
import { institutionsKeys } from "@/features/institutions/api/institutions.keys";
import type {
  CreateInstitutionInput,
  UpdateInstitutionBrandingInput,
  UpdateInstitutionInput,
  UpdateInstitutionSettingsInput,
} from "@/features/institutions/types";

export function useInstitutionMutations() {
  const queryClient = useQueryClient();

  const invalidate = async (id?: string) => {
    await queryClient.invalidateQueries({ queryKey: institutionsKeys.lists() });
    if (id) {
      await queryClient.invalidateQueries({
        queryKey: institutionsKeys.detail(id),
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateInstitutionInput) => createInstitution(payload),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInstitutionInput;
    }) => updateInstitution(id, payload),
    onSuccess: (_, { id }) => invalidate(id),
  });

  const settingsMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInstitutionSettingsInput;
    }) => updateInstitutionSettings(id, payload),
    onSuccess: (_, { id }) => invalidate(id),
  });

  const brandingMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInstitutionBrandingInput;
    }) => updateInstitutionBranding(id, payload),
    onSuccess: (_, { id }) => invalidate(id),
  });

  const logoMutation = useMutation({
    mutationFn: ({
      id,
      file,
    }: {
      id: string;
      file: File;
    }) => uploadInstitutionLogo(id, file),
    onSuccess: (_, { id }) => invalidate(id),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateInstitution(id),
    onSuccess: (_, id) => invalidate(id),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateInstitution(id),
    onSuccess: (_, id) => invalidate(id),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInstitution(id),
    onSuccess: () => invalidate(),
  });

  return {
    createMutation,
    updateMutation,
    settingsMutation,
    brandingMutation,
    logoMutation,
    activateMutation,
    deactivateMutation,
    deleteMutation,
  };
}
