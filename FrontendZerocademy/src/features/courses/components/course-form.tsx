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
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import { useGradeLevels } from "@/features/grade-levels/hooks/use-grade-levels";
import {
  createCourseSchema,
  type CreateCourseInput,
} from "@/features/courses/schemas/course.schema";
import type { Course } from "@/features/courses/types";
import { ApiError } from "@/lib/api-error";

interface CourseFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<CreateCourseInput>;
  onSubmit: (values: CreateCourseInput) => Promise<void>;
  disabled?: boolean;
}

export function CourseForm({
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
  disabled = false,
}: CourseFormProps) {
  const { data: periodsData, isLoading: periodsLoading } = useAcademicPeriods({
    page: 1,
    limit: 100,
  });
  const { data: gradesData, isLoading: gradesLoading } = useGradeLevels({
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
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      section: defaultValues?.section ?? "",
      capacity: defaultValues?.capacity,
      academicPeriodId: defaultValues?.academicPeriodId ?? "",
      gradeLevelId: defaultValues?.gradeLevelId ?? "",
    },
  });

  const periods = periodsData?.data ?? [];
  const grades = gradesData?.data ?? [];

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      const payload: CreateCourseInput = {
        name: values.name,
        section: values.section,
        academicPeriodId: values.academicPeriodId,
        gradeLevelId: values.gradeLevelId,
        ...(values.capacity ? { capacity: values.capacity } : {}),
      };
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el curso. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof CreateCourseInput;
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
            <Label htmlFor="academicPeriodId">Período académico</Label>
            <Controller
              name="academicPeriodId"
              control={control}
              render={({ field }) => (
                <Select
                  id="academicPeriodId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled || periodsLoading}
                >
                  <option value="">
                    {periodsLoading ? "Cargando períodos…" : "Selecciona un período"}
                  </option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.academicPeriodId ? (
              <p className="text-sm text-destructive">
                {errors.academicPeriodId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gradeLevelId">Grado</Label>
            <Controller
              name="gradeLevelId"
              control={control}
              render={({ field }) => (
                <Select
                  id="gradeLevelId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled || gradesLoading}
                >
                  <option value="">
                    {gradesLoading ? "Cargando grados…" : "Selecciona un grado"}
                  </option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name} ({grade.code})
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.gradeLevelId ? (
              <p className="text-sm text-destructive">
                {errors.gradeLevelId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nombre del curso / aula</Label>
            <Input
              id="name"
              placeholder="Primer grado — mañana"
              disabled={disabled}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Paralelo</Label>
            <Input
              id="section"
              placeholder="A"
              disabled={disabled}
              {...register("section")}
            />
            {errors.section ? (
              <p className="text-sm text-destructive">{errors.section.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad (opcional)</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              disabled={disabled}
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity ? (
              <p className="text-sm text-destructive">
                {errors.capacity.message}
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

export function courseToFormValues(course: Course): CreateCourseInput {
  return {
    name: course.name,
    section: course.section,
    capacity: course.capacity ?? undefined,
    academicPeriodId: course.academicPeriodId,
    gradeLevelId: course.gradeLevelId,
  };
}
