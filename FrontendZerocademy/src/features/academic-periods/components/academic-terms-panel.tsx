"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import {
  type FieldErrors,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAcademicTerms,
  useCreateAcademicTerm,
  useDeleteAcademicTerm,
  useUpdateAcademicTerm,
} from "@/features/academic-periods/hooks/use-academic-terms";
import {
  createAcademicTermSchema,
  type CreateAcademicTermInput,
} from "@/features/academic-periods/schemas/academic-period.schema";
import type { AcademicPeriod, AcademicTerm } from "@/features/academic-periods/types";
import { ApiError } from "@/lib/api-error";
import { canManageAcademicPeriods } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface AcademicTermsPanelProps {
  period: AcademicPeriod;
}

export function AcademicTermsPanel({ period }: AcademicTermsPanelProps) {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = canManageAcademicPeriods(currentUser?.role);
  const { data: terms, isLoading, isError, refetch } = useAcademicTerms(period.id);
  const createTerm = useCreateAcademicTerm(period.id);
  const deleteTerm = useDeleteAcademicTerm(period.id);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  const sortedTerms = [...(terms ?? period.terms ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const nextOrder = sortedTerms.length + 1;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAcademicTermInput>({
    resolver: zodResolver(createAcademicTermSchema),
    defaultValues: {
      name: "",
      order: nextOrder,
      startDate: period.startDate,
      endDate: period.endDate,
    },
  });

  useEffect(() => {
    reset((current) => ({
      ...current,
      order: nextOrder,
    }));
  }, [nextOrder, reset]);

  const onCreateTerm = handleSubmit(async (values) => {
    try {
      await createTerm.mutateAsync(values);
      reset({
        name: "",
        order: sortedTerms.length + 2,
        startDate: period.startDate,
        endDate: period.endDate,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el trimestre. Inténtalo de nuevo.";
      setError("root", { message });
    }
  });

  const handleDelete = async (termId: string) => {
    if (
      !window.confirm(
        "¿Eliminar este trimestre? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setDeletingId(termId);
    try {
      await deleteTerm.mutateAsync(termId);
      if (editingTermId === termId) {
        setEditingTermId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trimestres / quimestres</CardTitle>
        <CardDescription>
          Unidades dentro de {period.name}. Las fechas deben estar dentro del
          rango del período ({period.startDate} → {period.endDate}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando trimestres…</p>
        ) : null}

        {isError ? (
          <TermsErrorState refetch={refetch} />
        ) : null}

        {!isLoading && !isError ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Fechas</th>
                  {canManage ? (
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sortedTerms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManage ? 4 : 3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Aún no hay trimestres configurados.
                    </td>
                  </tr>
                ) : (
                  sortedTerms.map((term) =>
                    editingTermId === term.id && canManage ? (
                      <TermEditRow
                        key={term.id}
                        periodId={period.id}
                        term={term}
                        onCancel={() => setEditingTermId(null)}
                        onSaved={() => setEditingTermId(null)}
                      />
                    ) : (
                      <TermViewRow
                        key={term.id}
                        term={term}
                        canManage={canManage}
                        isDeleting={deletingId === term.id}
                        onEdit={() => setEditingTermId(term.id)}
                        onDelete={() => handleDelete(term.id)}
                      />
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {canManage && period.status !== "ARCHIVED" ? (
          <form
            onSubmit={onCreateTerm}
            className="grid gap-4 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2"
          >
            <p className="text-sm font-medium sm:col-span-2">Añadir trimestre</p>
            <TermFormFields
              register={register}
              errors={errors}
              idPrefix="create"
            />
            {errors.root ? (
              <p className="text-sm text-destructive sm:col-span-2" role="alert">
                {errors.root.message}
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Añadiendo…" : "Añadir trimestre"}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TermsErrorState({ refetch }: { refetch: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-destructive">
        No se pudieron cargar los trimestres.
      </p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Reintentar
      </Button>
    </div>
  );
}

function TermViewRow({
  term,
  canManage,
  isDeleting,
  onEdit,
  onDelete,
}: {
  term: AcademicTerm;
  canManage: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <Badge variant="secondary">{term.order}</Badge>
      </td>
      <td className="px-4 py-3 font-medium">{term.name}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {term.startDate} → {term.endDate}
      </td>
      {canManage ? (
        <td className="px-4 py-3 text-right">
          <TermRowActions
            isDeleting={isDeleting}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </td>
      ) : null}
    </tr>
  );
}

function TermRowActions({
  isDeleting,
  onEdit,
  onDelete,
}: {
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={onEdit} disabled={isDeleting}>
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isDeleting}
        onClick={onDelete}
      >
        {isDeleting ? "Eliminando…" : "Eliminar"}
      </Button>
    </div>
  );
}

function TermEditRow({
  periodId,
  term,
  onCancel,
  onSaved,
}: {
  periodId: string;
  term: AcademicTerm;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const updateTerm = useUpdateAcademicTerm(periodId);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAcademicTermInput>({
    resolver: zodResolver(createAcademicTermSchema),
    defaultValues: {
      name: term.name,
      order: term.order,
      startDate: term.startDate,
      endDate: term.endDate,
    },
  });

  const onSave = handleSubmit(async (values) => {
    try {
      await updateTerm.mutateAsync({ termId: term.id, payload: values });
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el trimestre. Inténtalo de nuevo.";
      setError("root", { message });
    }
  });

  return (
    <tr className="border-b border-border bg-muted/20">
      <td colSpan={4} className="px-4 py-4">
        <form onSubmit={onSave} className="space-y-4">
          <p className="text-sm font-medium">Editar trimestre</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TermFormFields
              register={register}
              errors={errors}
              idPrefix={`edit-${term.id}`}
            />
          </div>
          {errors.root ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function TermFormFields({
  register,
  errors,
  idPrefix,
}: {
  register: UseFormRegister<CreateAcademicTermInput>;
  errors: FieldErrors<CreateAcademicTermInput>;
  idPrefix: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Nombre</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="Primer quimestre"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-order`}>Orden</Label>
        <Input
          id={`${idPrefix}-order`}
          type="number"
          min={1}
          {...register("order", { valueAsNumber: true })}
        />
        {errors.order ? (
          <p className="text-sm text-destructive">{errors.order.message}</p>
        ) : null}
      </div>

      <TermDateFields
        register={register}
        errors={errors}
        idPrefix={idPrefix}
      />
    </>
  );
}

function TermDateFields({
  register,
  errors,
  idPrefix,
}: {
  register: UseFormRegister<CreateAcademicTermInput>;
  errors: FieldErrors<CreateAcademicTermInput>;
  idPrefix: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-start`}>Fecha de inicio</Label>
        <Input
          id={`${idPrefix}-start`}
          type="date"
          {...register("startDate")}
        />
        {errors.startDate ? (
          <p className="text-sm text-destructive">{errors.startDate.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-end`}>Fecha de fin</Label>
        <Input id={`${idPrefix}-end`} type="date" {...register("endDate")} />
        {errors.endDate ? (
          <p className="text-sm text-destructive">{errors.endDate.message}</p>
        ) : null}
      </div>
    </>
  );
}
