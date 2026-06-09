"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAcademicTerms } from "@/features/academic-periods/hooks/use-academic-terms";
import { useAssessmentCategories } from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import { useTeacherAssignments } from "@/features/teacher-assignments/hooks/use-teacher-assignments";
import type { Assessment } from "@/features/grades/types";
import {
  assessmentFormSchema,
  type AssessmentFormInput,
} from "@/features/grades/schemas/assessment.schema";

interface AssessmentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<AssessmentFormInput>;
  initialAssessment?: Assessment;
  academicPeriodId?: string;
  onSubmit: (values: AssessmentFormInput) => Promise<void>;
}

export function AssessmentForm({
  title,
  description,
  submitLabel,
  defaultValues,
  initialAssessment,
  academicPeriodId,
  onSubmit,
}: AssessmentFormProps) {
  const form = useForm<AssessmentFormInput>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      maxScore: 10,
      weight: 10,
      assessmentDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  const selectedPeriodId =
    form.watch("academicPeriodId") || academicPeriodId || "";
  const selectedAssignmentId = form.watch("teacherAssignmentId");
  const institutionId = form.watch("institutionId");

  const { data: assignmentsData } = useTeacherAssignments({
    page: 1,
    limit: 100,
    academicPeriodId: selectedPeriodId || undefined,
  });

  const { data: terms } = useAcademicTerms(selectedPeriodId);
  const { data: categoriesData } = useAssessmentCategories(
    institutionId
      ? { page: 1, limit: 100, institutionId }
      : undefined,
  );

  useEffect(() => {
    if (!initialAssessment) return;
    form.reset({
      institutionId: initialAssessment.institutionId,
      academicPeriodId: initialAssessment.academicPeriodId,
      academicTermId: initialAssessment.academicTermId,
      teacherAssignmentId: initialAssessment.teacherAssignmentId,
      subjectId: initialAssessment.subjectId,
      assessmentCategoryId: initialAssessment.assessmentCategoryId,
      title: initialAssessment.title,
      description: initialAssessment.description ?? undefined,
      maxScore: initialAssessment.maxScore,
      weight: initialAssessment.weight,
      assessmentDate: initialAssessment.assessmentDate,
    });
  }, [form, initialAssessment]);

  useEffect(() => {
    if (!selectedAssignmentId) return;
    const assignment = assignmentsData?.data.find(
      (item) => item.id === selectedAssignmentId,
    );
    if (!assignment) return;

    if (assignment.institutionId) {
      form.setValue("institutionId", assignment.institutionId);
    }
    form.setValue("academicPeriodId", assignment.academicPeriodId);
    form.setValue("subjectId", assignment.subjectId);
  }, [assignmentsData?.data, form, selectedAssignmentId]);

  useEffect(() => {
    if (academicPeriodId && !form.getValues("academicPeriodId")) {
      form.setValue("academicPeriodId", academicPeriodId);
    }
  }, [academicPeriodId, form]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form
      className="space-y-6 rounded-lg border border-border bg-card p-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <input type="hidden" {...register("institutionId")} />
      <input type="hidden" {...register("academicPeriodId")} />
      <input type="hidden" {...register("subjectId")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="teacherAssignmentId">Asignación docente</Label>
          <Select id="teacherAssignmentId" {...register("teacherAssignmentId")}>
            <option value="">Selecciona curso y materia</option>
            {(assignmentsData?.data ?? []).map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.subjectName} — {assignment.courseName} (
                {assignment.academicPeriodName})
              </option>
            ))}
          </Select>
          {errors.teacherAssignmentId ? (
            <p className="text-sm text-destructive">
              {errors.teacherAssignmentId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="academicTermId">Trimestre / quimestre</Label>
          <Select id="academicTermId" {...register("academicTermId")}>
            <option value="">Selecciona trimestre</option>
            {(terms ?? []).map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
          {errors.academicTermId ? (
            <p className="text-sm text-destructive">
              {errors.academicTermId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessmentCategoryId">Categoría</Label>
          <Select id="assessmentCategoryId" {...register("assessmentCategoryId")}>
            <option value="">Selecciona categoría</option>
            {(categoriesData?.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {errors.assessmentCategoryId ? (
            <p className="text-sm text-destructive">
              {errors.assessmentCategoryId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Input id="description" {...register("description")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxScore">Nota máxima</Label>
          <Input
            id="maxScore"
            type="number"
            step="0.01"
            {...register("maxScore", { valueAsNumber: true })}
          />
          {errors.maxScore ? (
            <p className="text-sm text-destructive">{errors.maxScore.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Peso (%)</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            {...register("weight", { valueAsNumber: true })}
          />
          {errors.weight ? (
            <p className="text-sm text-destructive">{errors.weight.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessmentDate">Fecha</Label>
          <Input id="assessmentDate" type="date" {...register("assessmentDate")} />
          {errors.assessmentDate ? (
            <p className="text-sm text-destructive">
              {errors.assessmentDate.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
