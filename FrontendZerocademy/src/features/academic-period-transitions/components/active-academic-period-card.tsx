"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { STATUS_LABELS } from "@/features/academic-periods/constants";
import type { AcademicPeriod } from "@/features/academic-periods/types";
import { useAcademicTransitionMutations } from "@/features/academic-period-transitions/hooks/use-academic-transition-mutations";
import type { ActiveAcademicPeriodResponse } from "@/features/academic-period-transitions/types";

interface ActiveAcademicPeriodCardProps {
  institutionId: string;
  activeData?: ActiveAcademicPeriodResponse;
  isLoading: boolean;
  periods: AcademicPeriod[];
  canManage: boolean;
}

export function ActiveAcademicPeriodCard({
  institutionId,
  activeData,
  isLoading,
  periods,
  canManage,
}: ActiveAcademicPeriodCardProps) {
  const { setActivePeriodMutation } = useAcademicTransitionMutations(institutionId);
  const activePeriod = activeData?.activePeriod ?? null;

  const handleSetActive = async (periodId: string) => {
    if (!periodId || periodId === activePeriod?.id) return;
    const period = periods.find((p) => p.id === periodId);
    const label = period ? formatAcademicPeriodOptionLabel(period) : periodId;
    const confirmed = window.confirm(
      `¿Establecer «${label}» como período académico activo de la institución?`,
    );
    if (!confirmed) return;
    await setActivePeriodMutation.mutateAsync({ academicPeriodId: periodId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Período académico activo</CardTitle>
        <CardDescription>
          Solo un período puede estar activo por institución. Los datos históricos
          de períodos anteriores se conservan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando período activo…</p>
        ) : activePeriod ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {formatAcademicPeriodOptionLabel(activePeriod)}
            </span>
            <Badge variant="default">{STATUS_LABELS[activePeriod.status]}</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay período académico activo configurado para esta institución.
          </p>
        )}

        {canManage ? (
          <div className="space-y-2 max-w-md">
            <Label htmlFor="active-period-select">Cambiar período activo</Label>
            <Select
              id="active-period-select"
              defaultValue=""
              onChange={(event) => {
                const nextId = event.target.value;
                event.target.value = "";
                void handleSetActive(nextId);
              }}
              disabled={setActivePeriodMutation.isPending}
            >
              <option value="" disabled hidden>
                Elegir otro período…
              </option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {formatAcademicPeriodOptionLabel(period)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
