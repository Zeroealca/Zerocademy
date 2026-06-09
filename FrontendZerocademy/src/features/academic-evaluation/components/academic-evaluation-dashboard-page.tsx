"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstitutionScopeSelector } from "@/features/academic-evaluation/components/institution-scope-selector";
import { WeightProgressBar } from "@/features/academic-evaluation/components/weight-progress-bar";
import {
  useAcademicEvaluationMutations,
  useEvaluationPreview,
} from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import {
  canManageAcademicEvaluation,
  canManagePlatformAcademicEvaluation,
  canViewAcademicEvaluation,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const NAV_ITEMS = [
  {
    href: "/academic-evaluation/grading-schemes",
    title: "Esquemas de calificación",
    description: "Rangos numéricos, nota de aprobación y escalas cualitativas.",
  },
  {
    href: "/academic-evaluation/evaluation-terms",
    title: "Períodos de evaluación",
    description: "Términos ponderados para el cálculo de notas finales.",
  },
  {
    href: "/academic-evaluation/assessment-categories",
    title: "Categorías de evaluación",
    description: "Pesos de exámenes, tareas, proyectos y otros insumos.",
  },
  {
    href: "/academic-evaluation/configuration",
    title: "Configuración institucional",
    description: "Esquema activo, redondeo y período académico operativo.",
  },
];

export function AcademicEvaluationDashboardPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [institutionId, setInstitutionId] = useState("");
  const { data: preview, isLoading, isError, refetch } = useEvaluationPreview(
    institutionId || undefined,
    effectivePeriodId,
  );
  const mutations = useAcademicEvaluationMutations();

  useEffect(() => {
    const stored = sessionStorage.getItem("academic-evaluation-institution-id");
    if (stored) {
      setInstitutionId(stored);
    }
  }, []);

  useEffect(() => {
    if (institutionId) {
      sessionStorage.setItem("academic-evaluation-institution-id", institutionId);
    }
  }, [institutionId]);

  if (!canViewAcademicEvaluation(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageAcademicEvaluation(currentUser?.role);
  const canManagePlatform = canManagePlatformAcademicEvaluation(
    currentUser?.role,
  );

  const handleApplyPlatformDefaults = async () => {
    if (!institutionId) return;

    if (
      !window.confirm(
        "¿Aplicar la plantilla de evaluación de la plataforma a esta institución? Se copiarán esquema, categorías y períodos.",
      )
    ) {
      return;
    }

    await mutations.applyPlatformDefaultsInstitution.mutateAsync(institutionId);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Evaluación académica
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Motor configurable de calificaciones para notas, boletines, promoción
            e informes. Ecuador se ofrece como plantilla predeterminada, no como
            regla fija del sistema.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManagePlatform ? (
            <Button asChild variant="secondary">
              <Link href="/academic-evaluation/platform">
                Parámetros de plataforma
              </Link>
            </Button>
          ) : null}
          {canManage && institutionId ? (
            <Button
              variant="outline"
              onClick={handleApplyPlatformDefaults}
              disabled={mutations.applyPlatformDefaultsInstitution.isPending}
            >
              Aplicar plantilla de plataforma
            </Button>
          ) : null}
        </div>
      </header>

      <InstitutionScopeSelector value={institutionId} onChange={setInstitutionId} />

      {!institutionId ? (
        <EmptyState message="Seleccione una institución para ver la vista previa de configuración." />
      ) : isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <PreviewPanel preview={preview ?? null} />
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Card key={item.href} className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <Button asChild variant="secondary" size="sm">
                <Link href={item.href}>Administrar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function PreviewPanel({
  preview,
}: {
  preview: {
    activeGradingScheme: { name: string; minScore: number; maxScore: number; passingScore: number } | null;
    evaluationTermWeightTotal: number;
    assessmentCategoryWeightTotal: number;
    evaluationTerms: Array<{ name: string; weight: number }>;
    assessmentCategories: Array<{ name: string; weight: number }>;
  } | null;
}) {
  if (!preview) {
    return (
      <EmptyState message="No se pudo cargar la vista previa de configuración." />
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">Vista previa de configuración</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Esquema activo</h3>
          {preview.activeGradingScheme ? (
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Nombre</dt>
                <dd>{preview.activeGradingScheme.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Rango</dt>
                <dd>
                  {preview.activeGradingScheme.minScore} –{" "}
                  {preview.activeGradingScheme.maxScore}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Aprobación</dt>
                <dd>{preview.activeGradingScheme.passingScore}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin esquema configurado para la institución.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <WeightProgressBar
            label="Peso de períodos de evaluación"
            total={preview.evaluationTermWeightTotal}
          />
          <WeightProgressBar
            label="Peso de categorías de evaluación"
            total={preview.assessmentCategoryWeightTotal}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AccessDenied() {
  return (
    <p className="text-sm text-muted-foreground" role="alert">
      No tiene permisos para ver la configuración de evaluación académica.
    </p>
  );
}

function LoadingState() {
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      Cargando vista previa…
    </p>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-destructive" role="alert">
        No se pudo cargar la vista previa de configuración.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
