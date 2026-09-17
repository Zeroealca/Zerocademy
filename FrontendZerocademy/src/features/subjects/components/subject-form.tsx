"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { useGradeLevels } from "@/features/grade-levels/hooks/use-grade-levels";
import {
  createSubjectSchema,
  type CreateSubjectInput,
} from "@/features/subjects/schemas/subject.schema";
import { ApiError } from "@/lib/api-error";

interface SubjectFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<CreateSubjectInput>;
  onSubmit: (values: CreateSubjectInput) => Promise<void>;
  disabled?: boolean;
  allowSystemSubject?: boolean;
}

export function SubjectForm({
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
  disabled = false,
  allowSystemSubject = true,
}: SubjectFormProps) {
  const { data: gradesData, isLoading: gradesLoading } = useGradeLevels({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      description: defaultValues?.description ?? "",
      isSystem: defaultValues?.isSystem ?? false,
      gradeLevelIds: defaultValues?.gradeLevelIds ?? [],
    },
  });

  const isSystem = watch("isSystem");
  const grades = gradesData?.data ?? [];

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      const payload: CreateSubjectInput = {
        name: values.name,
        code: values.code,
        description: values.description?.trim() || undefined,
        isSystem: values.isSystem,
        gradeLevelIds:
          values.isSystem || !values.gradeLevelIds?.length
            ? undefined
            : values.gradeLevelIds,
      };
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar la materia. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof CreateSubjectInput;
          setError(field, { message: String(detail.message) });
        });
      }

      setError("root", { message });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              {...register("name")}
              disabled={disabled}
              placeholder="Matemáticas"
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              {...register("code")}
              disabled={disabled}
              placeholder="MAT"
            />
            {errors.code ? (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            ) : null}
          </div>

          {allowSystemSubject ? <div className="space-y-2 flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                {...register("isSystem")}
                disabled={disabled}
              />
              Materia del catálogo del sistema
            </label>
          </div> : null}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              {...register("description")}
              disabled={disabled}
              placeholder="Opcional"
            />
            {errors.description ? (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {!isSystem ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Grados aplicables</Label>
              <Controller
                name="gradeLevelIds"
                control={control}
                render={({ field }) => (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                    {gradesLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Cargando grados…
                      </p>
                    ) : grades.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay grados activos disponibles.
                      </p>
                    ) : (
                      grades.map((grade) => {
                        const checked = field.value?.includes(grade.id) ?? false;

                        return (
                          <label
                            key={grade.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border"
                              checked={checked}
                              disabled={disabled}
                              onChange={(event) => {
                                const next = new Set(field.value ?? []);

                                if (event.target.checked) {
                                  next.add(grade.id);
                                } else {
                                  next.delete(grade.id);
                                }

                                field.onChange([...next]);
                              }}
                            />
                            {grade.name} ({grade.code})
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Las materias del sistema pueden vincularse a grados después de
              crearlas.
            </p>
          )}

          {errors.root ? (
            <p className="text-sm text-destructive sm:col-span-2">
              {errors.root.message}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={disabled || isSubmitting}>
              {isSubmitting ? "Guardando…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
