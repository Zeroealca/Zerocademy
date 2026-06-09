"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { InstitutionScopeSelector } from "@/features/academic-evaluation/components/institution-scope-selector";
import {
  useAcademicEvaluationMutations,
  useGradingSchemes,
  useInstitutionConfiguration,
} from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import {
  institutionConfigurationSchema,
  ROUNDING_STRATEGY_LABELS,
} from "@/features/academic-evaluation/schemas/academic-evaluation.schema";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import {
  canManageAcademicEvaluation,
  canViewAcademicEvaluation,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import { z } from "zod";

type ConfigurationFormValues = z.infer<typeof institutionConfigurationSchema>;

export function AcademicConfigurationPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [institutionId, setInstitutionId] = useState("");
  const { data: configuration, isLoading } =
    useInstitutionConfiguration(institutionId || undefined);
  const { data: schemesData } = useGradingSchemes({
    page: 1,
    limit: 100,
    institutionId: institutionId || undefined,
  });
  const mutations = useAcademicEvaluationMutations();

  useEffect(() => {
    const stored = sessionStorage.getItem("academic-evaluation-institution-id");
    if (stored) setInstitutionId(stored);
  }, []);

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(institutionConfigurationSchema),
    defaultValues: {
      gradingSchemeId: "",
      activeAcademicPeriodId: "",
      roundingStrategy: "ROUND_HALF_UP",
      decimalPlaces: 2,
    },
  });

  useEffect(() => {
    if (configuration) {
      form.reset({
        gradingSchemeId: configuration.gradingSchemeId,
        activeAcademicPeriodId: configuration.activeAcademicPeriodId ?? "",
        roundingStrategy: configuration.roundingStrategy,
        decimalPlaces: configuration.decimalPlaces,
      });
    } else if (effectivePeriodId) {
      form.setValue("activeAcademicPeriodId", effectivePeriodId);
    }
  }, [configuration, effectivePeriodId, form]);

  if (!canViewAcademicEvaluation(currentUser?.role)) {
    return <p className="text-sm text-muted-foreground">Acceso denegado.</p>;
  }

  const canManage = canManageAcademicEvaluation(currentUser?.role);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!institutionId) return;

    await mutations.upsertConfiguration.mutateAsync({
      institutionId,
      payload: {
        gradingSchemeId: values.gradingSchemeId,
        activeAcademicPeriodId: values.activeAcademicPeriodId || undefined,
        roundingStrategy: values.roundingStrategy,
        decimalPlaces: values.decimalPlaces,
      },
    });
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuración institucional
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vincule el esquema activo, la estrategia de redondeo y el período
          académico operativo.
        </p>
      </header>

      <InstitutionScopeSelector value={institutionId} onChange={setInstitutionId} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando configuración…</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="grid max-w-2xl gap-4 rounded-lg border border-border bg-card p-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="gradingSchemeId">Esquema de calificación</Label>
            <Select
              id="gradingSchemeId"
              {...form.register("gradingSchemeId")}
              disabled={!canManage}
            >
              <option value="">Seleccione un esquema</option>
              {(schemesData?.data ?? []).map((scheme) => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="roundingStrategy">Estrategia de redondeo</Label>
            <Select
              id="roundingStrategy"
              {...form.register("roundingStrategy")}
              disabled={!canManage}
            >
              {Object.entries(ROUNDING_STRATEGY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="decimalPlaces">Decimales</Label>
            <Input
              id="decimalPlaces"
              type="number"
              disabled={!canManage}
              {...form.register("decimalPlaces", { valueAsNumber: true })}
            />
          </div>

          {canManage ? (
            <Button type="submit" disabled={!institutionId}>
              Guardar configuración
            </Button>
          ) : null}
        </form>
      )}
    </div>
  );
}
