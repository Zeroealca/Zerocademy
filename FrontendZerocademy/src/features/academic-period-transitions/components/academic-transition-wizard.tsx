"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ACADEMIC_REGIMES,
  REGIME_LABELS,
} from "@/features/academic-periods/constants";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import type { AcademicPeriod, AcademicRegime } from "@/features/academic-periods/types";
import { AcademicTransitionPreviewPanel } from "@/features/academic-period-transitions/components/academic-transition-preview-panel";
import { DEFAULT_TRANSITION_OPTIONS, TRANSITION_WIZARD_STEPS } from "@/features/academic-period-transitions/constants";
import { useAcademicTransitionMutations } from "@/features/academic-period-transitions/hooks/use-academic-transition-mutations";
import {
  academicTransitionWizardSchema,
  wizardValuesToRequest,
  type AcademicTransitionWizardValues,
} from "@/features/academic-period-transitions/schemas/academic-transition.schema";
import type { AcademicTransitionPreview } from "@/features/academic-period-transitions/types";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

interface AcademicTransitionWizardProps {
  institutionId: string;
  periods: AcademicPeriod[];
  onExecuted: () => void;
}

export function AcademicTransitionWizard({
  institutionId,
  periods,
  onExecuted,
}: AcademicTransitionWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [preview, setPreview] = useState<AcademicTransitionPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | undefined>();

  const { previewMutation, executeMutation } =
    useAcademicTransitionMutations(institutionId);

  const form = useForm<AcademicTransitionWizardValues>({
    resolver: zodResolver(academicTransitionWizardSchema),
    defaultValues: {
      fromAcademicPeriodId: "",
      targetMode: "create",
      toAcademicPeriodId: undefined,
      createTargetPeriod: {
        name: "",
        regime: "COSTA_GALAPAGOS",
        startDate: "",
        endDate: "",
      },
      options: { ...DEFAULT_TRANSITION_OPTIONS },
    },
  });

  const targetMode = form.watch("targetMode");
  const options = form.watch("options");
  const currentStep = TRANSITION_WIZARD_STEPS[stepIndex];

  const runPreview = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    setPreviewError(undefined);
    try {
      const result = await previewMutation.mutateAsync(
        wizardValuesToRequest(form.getValues()),
      );
      setPreview(result);
      setStepIndex(TRANSITION_WIZARD_STEPS.length - 1);
    } catch (error) {
      setPreview(null);
      setPreviewError(
        error instanceof ApiError
          ? error.message
          : "No se pudo generar la vista previa.",
      );
    }
  };

  const runExecute = async () => {
    if (!preview) {
      await runPreview();
      return;
    }

    const confirmed = window.confirm(
      "¿Ejecutar la transición de período académico? Los datos del período origen se conservarán como historial.",
    );
    if (!confirmed) return;

    try {
      await executeMutation.mutateAsync(wizardValuesToRequest(form.getValues()));
      setPreview(null);
      setStepIndex(0);
      form.reset();
      onExecuted();
    } catch (error) {
      setPreviewError(
        error instanceof ApiError
          ? error.message
          : "No se pudo ejecutar la transición.",
      );
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      <nav aria-label="Pasos del asistente" className="flex flex-wrap gap-2">
        {TRANSITION_WIZARD_STEPS.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              index === stepIndex
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {index + 1}. {step.label}
          </span>
        ))}
      </nav>

      {currentStep.id === "source" ? (
        <div className="space-y-2 max-w-md">
          <Label htmlFor="from-period">Período origen</Label>
          <Select
            id="from-period"
            value={form.watch("fromAcademicPeriodId")}
            onChange={(e) => form.setValue("fromAcademicPeriodId", e.target.value)}
          >
            <option value="">Selecciona el período a cerrar</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {formatAcademicPeriodOptionLabel(period)}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {currentStep.id === "target" ? (
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="target-mode">Destino</Label>
            <Select
              id="target-mode"
              value={targetMode}
              onChange={(e) =>
                form.setValue("targetMode", e.target.value as "existing" | "create")
              }
            >
              <option value="create">Crear período nuevo</option>
              <option value="existing">Usar período existente</option>
            </Select>
          </div>

          {targetMode === "existing" ? (
            <div className="space-y-2">
              <Label htmlFor="to-period">Período destino</Label>
              <Select
                id="to-period"
                value={form.watch("toAcademicPeriodId") ?? ""}
                onChange={(e) => form.setValue("toAcademicPeriodId", e.target.value)}
              >
                <option value="">Selecciona el período destino</option>
                {periods
                  .filter((p) => p.id !== form.watch("fromAcademicPeriodId"))
                  .map((period) => (
                    <option key={period.id} value={period.id}>
                      {formatAcademicPeriodOptionLabel(period)}
                    </option>
                  ))}
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="target-name">Nombre del período</Label>
                <Input
                  id="target-name"
                  placeholder="2026-2027"
                  {...form.register("createTargetPeriod.name")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-regime">Régimen</Label>
                <Select
                  id="target-regime"
                  value={form.watch("createTargetPeriod.regime")}
                  onChange={(e) =>
                    form.setValue(
                      "createTargetPeriod.regime",
                      e.target.value as AcademicRegime,
                    )
                  }
                >
                  {ACADEMIC_REGIMES.map((regime) => (
                    <option key={regime} value={regime}>
                      {REGIME_LABELS[regime]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-start">Inicio</Label>
                <Input
                  id="target-start"
                  type="date"
                  {...form.register("createTargetPeriod.startDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-end">Fin</Label>
                <Input
                  id="target-end"
                  type="date"
                  {...form.register("createTargetPeriod.endDate")}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {currentStep.id === "options" ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Opciones de transición</legend>
          <OptionCheckbox
            id="copy-courses"
            label="Copiar cursos / paralelos al período destino"
            checked={options.copyCourses}
            onChange={(checked) => form.setValue("options.copyCourses", checked)}
          />
          <OptionCheckbox
            id="copy-assignments"
            label="Copiar asignaciones docentes (requiere copiar cursos)"
            checked={options.copyTeacherAssignments}
            disabled={!options.copyCourses}
            onChange={(checked) =>
              form.setValue("options.copyTeacherAssignments", checked)
            }
          />
          <OptionCheckbox
            id="copy-terms"
            label="Copiar términos académicos (solo al crear período nuevo)"
            checked={options.copyTerms}
            disabled={targetMode !== "create"}
            onChange={(checked) => form.setValue("options.copyTerms", checked)}
          />
          <OptionCheckbox
            id="activate-target"
            label="Activar período destino para la institución"
            checked={options.activateTargetPeriod}
            onChange={(checked) =>
              form.setValue("options.activateTargetPeriod", checked)
            }
          />
          <OptionCheckbox
            id="close-source"
            label="Cerrar período origen tras la transición"
            checked={options.closeSourcePeriod}
            onChange={(checked) =>
              form.setValue("options.closeSourcePeriod", checked)
            }
          />
        </fieldset>
      ) : null}

      {currentStep.id === "preview" ? (
        <AcademicTransitionPreviewPanel
          preview={preview}
          isLoading={previewMutation.isPending}
          errorMessage={previewError}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          Anterior
        </Button>
        {currentStep.id !== "preview" ? (
          <Button
            type="button"
            onClick={() => {
              if (stepIndex === TRANSITION_WIZARD_STEPS.length - 2) {
                void runPreview();
              } else {
                setStepIndex((i) =>
                  Math.min(TRANSITION_WIZARD_STEPS.length - 1, i + 1),
                );
              }
            }}
          >
            {stepIndex === TRANSITION_WIZARD_STEPS.length - 2
              ? "Vista previa"
              : "Siguiente"}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={executeMutation.isPending || !preview}
            onClick={() => void runExecute()}
          >
            {executeMutation.isPending ? "Ejecutando…" : "Confirmar transición"}
          </Button>
        )}
      </div>
    </div>
  );
}

function OptionCheckbox({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-border"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
