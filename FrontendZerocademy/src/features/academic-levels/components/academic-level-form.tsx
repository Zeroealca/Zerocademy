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
import {
  createAcademicLevelSchema,
  type CreateAcademicLevelInput,
} from "@/features/academic-levels/schemas/academic-level.schema";
import type { AcademicLevel } from "@/features/academic-levels/types";
import { ApiError } from "@/lib/api-error";

interface AcademicLevelFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<CreateAcademicLevelInput>;
  onSubmit: (values: CreateAcademicLevelInput) => Promise<void>;
  disabled?: boolean;
}

export function AcademicLevelForm({
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
  disabled = false,
}: AcademicLevelFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAcademicLevelInput>({
    resolver: zodResolver(createAcademicLevelSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      order: defaultValues?.order ?? 1,
      description: defaultValues?.description ?? "",
      institutionId: defaultValues?.institutionId ?? "",
      isSystem: defaultValues?.isSystem ?? false,
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      const payload: CreateAcademicLevelInput = {
        ...values,
        description: values.description?.trim() || undefined,
        institutionId: values.institutionId?.trim() || undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el nivel académico. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof CreateAcademicLevelInput;
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
              placeholder="Educación General Básica"
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
              placeholder="EGB"
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
            {errors.description ? (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="institutionId">
              ID de institución (opcional)
            </Label>
            <Input
              id="institutionId"
              placeholder="UUID de la institución"
              disabled={disabled}
              {...register("institutionId")}
            />
            {errors.institutionId ? (
              <p className="text-sm text-destructive">
                {errors.institutionId.message}
              </p>
            ) : null}
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
            <Label htmlFor="isSystem">Nivel del catálogo del sistema</Label>
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

export function academicLevelToFormValues(
  level: AcademicLevel,
): CreateAcademicLevelInput {
  return {
    name: level.name,
    code: level.code,
    order: level.order,
    description: level.description ?? "",
    institutionId: level.institutionId ?? "",
    isSystem: level.isSystem,
  };
}
