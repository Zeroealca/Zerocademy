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
  useGradeScales,
  useGradingSchemes,
} from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import { gradingSchemeSchema } from "@/features/academic-evaluation/schemas/academic-evaluation.schema";
import type { CreateGradeScaleInput, GradingScheme } from "@/features/academic-evaluation/types";
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
    // Restore persisted scope after hydration; the server cannot read sessionStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
                <th className="px-4 py-3 font-medium">Bandas cualitativas</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((scheme) => (
                <SchemeRow key={scheme.id} scheme={scheme} canManage={canManage} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SchemeRow({ scheme, canManage }: { scheme: GradingScheme; canManage: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
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
      <td className="px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Ocultar" : "Ver bandas"}
        </Button>
      </td>
    </tr>
    {expanded ? (
      <tr className="border-t border-border">
        <td colSpan={5} className="p-4">
          <GradeScalesEditor scheme={scheme} canManage={canManage && Boolean(scheme.institutionId)} />
        </td>
      </tr>
    ) : null}
    </>
  );
}

function GradeScalesEditor({ scheme, canManage }: { scheme: GradingScheme; canManage: boolean }) {
  const { data: saved = [], isLoading, isError, refetch } = useGradeScales(scheme.id);
  const [draft, setDraft] = useState<CreateGradeScaleInput[] | null>(null);
  const [error, setError] = useState("");
  const mutations = useAcademicEvaluationMutations();
  const scales = draft ?? saved.map(({ code, description, minValue, maxValue, order }) => ({
    code, description, minValue, maxValue, order,
  }));

  function edit(index: number, patch: Partial<CreateGradeScaleInput>) {
    setDraft(scales.map((scale, position) => position === index ? { ...scale, ...patch } : scale));
    setError("");
  }

  async function save() {
    if (scales.some((scale) => !scale.code.trim() || !scale.description.trim() ||
      !Number.isFinite(scale.minValue) || !Number.isFinite(scale.maxValue))) {
      setError("Complete el código, descripción y rango de cada banda.");
      return;
    }
    const sorted = [...scales].sort((a, b) => a.minValue - b.minValue);
    let next = Math.round(scheme.minScore * 100);
    const codes = new Set<string>();
    for (const scale of sorted) {
      const min = Math.round(scale.minValue * 100);
      const max = Math.round(scale.maxValue * 100);
      if (Math.abs(scale.minValue * 100 - min) > 1e-7 ||
        Math.abs(scale.maxValue * 100 - max) > 1e-7) {
        setError("Use como máximo dos decimales en cada límite.");
        return;
      }
      if (codes.has(scale.code.trim().toUpperCase())) {
        setError(`El código ${scale.code} está repetido.`);
        return;
      }
      codes.add(scale.code.trim().toUpperCase());
      if (min < next) {
        setError(`La banda ${scale.code} se solapa con la anterior.`);
        return;
      }
      if (min > next) {
        setError(`Hay un hueco antes de ${scale.code}; debería comenzar en ${(next / 100).toFixed(2)}.`);
        return;
      }
      if (max < min) {
        setError(`El rango de ${scale.code} no es válido.`);
        return;
      }
      next = max + 1;
    }
    if (next !== Math.round(scheme.maxScore * 100) + 1) {
      setError(`Las bandas deben llegar hasta ${scheme.maxScore}.`);
      return;
    }
    try {
      await mutations.replaceGradeScales.mutateAsync({
        schemeId: scheme.id,
        scales: scales.map((scale, index) => ({ ...scale, order: index + 1 })),
      });
      setDraft(null);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron guardar las bandas.");
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando bandas…</p>;
  if (isError) return <Button variant="outline" onClick={() => void refetch()}>Reintentar</Button>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Las bandas deben cubrir {scheme.minScore}–{scheme.maxScore} sin solapes ni huecos (intervalos inclusivos de 0,01).
      </p>
      {scales.length === 0 ? <p className="text-sm">Este esquema aún no tiene bandas.</p> : null}
      {scales.map((scale, index) => (
        <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[7rem_minmax(10rem,1fr)_7rem_7rem_auto] sm:items-end">
          <Field label={`Código ${index + 1}`}><Input aria-label={`Código de banda ${index + 1}`} value={scale.code} disabled={!canManage} onChange={(event) => edit(index, { code: event.target.value })} /></Field>
          <Field label="Descripción"><Input aria-label={`Descripción de banda ${index + 1}`} value={scale.description} disabled={!canManage} onChange={(event) => edit(index, { description: event.target.value })} /></Field>
          <Field label="Desde"><Input aria-label={`Mínimo de banda ${index + 1}`} type="number" step="0.01" value={scale.minValue} disabled={!canManage} onChange={(event) => edit(index, { minValue: event.target.valueAsNumber })} /></Field>
          <Field label="Hasta"><Input aria-label={`Máximo de banda ${index + 1}`} type="number" step="0.01" value={scale.maxValue} disabled={!canManage} onChange={(event) => edit(index, { maxValue: event.target.valueAsNumber })} /></Field>
          {canManage ? <Button variant="outline" onClick={() => { setDraft(scales.filter((_, position) => position !== index)); setError(""); }}>Quitar</Button> : null}
        </div>
      ))}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {canManage ? <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setDraft([...scales, { code: "", description: "", minValue: scheme.minScore, maxValue: scheme.maxScore, order: scales.length + 1 }])}>Añadir banda</Button>
        <Button onClick={() => void save()} disabled={mutations.replaceGradeScales.isPending || !draft}>Guardar bandas</Button>
        {draft ? <Button variant="ghost" onClick={() => { setDraft(null); setError(""); }}>Descartar cambios</Button> : null}
      </div> : null}
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
