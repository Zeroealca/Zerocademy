"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstitutionScopeSelector } from "@/features/academic-evaluation/components/institution-scope-selector";
import {
  useAcademicEvaluationMutations,
  useGradingSchemes,
} from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import { gradingSchemeSchema } from "@/features/academic-evaluation/schemas/academic-evaluation.schema";
import type { GradingScheme } from "@/features/academic-evaluation/types";
import {
  canManageAcademicEvaluation,
  canViewAcademicEvaluation,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import { z } from "zod";

type GradingSchemeFormValues = z.infer<typeof gradingSchemeSchema>;

export function GradingSchemesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [institutionId, setInstitutionId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useGradingSchemes({
    page: 1,
    limit: 50,
    institutionId: institutionId || undefined,
  });
  const mutations = useAcademicEvaluationMutations();

  useEffect(() => {
    const stored = sessionStorage.getItem("academic-evaluation-institution-id");
    if (stored) setInstitutionId(stored);
  }, []);

  const form = useForm<GradingSchemeFormValues>({
    resolver: zodResolver(gradingSchemeSchema),
    defaultValues: {
      name: "",
      minScore: 0,
      maxScore: 10,
      passingScore: 7,
      decimalPlaces: 2,
      isDefault: true,
    },
  });

  if (!canViewAcademicEvaluation(currentUser?.role)) {
    return <p className="text-sm text-muted-foreground">Acceso denegado.</p>;
  }

  const canManage = canManageAcademicEvaluation(currentUser?.role);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!institutionId) return;

    await mutations.createGradingScheme.mutateAsync({
      ...values,
      institutionId,
    });
    form.reset();
    setShowForm(false);
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Esquemas de calificación
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina rangos numéricos y notas de aprobación por institución.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setShowForm((open) => !open)}>
            {showForm ? "Cancelar" : "Nuevo esquema"}
          </Button>
        ) : null}
      </header>

      <InstitutionScopeSelector value={institutionId} onChange={setInstitutionId} />

      {showForm && canManage ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2"
        >
          <Field label="Nombre" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Nota mínima" error={form.formState.errors.minScore?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("minScore", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Nota máxima" error={form.formState.errors.maxScore?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("maxScore", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Nota de aprobación"
            error={form.formState.errors.passingScore?.message}
          >
            <Input
              type="number"
              step="0.01"
              {...form.register("passingScore", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Decimales"
            error={form.formState.errors.decimalPlaces?.message}
          >
            <Input
              type="number"
              {...form.register("decimalPlaces", { valueAsNumber: true })}
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={!institutionId}>
              Guardar esquema
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando esquemas…</p>
      ) : isError ? (
        <Button variant="outline" onClick={() => void refetch()}>
          Reintentar
        </Button>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rango</th>
                <th className="px-4 py-3 font-medium">Aprobación</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((scheme) => (
                <SchemeRow key={scheme.id} scheme={scheme} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SchemeRow({ scheme }: { scheme: GradingScheme }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="font-medium">{scheme.name}</div>
        {scheme.isDefault ? (
          <span className="text-xs text-muted-foreground">Predeterminado</span>
        ) : null}
      </td>
      <td className="px-4 py-3 tabular-nums">
        {scheme.minScore} – {scheme.maxScore}
      </td>
      <td className="px-4 py-3 tabular-nums">{scheme.passingScore}</td>
      <td className="px-4 py-3">
        {scheme.isActive ? "Activo" : "Inactivo"}
      </td>
    </tr>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
