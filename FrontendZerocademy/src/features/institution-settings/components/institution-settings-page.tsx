"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { Select } from "@/components/ui/select";
import { InstitutionContextNav } from "@/features/institutions/components/institution-context-nav";
import { InstitutionColorPicker } from "@/features/institutions/components/institution-color-picker";
import { InstitutionLogoUpload } from "@/features/institutions/components/institution-logo-upload";
import { resolveAssetUrl } from "@/lib/resolve-asset-url";
import {
  ACADEMIC_REGIMES,
  INSTITUTION_REGIONS,
  REGIME_LABELS,
  REGION_LABELS,
  STATUS_LABELS,
} from "@/features/institutions/constants";
import { useInstitution } from "@/features/institutions/hooks/use-institution";
import { useInstitutionMutations } from "@/features/institutions/hooks/use-institution-mutations";
import {
  institutionBrandingSchema,
  institutionSettingsSchema,
  type InstitutionBrandingFormValues,
  type InstitutionSettingsFormValues,
} from "@/features/institutions/schemas/institution.schema";
import {
  canManageInstitutionSettings,
  canViewInstitutions,
} from "@/lib/permissions";
import { ApiError } from "@/lib/api-error";
import { useAuthStore } from "@/stores/use-auth-store";

interface InstitutionSettingsPageProps {
  institutionId: string;
}

export function InstitutionSettingsPage({
  institutionId,
}: InstitutionSettingsPageProps) {
  const currentUser = useAuthStore((state) => state.user);
  const {
    data: institution,
    isLoading,
    isError,
    refetch,
  } = useInstitution(institutionId);
  const { settingsMutation, brandingMutation } = useInstitutionMutations();

  const canView = canViewInstitutions(currentUser?.role);
  const canEdit = canManageInstitutionSettings(currentUser?.role);

  if (!canView) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando configuración…</p>
    );
  }

  if (isError || !institution) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          No se pudo cargar la configuración de la institución.
        </p>
        <Button asChild variant="outline">
          <Link href="/institutions">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href="/institutions">Volver al listado</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {institution.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Código: {institution.code}
          </p>
          <Badge variant={institution.isActive ? "default" : "secondary"}>
            {institution.isActive
              ? STATUS_LABELS.active
              : STATUS_LABELS.inactive}
          </Badge>
        </div>
        {canEdit ? (
          <Button variant="outline" asChild>
            <Link href={`/institutions/${institutionId}/edit`}>
              Editar datos generales
            </Link>
          </Button>
        ) : null}
      </header>

      <InstitutionContextNav institutionId={institutionId} />

      <InstitutionSettingsForm
        institutionId={institutionId}
        defaultValues={{
          email: institution.email ?? "",
          phone: institution.phone ?? "",
          address: institution.address ?? "",
          region: institution.region ?? "",
          regime: institution.regime ?? "",
        }}
        disabled={!canEdit || settingsMutation.isPending}
        onSubmit={async (values) => {
          await settingsMutation.mutateAsync({
            id: institutionId,
            payload: {
              email: values.email?.trim() || undefined,
              phone: values.phone?.trim() || undefined,
              address: values.address?.trim() || undefined,
              region: values.region || undefined,
              regime: values.regime || undefined,
            },
          });
        }}
      />

      <InstitutionBrandingForm
        institutionId={institutionId}
        logoUrl={institution.logoUrl}
        defaultValues={{
          primaryColor: institution.primaryColor ?? "",
          secondaryColor: institution.secondaryColor ?? "",
        }}
        previewName={institution.name}
        disabled={!canEdit || brandingMutation.isPending}
        onLogoUploaded={() => {
          void refetch();
        }}
        onSubmit={async (values) => {
          await brandingMutation.mutateAsync({
            id: institutionId,
            payload: {
              primaryColor: values.primaryColor?.trim() || undefined,
              secondaryColor: values.secondaryColor?.trim() || undefined,
            },
          });
        }}
      />
    </div>
  );
}

function InstitutionSettingsForm({
  defaultValues,
  disabled,
  onSubmit,
}: {
  institutionId: string;
  defaultValues: InstitutionSettingsFormValues;
  disabled: boolean;
  onSubmit: (values: InstitutionSettingsFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionSettingsFormValues>({
    resolver: zodResolver(institutionSettingsSchema),
    defaultValues,
  });
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuración institucional</CardTitle>
        <CardDescription>
          Contacto, ubicación y régimen académico por defecto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(async (values) => {
            setIsSuccess(false);
            clearErrors("root");
            try {
              await onSubmit(values);
              setIsSuccess(true);
            } catch (error) {
              const message =
                error instanceof ApiError
                  ? error.message
                  : "No se pudo guardar la configuración.";
              setError("root", { message });
            }
          })}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="settings-email">Correo</Label>
            <Input
              id="settings-email"
              type="email"
              disabled={disabled}
              {...register("email")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-phone">Teléfono</Label>
            <Input id="settings-phone" disabled={disabled} {...register("phone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="settings-address">Dirección</Label>
            <Input
              id="settings-address"
              disabled={disabled}
              {...register("address")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-region">Región</Label>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <Select
                  id="settings-region"
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
            <Label htmlFor="settings-regime">Régimen académico</Label>
            <Controller
              name="regime"
              control={control}
              render={({ field }) => (
                <Select
                  id="settings-regime"
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
          {errors.root ? (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {errors.root.message}
            </p>
          ) : null}
          {isSuccess ? (
            <div className="sm:col-span-2">
              <Badge variant="success" role="status">
                Configuración guardada correctamente
              </Badge>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={disabled || isSubmitting}>
              {isSubmitting ? "Guardando…" : "Guardar configuración"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function InstitutionBrandingForm({
  institutionId,
  logoUrl,
  defaultValues,
  previewName,
  disabled,
  onLogoUploaded,
  onSubmit,
}: {
  institutionId: string;
  logoUrl?: string | null;
  defaultValues: InstitutionBrandingFormValues;
  previewName: string;
  disabled: boolean;
  onLogoUploaded?: () => void;
  onSubmit: (values: InstitutionBrandingFormValues) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionBrandingFormValues>({
    resolver: zodResolver(institutionBrandingSchema),
    defaultValues,
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const primaryColor = watch("primaryColor");
  const secondaryColor = watch("secondaryColor");
  const previewLogo = resolveAssetUrl(logoUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Marca institucional</CardTitle>
        <CardDescription>
          Logo y colores para personalizar la experiencia de la institución.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="rounded-lg border border-border p-6"
          style={{
            background: `linear-gradient(135deg, ${primaryColor || "hsl(var(--primary))"} 0%, ${secondaryColor || "hsl(var(--muted))"} 100%)`,
          }}
        >
          <div className="flex items-center gap-4 rounded-lg bg-background/90 p-4 shadow-sm backdrop-blur">
            {previewLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewLogo}
                alt=""
                className="h-12 w-12 rounded-md object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                Logo
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{previewName}</p>
              <p className="text-xs text-muted-foreground">Vista previa</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(async (values) => {
            setIsSuccess(false);
            clearErrors("root");
            try {
              await onSubmit(values);
              setIsSuccess(true);
            } catch (error) {
              const message =
                error instanceof ApiError
                  ? error.message
                  : "No se pudo guardar la marca.";
              setError("root", { message });
            }
          })}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <InstitutionLogoUpload
              institutionId={institutionId}
              currentLogoUrl={logoUrl}
              disabled={disabled}
              onUploaded={onLogoUploaded}
            />
          </div>

          <Controller
            name="primaryColor"
            control={control}
            render={({ field }) => (
              <InstitutionColorPicker
                id="branding-primaryColor"
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
                id="branding-secondaryColor"
                label="Color secundario"
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={disabled}
                error={errors.secondaryColor?.message}
              />
            )}
          />
          {errors.root ? (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {errors.root.message}
            </p>
          ) : null}
          {isSuccess ? (
            <div className="sm:col-span-2">
              <Badge variant="success" role="status">
                Marca actualizada correctamente
              </Badge>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={disabled || isSubmitting}>
              {isSubmitting ? "Guardando…" : "Guardar marca"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
