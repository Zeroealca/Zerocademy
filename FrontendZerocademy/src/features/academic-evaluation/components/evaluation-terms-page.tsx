"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstitutionScopeSelector } from "@/features/academic-evaluation/components/institution-scope-selector";
import { EvaluationTermWeightsEditor } from "@/features/academic-evaluation/components/evaluation-term-weights-editor";
import { WeightProgressBar } from "@/features/academic-evaluation/components/weight-progress-bar";
import {
  useAcademicEvaluationMutations,
  useEvaluationTerms,
  useInstitutionConfiguration,
} from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import { evaluationTermSchema } from "@/features/academic-evaluation/schemas/academic-evaluation.schema";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import type { EvaluationTerm } from "@/features/academic-evaluation/types";
import {
  canManageAcademicEvaluation,
  canViewAcademicEvaluation,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import { z } from "zod";

type EvaluationTermFormValues = z.infer<typeof evaluationTermSchema>;

export function EvaluationTermsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [institutionId, setInstitutionId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showWeightsEditor, setShowWeightsEditor] = useState(false);
  const { data: configuration, isLoading: isConfigurationLoading } =
    useInstitutionConfiguration(institutionId || undefined);
  const academicPeriodId =
    effectivePeriodId ?? configuration?.activeAcademicPeriodId ?? undefined;
  const filters =
    institutionId && academicPeriodId
      ? {
          page: 1,
          limit: 50,
          institutionId,
          academicPeriodId,
        }
      : undefined;

  const { data, isLoading, refetch } = useEvaluationTerms(filters);
  const mutations = useAcademicEvaluationMutations();
  const terms = data?.data ?? [];
  const activeTerms = useMemo(
    () => terms.filter((term) => term.isActive).sort((a, b) => a.order - b.order),
    [terms],
  );

  const weightTotal = useMemo(
    () => activeTerms.reduce((sum, term) => sum + term.weight, 0),
    [activeTerms],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("academic-evaluation-institution-id");
    if (stored) setInstitutionId(stored);
  }, []);

  const form = useForm<EvaluationTermFormValues>({
    resolver: zodResolver(evaluationTermSchema),
    defaultValues: { name: "", order: 1, weight: 0 },
  });

  if (!canViewAcademicEvaluation(currentUser?.role)) {
    return <p className="text-sm text-muted-foreground">Acceso denegado.</p>;
  }

  const canManage = canManageAcademicEvaluation(currentUser?.role);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!institutionId || !academicPeriodId) return;

    await mutations.createEvaluationTerm.mutateAsync({
      institutionId,
      academicPeriodId,
      ...values,
    });
    form.reset({ name: "", order: terms.length + 1, weight: 0 });
    setShowForm(false);
  });

  const moveTerm = async (term: EvaluationTerm, direction: "up" | "down") => {
    if (!institutionId || !academicPeriodId) return;

    const sorted = [...terms].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((item) => item.id === term.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const reordered = [...sorted];
    const currentOrder = reordered[index].order;
    reordered[index] = { ...reordered[index], order: reordered[swapIndex].order };
    reordered[swapIndex] = { ...reordered[swapIndex], order: currentOrder };

    await mutations.reorderEvaluationTerms.mutateAsync({
      institutionId,
      academicPeriodId,
      items: reordered.map((item) => ({ id: item.id, order: item.order })),
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Períodos de evaluación
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure términos ponderados para el período académico seleccionado.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {activeTerms.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWeightsEditor((open) => !open)}
              >
                {showWeightsEditor ? "Cerrar edición" : "Editar porcentajes"}
              </Button>
            ) : null}
            <Button onClick={() => setShowForm((open) => !open)}>
              {showForm ? "Cancelar" : "Añadir período"}
            </Button>
          </div>
        ) : null}
      </header>

      <InstitutionScopeSelector value={institutionId} onChange={setInstitutionId} />
      <WeightProgressBar label="Distribución de pesos" total={weightTotal} />

      {showForm && canManage ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2"
        >
          <Field label="Nombre" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Orden" error={form.formState.errors.order?.message}>
            <Input
              type="number"
              {...form.register("order", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Peso (%)" error={form.formState.errors.weight?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("weight", { valueAsNumber: true })}
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={!institutionId || !effectivePeriodId}>
              Guardar período
            </Button>
          </div>
        </form>
      ) : null}

      {showWeightsEditor && canManage && institutionId && academicPeriodId ? (
        <EvaluationTermWeightsEditor
          terms={activeTerms}
          institutionId={institutionId}
          academicPeriodId={academicPeriodId}
          onClose={() => setShowWeightsEditor(false)}
        />
      ) : null}

      {!academicPeriodId && !isConfigurationLoading ? (
        <p className="text-sm text-muted-foreground">
          La institución seleccionada no tiene un período académico activo en su
          configuración de evaluación.
        </p>
      ) : !academicPeriodId ? (
        <p className="text-sm text-muted-foreground">Cargando período académico…</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando períodos…</p>
      ) : (
        <div className="space-y-3">
          {[...terms]
            .sort((a, b) => a.order - b.order)
            .map((term) => (
              <div
                key={term.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{term.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Orden {term.order} · Peso {term.weight.toFixed(2)}%
                  </p>
                </div>
                {canManage ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label={`Bajar ${term.name}`}
                      onClick={() => void moveTerm(term, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label={`Subir ${term.name}`}
                      onClick={() => void moveTerm(term, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (
                          window.confirm(`¿Eliminar el período «${term.name}»?`)
                        ) {
                          await mutations.deleteEvaluationTerm.mutateAsync(term.id);
                          void refetch();
                        }
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
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
