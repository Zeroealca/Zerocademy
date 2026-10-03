"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select } from "@/components/ui/select";
import {
  useStudentRepresentativeMutations,
  useStudentRepresentatives,
} from "@/features/representatives/hooks/use-representatives";
import type { RepresentativeRelationshipType } from "@/features/representatives/types";
import { useUsers } from "@/features/users/hooks/use-users";
import { ApiError } from "@/lib/api-error";
import { localizeApiMessage } from "@/lib/localize-api-message";

const RELATIONSHIP_LABELS: Record<RepresentativeRelationshipType, string> = {
  MOTHER: "Madre",
  FATHER: "Padre",
  LEGAL_GUARDIAN: "Representante legal",
  GRANDPARENT: "Abuelo/a",
  OTHER: "Otro",
};

const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIP_LABELS).map(
  ([value, label]) => ({ value, label }),
);

interface StudentRepresentativesPanelProps {
  studentId: string;
}

export function StudentRepresentativesPanel({
  studentId,
}: StudentRepresentativesPanelProps) {
  const relationships = useStudentRepresentatives(studentId);
  const { createMutation, updateMutation, deactivateMutation } =
    useStudentRepresentativeMutations(studentId);
  const [representativeUserId, setRepresentativeUserId] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<RepresentativeRelationshipType>("LEGAL_GUARDIAN");
  const [isPrimary, setIsPrimary] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const users = useUsers({
    page: 1,
    limit: 50,
    role: "REPRESENTATIVE",
    isActive: true,
  });

  const linkedUserIds = useMemo(
    () =>
      new Set(
        (relationships.data ?? [])
          .filter((item) => item.isActive)
          .map((item) => item.representativeUserId),
      ),
    [relationships.data],
  );

  const representativeOptions = (users.data?.data ?? [])
    .filter((user) => !linkedUserIds.has(user.id))
    .map((user) => ({
      value: user.id,
      label: `${user.firstName} ${user.lastName} · ${user.email}`,
    }));

  const handleCreate = async () => {
    setFormError(null);
    setActionMessage(null);
    if (!representativeUserId) {
      setFormError("Selecciona un representante.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        representativeUserId,
        relationshipType,
        isPrimary,
      });
      setRepresentativeUserId("");
      setIsPrimary(false);
      setActionMessage("Representante asociado correctamente.");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? localizeApiMessage(error.message)
          : "No se pudo asociar el representante.",
      );
    }
  };

  return (
    <section className="space-y-4 border-t border-border pt-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Representantes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Asocia cuentas de representante a este estudiante. Solo los vínculos
          activos conceden acceso de consulta.
        </p>
      </div>

      {relationships.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Cargando representantes…
        </p>
      ) : relationships.isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudieron cargar los representantes.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void relationships.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : relationships.data?.length ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {relationships.data.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {item.representativeFullName ?? "Representante"}
                  {item.isPrimary ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      Principal
                    </span>
                  ) : null}
                  {!item.isActive ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      Inactivo
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.representativeEmail ?? "Sin correo"} ·{" "}
                  {RELATIONSHIP_LABELS[item.relationshipType]}
                </p>
              </div>
              {item.isActive ? (
                <div className="flex flex-wrap gap-2">
                  <Select
                    aria-label="Tipo de relación"
                    value={item.relationshipType}
                    onChange={(event) => {
                      setActionMessage(null);
                      void updateMutation
                        .mutateAsync({
                          relationshipId: item.id,
                          payload: {
                            relationshipType: event.target
                              .value as RepresentativeRelationshipType,
                            isPrimary: item.isPrimary,
                          },
                        })
                        .then(() =>
                          setActionMessage("Relación actualizada."),
                        )
                        .catch((error: unknown) =>
                          setFormError(
                            error instanceof ApiError
                              ? localizeApiMessage(error.message)
                              : "No se pudo actualizar la relación.",
                          ),
                        );
                    }}
                  >
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  {!item.isPrimary ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateMutation.isPending}
                      onClick={() => {
                        setActionMessage(null);
                        void updateMutation
                          .mutateAsync({
                            relationshipId: item.id,
                            payload: {
                              relationshipType: item.relationshipType,
                              isPrimary: true,
                            },
                          })
                          .then(() =>
                            setActionMessage(
                              "Representante marcado como principal.",
                            ),
                          )
                          .catch((error: unknown) =>
                            setFormError(
                              error instanceof ApiError
                                ? localizeApiMessage(error.message)
                                : "No se pudo marcar como principal.",
                            ),
                          );
                      }}
                    >
                      Marcar principal
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deactivateMutation.isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "¿Desactivar esta asociación? El representante perderá el acceso.",
                        )
                      ) {
                        return;
                      }
                      setActionMessage(null);
                      void deactivateMutation
                        .mutateAsync(item.id)
                        .then(() =>
                          setActionMessage("Asociación desactivada."),
                        )
                        .catch((error: unknown) =>
                          setFormError(
                            error instanceof ApiError
                              ? localizeApiMessage(error.message)
                              : "No se pudo desactivar la asociación.",
                          ),
                        );
                    }}
                  >
                    Desactivar
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Este estudiante aún no tiene representantes asociados.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="representativeUserId">Asociar representante</Label>
          <SearchableSelect
            id="representativeUserId"
            value={representativeUserId}
            onChange={(event) => setRepresentativeUserId(event.target.value)}
            loading={users.isLoading}
            placeholder="Seleccionar representante existente"
            searchPlaceholder="Buscar por nombre o correo…"
            emptyLabel="No hay representantes disponibles"
            options={representativeOptions}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="relationshipType">Tipo de relación</Label>
          <Select
            id="relationshipType"
            value={relationshipType}
            onChange={(event) =>
              setRelationshipType(
                event.target.value as RepresentativeRelationshipType,
              )
            }
          >
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            id="isPrimary"
            type="checkbox"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
            className="size-4 rounded border-border"
          />
          <Label htmlFor="isPrimary">Marcar como principal</Label>
        </div>
        <div className="sm:col-span-2">
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={createMutation.isPending || users.isLoading}
          >
            {createMutation.isPending ? "Asociando…" : "Asociar representante"}
          </Button>
        </div>
      </div>

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}
      {actionMessage ? (
        <p className="text-sm text-muted-foreground">{actionMessage}</p>
      ) : null}
    </section>
  );
}
