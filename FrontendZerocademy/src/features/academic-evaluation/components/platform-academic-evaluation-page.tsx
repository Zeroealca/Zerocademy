"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeightProgressBar } from "@/features/academic-evaluation/components/weight-progress-bar";
import {
  useAcademicEvaluationMutations,
  usePlatformAcademicEvaluation,
} from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import {
  assessmentCategoryTemplateSchema,
  evaluationTermTemplateSchema,
  gradingSchemeSchema,
  platformConfigurationSchema,
  ROUNDING_STRATEGY_LABELS,
} from "@/features/academic-evaluation/schemas/academic-evaluation.schema";
import type {
  AssessmentCategoryTemplate,
  EvaluationTermTemplate,
} from "@/features/academic-evaluation/types";
import { canManagePlatformAcademicEvaluation } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import { z } from "zod";

type PlatformConfigFormValues = z.infer<typeof platformConfigurationSchema>;
type GradingSchemeFormValues = z.infer<typeof gradingSchemeSchema>;
type CategoryTemplateFormValues = z.infer<typeof assessmentCategoryTemplateSchema>;
type TermTemplateFormValues = z.infer<typeof evaluationTermTemplateSchema>;

export function PlatformAcademicEvaluationPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = canManagePlatformAcademicEvaluation(currentUser?.role);
  const { data: platform, isLoading, isError, refetch } =
    usePlatformAcademicEvaluation();
  const mutations = useAcademicEvaluationMutations();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTermForm, setShowTermForm] = useState(false);

  const categoryWeightTotal = useMemo(
    () =>
      (platform?.assessmentCategoryTemplates ?? [])
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + item.weight, 0),
    [platform?.assessmentCategoryTemplates],
  );

  const termWeightTotal = useMemo(
    () =>
      (platform?.evaluationTermTemplates ?? [])
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + item.weight, 0),
    [platform?.evaluationTermTemplates],
  );

  const configForm = useForm<PlatformConfigFormValues>({
    resolver: zodResolver(platformConfigurationSchema),
    values: platform
      ? {
          roundingStrategy: platform.roundingStrategy,
          decimalPlaces: platform.decimalPlaces,
        }
      : undefined,
  });

  const schemeForm = useForm<GradingSchemeFormValues>({
    resolver: zodResolver(gradingSchemeSchema),
    values: platform?.gradingScheme
      ? {
          name: platform.gradingScheme.name,
          minScore: platform.gradingScheme.minScore,
          maxScore: platform.gradingScheme.maxScore,
          passingScore: platform.gradingScheme.passingScore,
          decimalPlaces: platform.gradingScheme.decimalPlaces,
          isDefault: platform.gradingScheme.isDefault,
        }
      : undefined,
  });

  const categoryForm = useForm<CategoryTemplateFormValues>({
    resolver: zodResolver(assessmentCategoryTemplateSchema),
    defaultValues: { name: "", weight: 0, order: 1, description: "" },
  });

  const termForm = useForm<TermTemplateFormValues>({
    resolver: zodResolver(evaluationTermTemplateSchema),
    defaultValues: { name: "", weight: 0, order: 1, description: "" },
  });

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground" role="alert">
        Solo el super administrador puede gestionar los parámetros globales de
        evaluación.
      </p>
    );
  }

  const handleInitializeEcuador = async () => {
    if (
      !window.confirm(
        "¿Inicializar o actualizar los parámetros vigentes de Ecuador en la plataforma?",
      )
    ) {
      return;
    }

    await mutations.initializePlatformEcuador.mutateAsync();
  };

  const onSaveConfig = configForm.handleSubmit(async (values) => {
    await mutations.upsertPlatformConfig.mutateAsync(values);
  });

  const onSaveScheme = schemeForm.handleSubmit(async (values) => {
    if (!platform?.gradingSchemeId) return;

    await mutations.updatePlatformGradingScheme.mutateAsync({
      id: platform.gradingSchemeId,
      payload: values,
    });
  });

  const onCreateCategory = categoryForm.handleSubmit(async (values) => {
    await mutations.createCategoryTemplate.mutateAsync(values);
    categoryForm.reset({ name: "", weight: 0, order: 1, description: "" });
    setShowCategoryForm(false);
  });

  const onCreateTerm = termForm.handleSubmit(async (values) => {
    await mutations.createTermTemplate.mutateAsync(values);
    termForm.reset({ name: "", weight: 0, order: 1, description: "" });
    setShowTermForm(false);
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/academic-evaluation" className="hover:underline">
              Evaluación académica
            </Link>
            {" / Parámetros de plataforma"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Parámetros generales de evaluación
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Defina la plantilla que heredarán todas las instituciones. Cada
            administrador puede personalizar su configuración local a partir de
            estos valores.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleInitializeEcuador}
          disabled={mutations.initializePlatformEcuador.isPending}
        >
          Cargar parámetros Ecuador
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Cargando configuración de plataforma…
        </p>
      ) : isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            No se pudo cargar la configuración de plataforma.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : !platform ? (
        <Card className="border-dashed border-border">
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay parámetros globales configurados.
            </p>
            <Button
              onClick={handleInitializeEcuador}
              disabled={mutations.initializePlatformEcuador.isPending}
            >
              Inicializar con parámetros Ecuador
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">
                  Esquema de calificación global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSaveScheme} className="grid gap-4">
                  <Field
                    label="Nombre"
                    error={schemeForm.formState.errors.name?.message}
                  >
                    <Input {...schemeForm.register("name")} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nota mínima"
                      error={schemeForm.formState.errors.minScore?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        {...schemeForm.register("minScore", {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                    <Field
                      label="Nota máxima"
                      error={schemeForm.formState.errors.maxScore?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        {...schemeForm.register("maxScore", {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                    <Field
                      label="Nota de aprobación"
                      error={schemeForm.formState.errors.passingScore?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        {...schemeForm.register("passingScore", {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                    <Field
                      label="Decimales del esquema"
                      error={schemeForm.formState.errors.decimalPlaces?.message}
                    >
                      <Input
                        type="number"
                        {...schemeForm.register("decimalPlaces", {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                  </div>
                  <Button
                    type="submit"
                    disabled={mutations.updatePlatformGradingScheme.isPending}
                  >
                    Guardar esquema
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">
                  Reglas de redondeo globales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSaveConfig} className="grid gap-4">
                  <Field
                    label="Estrategia de redondeo"
                    error={configForm.formState.errors.roundingStrategy?.message}
                  >
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...configForm.register("roundingStrategy")}
                    >
                      {Object.entries(ROUNDING_STRATEGY_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field
                    label="Decimales al calcular"
                    error={configForm.formState.errors.decimalPlaces?.message}
                  >
                    <Input
                      type="number"
                      {...configForm.register("decimalPlaces", {
                        valueAsNumber: true,
                      })}
                    />
                  </Field>
                  <Button
                    type="submit"
                    disabled={mutations.upsertPlatformConfig.isPending}
                  >
                    Guardar reglas
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {platform.gradingScheme.gradeScales &&
          platform.gradingScheme.gradeScales.length > 0 ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">
                  Escalas cualitativas (DAR / AAR / PAAR / NAAR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {platform.gradingScheme.gradeScales.map((scale) => (
                    <li
                      key={scale.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <span className="font-medium">{scale.code}</span>
                      <span className="text-muted-foreground">
                        {scale.description}
                      </span>
                      <span>
                        {scale.minValue} – {scale.maxValue}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium">
                  Plantillas de categorías de evaluación
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pesos sugeridos para insumos formativos y sumativos.
                </p>
              </div>
              <Button onClick={() => setShowCategoryForm((open) => !open)}>
                {showCategoryForm ? "Cancelar" : "Nueva plantilla"}
              </Button>
            </div>
            <WeightProgressBar
              label="Distribución de pesos (categorías)"
              total={categoryWeightTotal}
            />
            {showCategoryForm ? (
              <form
                onSubmit={onCreateCategory}
                className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2"
              >
                <Field
                  label="Nombre"
                  error={categoryForm.formState.errors.name?.message}
                >
                  <Input {...categoryForm.register("name")} />
                </Field>
                <Field
                  label="Peso (%)"
                  error={categoryForm.formState.errors.weight?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    {...categoryForm.register("weight", { valueAsNumber: true })}
                  />
                </Field>
                <Field
                  label="Orden"
                  error={categoryForm.formState.errors.order?.message}
                >
                  <Input
                    type="number"
                    {...categoryForm.register("order", { valueAsNumber: true })}
                  />
                </Field>
                <Field
                  label="Descripción"
                  error={categoryForm.formState.errors.description?.message}
                >
                  <Input {...categoryForm.register("description")} />
                </Field>
                <div className="flex items-end">
                  <Button type="submit">Guardar plantilla</Button>
                </div>
              </form>
            ) : null}
            <TemplateList
              items={platform.assessmentCategoryTemplates}
              emptyMessage="Sin plantillas de categorías."
              renderItem={(item) => (
                <CategoryTemplateRow
                  key={item.id}
                  item={item}
                  onDelete={(id) =>
                    mutations.deleteCategoryTemplate.mutateAsync(id)
                  }
                />
              )}
            />
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium">
                  Plantillas de períodos de evaluación
                </h2>
                <p className="text-sm text-muted-foreground">
                  Quimestres u otros términos ponderados del año lectivo.
                </p>
              </div>
              <Button onClick={() => setShowTermForm((open) => !open)}>
                {showTermForm ? "Cancelar" : "Nueva plantilla"}
              </Button>
            </div>
            <WeightProgressBar
              label="Distribución de pesos (períodos)"
              total={termWeightTotal}
            />
            {showTermForm ? (
              <form
                onSubmit={onCreateTerm}
                className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2"
              >
                <Field
                  label="Nombre"
                  error={termForm.formState.errors.name?.message}
                >
                  <Input {...termForm.register("name")} />
                </Field>
                <Field
                  label="Peso (%)"
                  error={termForm.formState.errors.weight?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    {...termForm.register("weight", { valueAsNumber: true })}
                  />
                </Field>
                <Field
                  label="Orden"
                  error={termForm.formState.errors.order?.message}
                >
                  <Input
                    type="number"
                    {...termForm.register("order", { valueAsNumber: true })}
                  />
                </Field>
                <Field
                  label="Descripción"
                  error={termForm.formState.errors.description?.message}
                >
                  <Input {...termForm.register("description")} />
                </Field>
                <div className="flex items-end">
                  <Button type="submit">Guardar plantilla</Button>
                </div>
              </form>
            ) : null}
            <TemplateList
              items={platform.evaluationTermTemplates}
              emptyMessage="Sin plantillas de períodos."
              renderItem={(item) => (
                <TermTemplateRow
                  key={item.id}
                  item={item}
                  onDelete={(id) => mutations.deleteTermTemplate.mutateAsync(id)}
                />
              )}
            />
          </section>
        </>
      )}
    </div>
  );
}

function CategoryTemplateRow({
  item,
  onDelete,
}: {
  item: AssessmentCategoryTemplate;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la plantilla "${item.name}"?`)) return;
    await onDelete(item.id);
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <p className="font-medium">{item.name}</p>
        {item.description ? (
          <p className="text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        <span>Orden {item.order}</span>
        <span>{item.weight}%</span>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          Eliminar
        </Button>
      </div>
    </li>
  );
}

function TermTemplateRow({
  item,
  onDelete,
}: {
  item: EvaluationTermTemplate;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la plantilla "${item.name}"?`)) return;
    await onDelete(item.id);
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <p className="font-medium">{item.name}</p>
        {item.description ? (
          <p className="text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        <span>Orden {item.order}</span>
        <span>{item.weight}%</span>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          Eliminar
        </Button>
      </div>
    </li>
  );
}

function TemplateList<T extends { id: string }>({
  items,
  emptyMessage,
  renderItem,
}: {
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => renderItem(item))}
    </ul>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
