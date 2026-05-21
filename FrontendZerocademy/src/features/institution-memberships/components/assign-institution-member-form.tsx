"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MEMBERSHIP_ROLE_LABELS } from "@/features/institution-memberships/constants";
import { useInstitutionMembershipMutations } from "@/features/institution-memberships/hooks/use-institution-membership-mutations";
import {
  assignInstitutionMembershipSchema,
  type AssignInstitutionMembershipFormValues,
} from "@/features/institution-memberships/schemas/institution-membership.schema";
import type { InstitutionMembershipRole } from "@/features/institution-memberships/types";
import { useUsers } from "@/features/users/hooks/use-users";
import type { UserRole } from "@/stores/use-auth-store";

interface AssignInstitutionMemberFormProps {
  institutionId: string;
  onSuccess: () => void;
}

const roleToUserRole: Record<InstitutionMembershipRole, UserRole> = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
};

export function AssignInstitutionMemberForm({
  institutionId,
  onSuccess,
}: AssignInstitutionMemberFormProps) {
  const { assignMutation } = useInstitutionMembershipMutations(institutionId);

  const form = useForm<AssignInstitutionMembershipFormValues>({
    resolver: zodResolver(assignInstitutionMembershipSchema),
    defaultValues: { userId: "", role: "TEACHER" },
  });

  const selectedRole = form.watch("role");
  const { data: usersData, isLoading: usersLoading } = useUsers({
    page: 1,
    limit: 100,
    role: roleToUserRole[selectedRole],
    isActive: true,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await assignMutation.mutateAsync(values);
    form.reset({ userId: "", role: values.role });
    onSuccess();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="role">Rol en la institución</Label>
        <Select
          id="role"
          value={form.watch("role")}
          onChange={(event) => {
            form.setValue("role", event.target.value as InstitutionMembershipRole);
            form.setValue("userId", "");
          }}
        >
          <option value="ADMIN">{MEMBERSHIP_ROLE_LABELS.ADMIN}</option>
          <option value="TEACHER">{MEMBERSHIP_ROLE_LABELS.TEACHER}</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userId">Usuario</Label>
        <Select
          id="userId"
          value={form.watch("userId")}
          onChange={(event) => form.setValue("userId", event.target.value)}
          disabled={usersLoading}
        >
          <option value="">
            {usersLoading ? "Cargando usuarios…" : "Selecciona un usuario"}
          </option>
          {(usersData?.data ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.email})
            </option>
          ))}
        </Select>
        {form.formState.errors.userId ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.userId.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={assignMutation.isPending}>
        {assignMutation.isPending ? "Asignando…" : "Asignar miembro"}
      </Button>
    </form>
  );
}
