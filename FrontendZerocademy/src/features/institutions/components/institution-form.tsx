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
import { InstitutionColorPicker } from "@/features/institutions/components/institution-color-picker";
import {
  ACADEMIC_REGIMES,
  INSTITUTION_REGIONS,
  REGIME_LABELS,
  REGION_LABELS,
} from "@/features/institutions/constants";
import {
  institutionFormSchema,
  type InstitutionFormValues,
} from "@/features/institutions/schemas/institution.schema";
import type { Institution } from "@/features/institutions/types";
import { ApiError } from "@/lib/api-error";

interface InstitutionFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<InstitutionFormValues>;
  codeDisabled?: boolean;
  onSubmit: (values: InstitutionFormValues) => Promise<void>;
  disabled?: boolean;
}

export function InstitutionForm({
  title,
  description,
  submitLabel,
  defaultValues,
  codeDisabled = false,
  onSubmit,
  disabled = false,
}: InstitutionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      address: defaultValues?.address ?? "",
      region: defaultValues?.region ?? "",
      regime: defaultValues?.regime ?? "",
      primaryColor: defaultValues?.primaryColor ?? "",
      secondaryColor: defaultValues?.secondaryColor ?? "",
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar la institución. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof InstitutionFormValues;
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
              placeholder="Colegio San Francisco"
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
              placeholder="colegio-san-francisco"
              disabled={disabled || codeDisabled}
              {...register("code")}
            />
            {errors.code ? (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@colegio.edu.ec"
              disabled={disabled}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="+593 99 000 0000"
              disabled={disabled}
              {...register("phone")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Av. Principal 123"
              disabled={disabled}
              {...register("address")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Región</Label>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <Select
                  id="region"
                  disabled={disabled}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                >
                  <option value="">Sin especificar</option>
                  {INSTITUTION_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {REGION_LABELS[region]}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regime">Régimen académico</Label>
            <Controller
              name="regime"
              control={control}
              render={({ field }) => (
                <Select
                  id="regime"
                  disabled={disabled}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                >
                  <option value="">Sin especificar</option>
                  {ACADEMIC_REGIMES.map((regime) => (
                    <option key={regime} value={regime}>
                      {REGIME_LABELS[regime]}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          <Controller
            name="primaryColor"
            control={control}
            render={({ field }) => (
              <InstitutionColorPicker
                id="primaryColor"
                label="Color primario"
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={disabled}
                error={errors.primaryColor?.message}
              />
            )}
          />

          <Controller
            name="secondaryColor"
            control={control}
            render={({ field }) => (
              <InstitutionColorPicker
                id="secondaryColor"
                label="Color secundario"
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={disabled}
                error={errors.secondaryColor?.message}
              />
            )}
          />

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

export function institutionToFormValues(
  institution: Institution,
): InstitutionFormValues {
  return {
    name: institution.name,
    code: institution.code,
    email: institution.email ?? "",
    phone: institution.phone ?? "",
    address: institution.address ?? "",
    region: institution.region ?? "",
    regime: institution.regime ?? "",
    primaryColor: institution.primaryColor ?? "",
    secondaryColor: institution.secondaryColor ?? "",
  };
}

export function formValuesToPayload(values: InstitutionFormValues) {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    address: values.address?.trim() || undefined,
    region: values.region || undefined,
    regime: values.regime || undefined,
    primaryColor: values.primaryColor?.trim() || undefined,
    secondaryColor: values.secondaryColor?.trim() || undefined,
  };
}
