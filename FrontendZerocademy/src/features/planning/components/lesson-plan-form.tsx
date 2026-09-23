"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  lessonPlanSchema,
  type LessonPlanFormValues,
} from "@/features/planning/schemas/lesson-plan.schema";
import type { LessonPlan, LessonPlanInput } from "@/features/planning/types";
import { ApiError } from "@/lib/api-error";

interface LessonPlanFormProps {
  academicUnitEndDate: string | null;
  academicUnitStartDate: string | null;
  lessonPlan?: LessonPlan;
  onCancel: () => void;
  onSubmit: (values: LessonPlanInput) => Promise<void>;
  submitLabel: string;
}

export function LessonPlanForm({
  academicUnitEndDate,
  academicUnitStartDate,
  lessonPlan,
  onCancel,
  onSubmit,
  submitLabel,
}: LessonPlanFormProps) {
  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: toValues(lessonPlan),
  });
  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(clean(values));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar la clase.";
      form.setError("root", { message });
      if (error instanceof ApiError) {
        error.details?.forEach((detail) => {
          const field = detail.field as keyof LessonPlanFormValues;
          if (field in values) form.setError(field, { message: String(detail.message) });
        });
      }
    }
  });

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <Field error={form.formState.errors.title?.message} id="lesson-plan-title" label="Título">
        <Input autoFocus id="lesson-plan-title" {...form.register("title")} />
      </Field>
      <Field error={form.formState.errors.lessonDate?.message} id="lesson-plan-date" label="Fecha de la clase">
        <Input
          id="lesson-plan-date"
          max={academicUnitEndDate ?? undefined}
          min={academicUnitStartDate ?? undefined}
          type="date"
          {...form.register("lessonDate")}
        />
      </Field>
      <Field error={form.formState.errors.durationMinutes?.message} id="lesson-plan-duration" label="Duración planificada (minutos)">
        <Input id="lesson-plan-duration" min="1" step="1" type="number" {...form.register("durationMinutes")} />
      </Field>
      <div className="hidden sm:block" aria-hidden="true" />
      <Area form={form} id="lesson-plan-objectives" label="Objetivos" name="objectives" />
      <Area form={form} id="lesson-plan-introduction" label="Introducción" name="introduction" />
      <Area form={form} id="lesson-plan-development" label="Desarrollo" name="development" />
      <Area form={form} id="lesson-plan-closure" label="Cierre" name="closure" />
      <Area form={form} id="lesson-plan-resources" label="Recursos" name="resources" />
      <Area form={form} id="lesson-plan-evaluation" label="Estrategia de evaluación" name="evaluationStrategy" />
      <Area form={form} id="lesson-plan-notes" label="Notas" name="notes" />
      {form.formState.errors.root ? <p className="text-sm text-destructive sm:col-span-2" role="alert">{form.formState.errors.root.message}</p> : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Guardando…" : submitLabel}</Button>
        <Button onClick={onCancel} type="button" variant="outline">Cancelar</Button>
      </div>
    </form>
  );
}

function Field({ children, error, id, label }: { children: React.ReactNode; error?: string; id: string; label: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}

function Area({ form, id, label, name }: { form: ReturnType<typeof useForm<LessonPlanFormValues>>; id: string; label: string; name: Exclude<keyof LessonPlanFormValues, "title" | "lessonDate" | "durationMinutes"> }) {
  return <div className="space-y-2 sm:col-span-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} rows={4} {...form.register(name)} />{form.formState.errors[name]?.message ? <p className="text-sm text-destructive">{form.formState.errors[name].message}</p> : null}</div>;
}

function toValues(lessonPlan?: LessonPlan): LessonPlanFormValues {
  return { title: lessonPlan?.title ?? "", lessonDate: lessonPlan?.lessonDate ?? "", durationMinutes: lessonPlan?.durationMinutes?.toString() ?? "", objectives: lessonPlan?.objectives ?? "", introduction: lessonPlan?.introduction ?? "", development: lessonPlan?.development ?? "", closure: lessonPlan?.closure ?? "", resources: lessonPlan?.resources ?? "", evaluationStrategy: lessonPlan?.evaluationStrategy ?? "", notes: lessonPlan?.notes ?? "" };
}

function clean(values: LessonPlanFormValues): LessonPlanInput {
  const optional = (value: string | undefined) => value?.trim() || undefined;
  return { title: values.title.trim(), lessonDate: values.lessonDate, durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined, objectives: optional(values.objectives), introduction: optional(values.introduction), development: optional(values.development), closure: optional(values.closure), resources: optional(values.resources), evaluationStrategy: optional(values.evaluationStrategy), notes: optional(values.notes) };
}
