"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstitutionScopeSelector } from "@/features/academic-evaluation/components/institution-scope-selector";
import { WeightProgressBar } from "@/features/academic-evaluation/components/weight-progress-bar";
import {
  useAcademicEvaluationMutations,
  useAssessmentCategories,
} from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import { assessmentCategorySchema } from "@/features/academic-evaluation/schemas/academic-evaluation.schema";
import { ApiError } from "@/lib/api-error";
import {
  canManageAcademicEvaluation,
  canViewAcademicEvaluation,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import { z } from "zod";

type AssessmentCategoryFormValues = z.infer<typeof assessmentCategorySchema>;

export function AssessmentCategoriesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [institutionId, setInstitutionId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const filters = institutionId
    ? { page: 1, limit: 50, institutionId }
    : undefined;

  const { data, isLoading, refetch } = useAssessmentCategories(filters);
  const mutations = useAcademicEvaluationMutations();
  const categories = data?.data ?? [];
  const savedWeightTotal = useMemo(
    () => categories.reduce((sum, category) => sum + category.weight, 0),
    [categories],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("academic-evaluation-institution-id");
    if (stored) setInstitutionId(stored);
  }, []);

  const form = useForm<AssessmentCategoryFormValues>({
    resolver: zodResolver(assessmentCategorySchema),
    defaultValues: { name: "", weight: 0, description: "" },
  });
  const draftWeight = useWatch({ control: form.control, name: "weight" }) ?? 0;
  const prospectiveTotal =
    savedWeightTotal + (showForm && Number.isFinite(draftWeight) ? draftWeight : 0);
  const exceedsTarget = prospectiveTotal > 100.01;

  if (!canViewAcademicEvaluation(currentUser?.role)) {
    return <p className="text-sm text-muted-foreground">Acceso denegado.</p>;
  }

  const canManage = canManageAcademicEvaluation(currentUser?.role);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!institutionId || exceedsTarget) return;
    setSubmitError(null);

    try {
      await mutations.createAssessmentCategory.mutateAsync({
        institutionId,
        ...values,
      });
      form.reset();
      setShowForm(false);
      void refetch();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar la categoría.",
      );
    }
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Categorías de evaluación
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina los insumos que componen la nota final y su ponderación.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setShowForm((open) => !open)}>
            {showForm ? "Cancelar" : "Nueva categoría"}
          </Button>
        ) : null}
      </header>

      <InstitutionScopeSelector value={institutionId} onChange={setInstitutionId} />
      <WeightProgressBar
        label="Distribución de pesos"
        total={prospectiveTotal}
      />
      {Math.abs(savedWeightTotal - 100) >= 0.02 ? (
        <p className="text-sm text-destructive">
          La suma de pesos guardados debe ser 100% para usar las categorías en
          calificaciones (actual: {savedWeightTotal.toFixed(2)}%).
        </p>
      ) : null}

      {showForm && canManage ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2"
        >
          <Field label="Nombre" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Peso (%)" error={form.formState.errors.weight?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("weight", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Descripción"
            error={form.formState.errors.description?.message}
          >
            <Input {...form.register("description")} />
          </Field>
          <div className="flex flex-col justify-end gap-2">
            {exceedsTarget ? (
              <p className="text-xs text-destructive">
                La suma no puede superar 100% (quedaría en{" "}
                {prospectiveTotal.toFixed(2)}%).
              </p>
            ) : null}
            {submitError ? (
              <p role="alert" className="text-xs text-destructive">
                {submitError}
              </p>
            ) : null}
            <Button type="submit" disabled={!institutionId || exceedsTarget}>
              Guardar categoría
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando categorías…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Peso</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                {canManage ? (
                  <th className="px-4 py-3 font-medium">Acciones</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {category.weight.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {category.description ?? "—"}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (
                            window.confirm(
                              `¿Eliminar la categoría «${category.name}»?`,
                            )
                          ) {
                            await mutations.deleteAssessmentCategory.mutateAsync(
                              category.id,
                            );
                            void refetch();
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
