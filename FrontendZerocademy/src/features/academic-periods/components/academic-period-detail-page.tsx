"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcademicTermsPanel } from "@/features/academic-periods/components/academic-terms-panel";
import {
  REGIME_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
} from "@/features/academic-periods/constants";
import { useAcademicPeriod } from "@/features/academic-periods/hooks/use-academic-period";
import {
  useActivateAcademicPeriod,
  useArchiveAcademicPeriod,
  useDeactivateAcademicPeriod,
  useDeleteAcademicPeriod,
} from "@/features/academic-periods/hooks/use-academic-period-mutations";
import type { AcademicPeriod } from "@/features/academic-periods/types";
import {
  canManageAcademicPeriods,
  canViewAcademicPeriods,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface AcademicPeriodDetailPageProps {
  periodId: string;
}

export function AcademicPeriodDetailPage({
  periodId,
}: AcademicPeriodDetailPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const canManage = canManageAcademicPeriods(currentUser?.role);
  const { data: period, isLoading, isError, refetch } = useAcademicPeriod(periodId);

  const activate = useActivateAcademicPeriod();
  const deactivate = useDeactivateAcademicPeriod();
  const archive = useArchiveAcademicPeriod();
  const remove = useDeleteAcademicPeriod();

  if (!canViewAcademicPeriods(currentUser?.role)) {
    return <AccessDenied />;
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando período académico…</p>
    );
  }

  if (isError || !period) {
    return (
      <PeriodLoadError refetch={refetch} />
    );
  }

  const handleDelete = async () => {
    if (
      !window.confirm(
        "¿Eliminar este período académico? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    await remove.mutateAsync(period.id);
    router.push("/academic-periods");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/academic-periods">← Volver al listado</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{period.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {REGIME_LABELS[period.regime]} · {period.startDate} → {period.endDate}
          </p>
        </div>

        {canManage ? (
          <PeriodActions
            period={period}
            activate={activate}
            deactivate={deactivate}
            archive={archive}
            remove={remove}
            onDelete={handleDelete}
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen</CardTitle>
          <CardDescription>
            Estado del período y metadatos del calendario
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant={STATUS_VARIANTS[period.status]}>
            {STATUS_LABELS[period.status]}
          </Badge>
          <Badge variant="secondary">{REGIME_LABELS[period.regime]}</Badge>
          {period.isActive ? (
            <Badge variant="success">Activo actualmente</Badge>
          ) : (
            <Badge variant="muted">Inactivo</Badge>
          )}
        </CardContent>
      </Card>

      <AcademicTermsPanel period={period} />
    </div>
  );
}

function PeriodActions({
  period,
  activate,
  deactivate,
  archive,
  remove,
  onDelete,
}: {
  period: AcademicPeriod;
  activate: ReturnType<typeof useActivateAcademicPeriod>;
  deactivate: ReturnType<typeof useDeactivateAcademicPeriod>;
  archive: ReturnType<typeof useArchiveAcademicPeriod>;
  remove: ReturnType<typeof useDeleteAcademicPeriod>;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {period.status === "PLANNED" || period.status === "CLOSED" ? (
        <Button
          size="sm"
          disabled={activate.isPending}
          onClick={() => activate.mutate(period.id)}
        >
          {activate.isPending ? "Activando…" : "Activar"}
        </Button>
      ) : null}
      {period.status === "ACTIVE" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={deactivate.isPending}
          onClick={() => deactivate.mutate(period.id)}
        >
          {deactivate.isPending ? "Desactivando…" : "Desactivar"}
        </Button>
      ) : null}
      {period.status !== "ACTIVE" && period.status !== "ARCHIVED" ? (
        <>
          <Button asChild size="sm" variant="outline">
            <Link href={`/academic-periods/${period.id}/edit`}>Editar</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={archive.isPending}
            onClick={() => archive.mutate(period.id)}
          >
            {archive.isPending ? "Archivando…" : "Archivar"}
          </Button>
          {period.status === "PLANNED" ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={remove.isPending}
              onClick={onDelete}
            >
              {remove.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function PeriodLoadError({ refetch }: { refetch: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-destructive">
        No se pudo cargar el período académico.
      </p>
      <Button variant="outline" onClick={() => refetch()}>
        Reintentar
      </Button>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <p className="text-sm text-muted-foreground">
        No tienes permiso para ver esta página.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
