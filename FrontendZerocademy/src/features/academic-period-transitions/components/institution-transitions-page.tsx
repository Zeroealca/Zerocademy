"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InstitutionContextNav } from "@/features/institutions/components/institution-context-nav";
import { useInstitution } from "@/features/institutions/hooks/use-institution";
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import { ActiveAcademicPeriodCard } from "@/features/academic-period-transitions/components/active-academic-period-card";
import { AcademicTransitionHistoryTable } from "@/features/academic-period-transitions/components/academic-transition-history-table";
import { AcademicTransitionWizard } from "@/features/academic-period-transitions/components/academic-transition-wizard";
import { useActiveAcademicPeriod } from "@/features/academic-period-transitions/hooks/use-active-academic-period";
import { useAcademicTransitionHistory } from "@/features/academic-period-transitions/hooks/use-academic-transition-history";
import {
  canManageAcademicTransitions,
  canViewAcademicTransitions,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface InstitutionTransitionsPageProps {
  institutionId: string;
}

export function InstitutionTransitionsPage({
  institutionId,
}: InstitutionTransitionsPageProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 10;

  const { data: institution, isLoading: institutionLoading } =
    useInstitution(institutionId);
  const { data: activeData, isLoading: activeLoading, refetch: refetchActive } =
    useActiveAcademicPeriod(institutionId);
  const { data: periodsData, isLoading: periodsLoading } = useAcademicPeriods({
    page: 1,
    limit: 100,
    institutionId,
  });
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useAcademicTransitionHistory(institutionId, historyPage, historyLimit);

  if (!canViewAcademicTransitions(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageAcademicTransitions(currentUser?.role);
  const periods = periodsData?.data ?? [];

  const handleTransitionComplete = () => {
    void refetchActive();
    void refetchHistory();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/institutions" className="hover:text-foreground">
              Instituciones
            </Link>
            {" / "}
            {institutionLoading ? "…" : institution?.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Transiciones de período académico
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cambia de año lectivo conservando estructuras reutilizables y el
            historial de períodos anteriores.
          </p>
        </div>
        <InstitutionContextNav institutionId={institutionId} />
      </header>

      <ActiveAcademicPeriodCard
        institutionId={institutionId}
        activeData={activeData}
        isLoading={activeLoading || periodsLoading}
        periods={periods}
        canManage={canManage}
      />

      {canManage ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Asistente de transición</h2>
          {periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crea al menos un período académico vinculado a esta institución
              antes de ejecutar una transición.
            </p>
          ) : (
            <AcademicTransitionWizard
              institutionId={institutionId}
              periods={periods}
              onExecuted={handleTransitionComplete}
            />
          )}
        </section>
      ) : null}

      <AcademicTransitionHistoryTable
        transitions={historyData?.data ?? []}
        meta={
          historyData?.meta ?? {
            page: historyPage,
            limit: historyLimit,
            total: 0,
            totalPages: 0,
          }
        }
        isLoading={historyLoading}
        isError={historyError}
        onRetry={() => refetchHistory()}
        onPageChange={setHistoryPage}
      />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <p className="text-sm text-muted-foreground">
        No tienes permiso para ver transiciones académicas.
      </p>
      <Button asChild variant="outline">
        <Link href="/institutions">Volver a instituciones</Link>
      </Button>
    </div>
  );
}
