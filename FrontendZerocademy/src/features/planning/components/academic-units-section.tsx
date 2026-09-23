"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcademicUnitForm } from "@/features/planning/components/academic-unit-form";
import { LessonPlansSection } from "@/features/planning/components/lesson-plans-section";
import {
  useAcademicUnits,
  useCreateAcademicUnit,
  useDeleteAcademicUnit,
  useReorderAcademicUnits,
  useUpdateAcademicUnit,
} from "@/features/planning/hooks/use-academic-units";
import type { AcademicUnit, AcademicUnitInput } from "@/features/planning/types";
import { ApiError } from "@/lib/api-error";

interface AcademicUnitsSectionProps {
  academicPlanEndDate: string | null;
  academicPlanId: string;
  academicPlanStartDate: string | null;
  canManage: boolean;
}

export function AcademicUnitsSection({
  academicPlanEndDate,
  academicPlanId,
  academicPlanStartDate,
  canManage,
}: AcademicUnitsSectionProps) {
  const unitsQuery = useAcademicUnits(academicPlanId);
  const createUnit = useCreateAcademicUnit();
  const updateUnit = useUpdateAcademicUnit();
  const deleteUnit = useDeleteAcademicUnit();
  const reorderUnits = useReorderAcademicUnits();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AcademicUnit | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const units = [...(unitsQuery.data ?? [])].sort((left, right) => left.position - right.position);

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async (values: AcademicUnitInput) => {
    setActionError(null);
    if (editing) {
      await updateUnit.mutateAsync({
        academicPlanId,
        academicUnitId: editing.id,
        payload: values,
      });
    } else {
      await createUnit.mutateAsync({ academicPlanId, payload: values });
    }
    closeForm();
  };

  const remove = async (unit: AcademicUnit) => {
    if (!window.confirm(`¿Eliminar la unidad «${unit.title}»?`)) return;
    setActionError(null);
    try {
      await deleteUnit.mutateAsync({ academicPlanId, academicUnitId: unit.id });
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No se pudo eliminar la unidad.");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const nextUnits = [...units];
    [nextUnits[index], nextUnits[index + direction]] = [
      nextUnits[index + direction],
      nextUnits[index],
    ];
    setActionError(null);
    try {
      await reorderUnits.mutateAsync({
        academicPlanId,
        payload: { unitIds: nextUnits.map((unit) => unit.id) },
      });
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No se pudo reordenar las unidades.");
    }
  };

  if (unitsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando unidades…</p>;
  }

  if (unitsQuery.isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          No se pudieron cargar las unidades. {" "}
          <Button onClick={() => unitsQuery.refetch()} variant="link">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="academic-units-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" id="academic-units-heading">
            Unidades académicas
          </h2>
          <p className="text-sm text-muted-foreground">
            Organiza el contenido del plan en el orden pedagógico previsto.
          </p>
        </div>
        {canManage && !creating && !editing ? (
          <Button onClick={() => setCreating(true)}>Añadir unidad</Button>
        ) : null}
      </div>

      {creating || editing ? (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Editar unidad" : "Nueva unidad"}</CardTitle>
          </CardHeader>
          <CardContent>
            <AcademicUnitForm
              academicPlanEndDate={academicPlanEndDate}
              academicPlanStartDate={academicPlanStartDate}
              onCancel={closeForm}
              onSubmit={save}
              submitLabel={editing ? "Guardar cambios" : "Crear unidad"}
              unit={editing ?? undefined}
            />
          </CardContent>
        </Card>
      ) : null}

      {actionError ? <p className="text-sm text-destructive" role="alert">{actionError}</p> : null}

      {!units.length ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Este plan todavía no tiene unidades.
            {canManage ? (
              <div className="mt-3">
                <Button onClick={() => setCreating(true)}>Crear primera unidad</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {units.map((unit, index) => (
            <Card key={unit.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Unidad {unit.position}</p>
                  <h3 className="font-semibold">{unit.title}</h3>
                  {unit.startDate || unit.endDate ? (
                    <p className="text-sm text-muted-foreground">
                      {unit.startDate ?? "Sin fecha de inicio"}
                      {unit.endDate ? ` – ${unit.endDate}` : ""}
                    </p>
                  ) : null}
                  {unit.description ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {unit.description}
                    </p>
                  ) : null}
                </div>
                {canManage ? (
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      aria-label={`Subir ${unit.title}`}
                      disabled={index === 0 || reorderUnits.isPending}
                      onClick={() => move(index, -1)}
                      size="sm"
                      variant="outline"
                    >
                      Subir
                    </Button>
                    <Button
                      aria-label={`Bajar ${unit.title}`}
                      disabled={index === units.length - 1 || reorderUnits.isPending}
                      onClick={() => move(index, 1)}
                      size="sm"
                      variant="outline"
                    >
                      Bajar
                    </Button>
                    <Button onClick={() => setEditing(unit)} size="sm" variant="outline">
                      Editar
                    </Button>
                    <Button
                      disabled={deleteUnit.isPending}
                      onClick={() => remove(unit)}
                      size="sm"
                      variant="destructive"
                    >
                      Eliminar
                    </Button>
                  </div>
                ) : null}
                </div>
                <LessonPlansSection
                  academicPlanId={academicPlanId}
                  academicUnit={unit}
                  canManage={canManage}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
