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
import { Select } from "@/components/ui/select";
import { useAcademicLevels } from "@/features/academic-levels/hooks/use-academic-levels";
import {
  createGradeLevelSchema,
  type CreateGradeLevelInput,
} from "@/features/grade-levels/schemas/grade-level.schema";
import type { GradeLevel } from "@/features/grade-levels/types";
import { ApiError } from "@/lib/api-error";

interface GradeLevelFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<CreateGradeLevelInput>;
  onSubmit: (values: CreateGradeLevelInput) => Promise<void>;
  disabled?: boolean;
}

export function GradeLevelForm({
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
  disabled = false,
}: GradeLevelFormProps) {
  const { data: levelsData, isLoading: levelsLoading } = useAcademicLevels({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateGradeLevelInput>({
    resolver: zodResolver(createGradeLevelSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      order: defaultValues?.order ?? 1,
      description: defaultValues?.description ?? "",
      academicLevelId: defaultValues?.academicLevelId ?? "",
      institutionId: defaultValues?.institutionId ?? "",
      isSystem: defaultValues?.isSystem ?? false,
    },
  });

  const academicLevels = levelsData?.data ?? [];

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      const payload: CreateGradeLevelInput = {
        ...values,
        description: values.description?.trim() || undefined,
        institutionId: values.institutionId?.trim() || undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el grado. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof CreateGradeLevelInput;
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
            <Label htmlFor="academicLevelId">Nivel académico</Label>
            <Controller
              name="academicLevelId"
              control={control}
              render={({ field }) => (
                <Select
                  id="academicLevelId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled || levelsLoading}
                >
                  <option value="">
                    {levelsLoading ? "Cargando niveles…" : "Selecciona un nivel"}
                  </option>
                  {academicLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name} ({level.code})
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.academicLevelId ? (
              <p className="text-sm text-destructive">
                {errors.academicLevelId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Primer grado"
              disabled={disabled}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              placeholder="G1"
              disabled={disabled}
              {...register("code")}
            />
            {errors.code ? (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Orden</Label>
            <Input
              id="order"
              type="number"
              min={1}
              disabled={disabled}
              {...register("order", { valueAsNumber: true })}
            />
            {errors.order ? (
              <p className="text-sm text-destructive">{errors.order.message}</p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              disabled={disabled}
              {...register("description")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="institutionId">
              ID de institución (opcional)
            </Label>
            <Input
              id="institutionId"
              disabled={disabled}
              {...register("institutionId")}
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Controller
              name="isSystem"
              control={control}
              render={({ field }) => (
                <input
                  id="isSystem"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={field.value ?? false}
                  onChange={(event) => field.onChange(event.target.checked)}
                  onBlur={field.onBlur}
                  disabled={disabled}
                />
              )}
            />
            <Label htmlFor="isSystem">Grado del catálogo del sistema</Label>
          </div>

          {errors.root ? (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
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

export function gradeLevelToFormValues(level: GradeLevel): CreateGradeLevelInput {
  return {
    name: level.name,
    code: level.code,
    order: level.order,
    description: level.description ?? "",
    academicLevelId: level.academicLevelId,
    institutionId: level.institutionId ?? "",
    isSystem: level.isSystem,
  };
}
