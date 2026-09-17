"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { useCourses } from "@/features/courses/hooks/use-courses";
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
} from "@/features/enrollments/constants";
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  type CreateEnrollmentInput,
  type UpdateEnrollmentInput,
} from "@/features/enrollments/schemas/enrollment.schema";
import type { Enrollment } from "@/features/enrollments/types";
import { useStudents } from "@/features/students/hooks/use-students";
import { formatStudentLabel } from "@/features/students/lib/format-student-label";
import { ApiError } from "@/lib/api-error";

type EnrollmentFormProps =
  | {
      mode: "create";
      title: string;
      description: string;
      submitLabel: string;
      defaultValues?: undefined;
      onSubmit: (values: CreateEnrollmentInput) => Promise<void>;
    }
  | {
      mode: "edit";
      title: string;
      description: string;
      submitLabel: string;
      defaultValues: Enrollment;
      onSubmit: (values: UpdateEnrollmentInput) => Promise<void>;
    };

export function EnrollmentForm({
  mode,
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
}: EnrollmentFormProps) {
  const isCreate = mode === "create";

  const form = useForm<CreateEnrollmentInput | UpdateEnrollmentInput>({
    resolver: zodResolver(
      isCreate ? createEnrollmentSchema : updateEnrollmentSchema,
    ),
    defaultValues: isCreate
      ? {
          studentId: "",
          courseId: "",
          academicPeriodId: "",
          enrollmentDate: new Date().toISOString().slice(0, 10),
          status: "ACTIVE",
        }
      : {
          enrollmentDate: defaultValues?.enrollmentDate,
          status: defaultValues?.status,
        },
  });

  const academicPeriodId = useWatch({
    control: form.control,
    name: "academicPeriodId" as keyof CreateEnrollmentInput,
  }) as string | undefined;

  const { data: periodsData } = useInstitutionAcademicPeriods({ page: 1, limit: 100, status: "ACTIVE" });
  const { data: coursesData } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
    isActive: true,
  });
  const { data: studentsData } = useStudents({
    page: 1,
    limit: 100,
    isActive: true,
    excludeEnrolledInPeriodId: academicPeriodId || undefined,
  });

  useEffect(() => {
    if (!isCreate || !academicPeriodId) return;
    form.setValue("studentId", "");
  }, [academicPeriodId, form, isCreate]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (isCreate && !periodsData?.data.some((period) => period.id === (values as CreateEnrollmentInput).academicPeriodId)) {
      form.setError("academicPeriodId", { message: "Selecciona un periodo lectivo activo." });
      return;
    }
    try {
      if (isCreate) {
        await (onSubmit as (v: CreateEnrollmentInput) => Promise<void>)(
          values as CreateEnrollmentInput,
        );
      } else {
        await (onSubmit as (v: UpdateEnrollmentInput) => Promise<void>)(
          values as UpdateEnrollmentInput,
        );
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar la matrícula.";
      form.setError("root", { message });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {isCreate ? (
            <>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="academicPeriodId">Período académico</Label>
                <Controller
                  name="academicPeriodId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      id="academicPeriodId"
                      value={field.value as string}
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue("studentId", "");
                        form.setValue("courseId", "");
                      }}
                    >
                      <option value="">Seleccionar período</option>
                      {(periodsData?.data ?? []).map((period) => (
                        <option key={period.id} value={period.id}>
                          {formatAcademicPeriodOptionLabel(period)}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                {"academicPeriodId" in form.formState.errors &&
                form.formState.errors.academicPeriodId ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.academicPeriodId.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="studentId">Estudiante</Label>
                <Controller
                  name="studentId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      id="studentId"
                      value={field.value as string}
                      onChange={field.onChange}
                      disabled={!academicPeriodId}
                    >
                      <option value="">
                        {academicPeriodId
                          ? "Seleccionar estudiante"
                          : "Seleccione un período primero"}
                      </option>
                      {(studentsData?.data ?? []).map((student) => (
                        <option key={student.id} value={student.id}>
                          {formatStudentLabel(student)}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                {"studentId" in form.formState.errors &&
                form.formState.errors.studentId ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.studentId.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="courseId">Curso / paralelo</Label>
                <Controller
                  name="courseId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      id="courseId"
                      value={field.value as string}
                      onChange={field.onChange}
                      disabled={!academicPeriodId}
                    >
                      <option value="">Seleccionar curso</option>
                      {(coursesData?.data ?? []).map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.section})
                        </option>
                      ))}
                    </Select>
                  )}
                />
                {"courseId" in form.formState.errors &&
                form.formState.errors.courseId ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.courseId.message}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="enrollmentDate">Fecha de matrícula</Label>
            <input
              id="enrollmentDate"
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...form.register("enrollmentDate")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="status"
                  value={(field.value as string) ?? "ACTIVE"}
                  onChange={field.onChange}
                >
                  {ENROLLMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ENROLLMENT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          {form.formState.errors.root ? (
            <p className="text-sm text-destructive sm:col-span-2">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
