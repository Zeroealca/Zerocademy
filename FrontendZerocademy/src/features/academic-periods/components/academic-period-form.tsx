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
import {
  ACADEMIC_REGIMES,
  REGIME_LABELS,
} from "@/features/academic-periods/constants";
import {
  createAcademicPeriodSchema,
  type CreateAcademicPeriodInput,
} from "@/features/academic-periods/schemas/academic-period.schema";
import type { AcademicPeriod } from "@/features/academic-periods/types";
import { ApiError } from "@/lib/api-error";

interface AcademicPeriodFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<CreateAcademicPeriodInput>;
  onSubmit: (values: CreateAcademicPeriodInput) => Promise<void>;
  disabled?: boolean;
}

export function AcademicPeriodForm({
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
  disabled = false,
}: AcademicPeriodFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAcademicPeriodInput>({
    resolver: zodResolver(createAcademicPeriodSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      regime: defaultValues?.regime ?? "COSTA_GALAPAGOS",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el período académico. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof CreateAcademicPeriodInput;
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
            <Label htmlFor="name">Nombre del período</Label>
            <Input
              id="name"
              placeholder="2025-2026"
              disabled={disabled}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <RegimeField
            control={control}
            disabled={disabled}
            error={errors.regime?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input
              id="startDate"
              type="date"
              disabled={disabled}
              {...register("startDate")}
            />
            {errors.startDate ? (
              <p className="text-sm text-destructive">
                {errors.startDate.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha de fin</Label>
            <Input
              id="endDate"
              type="date"
              disabled={disabled}
              {...register("endDate")}
            />
            {errors.endDate ? (
              <p className="text-sm text-destructive">
                {errors.endDate.message}
              </p>
            ) : null}
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

function RegimeField({
  control,
  disabled,
  error,
}: {
  control: ReturnType<typeof useForm<CreateAcademicPeriodInput>>["control"];
  disabled: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="regime">Régimen educativo</Label>
      <Controller
        name="regime"
        control={control}
        render={({ field }) => (
          <Select
            id="regime"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
          >
            {ACADEMIC_REGIMES.map((regime) => (
              <option key={regime} value={regime}>
                {REGIME_LABELS[regime]}
              </option>
            ))}
          </Select>
        )}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function academicPeriodToFormValues(
  period: AcademicPeriod,
): CreateAcademicPeriodInput {
  return {
    name: period.name,
    regime: period.regime,
    startDate: period.startDate,
    endDate: period.endDate,
  };
}
