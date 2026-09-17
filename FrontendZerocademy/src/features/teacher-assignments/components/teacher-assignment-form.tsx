"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import { useInstitutions } from "@/features/institutions/hooks/use-institutions";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useSubjects } from "@/features/subjects/hooks/use-subjects";
import {
  createTeacherAssignmentSchema,
  type CreateTeacherAssignmentInput,
} from "@/features/teacher-assignments/schemas/teacher-assignment.schema";
import { useUsers } from "@/features/users/hooks/use-users";
import type { TeacherAssignment } from "@/features/teacher-assignments/types";
import { ApiError } from "@/lib/api-error";

export function assignmentToFormValues(
  assignment: TeacherAssignment,
): Partial<CreateTeacherAssignmentInput> {
  return {
    institutionId: assignment.institutionId ?? "",
    teacherId: assignment.teacherId,
    subjectId: assignment.subjectId,
    courseId: assignment.courseId,
    academicPeriodId: assignment.academicPeriodId,
  };
}

interface TeacherAssignmentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: Partial<CreateTeacherAssignmentInput>;
  onSubmit: (values: CreateTeacherAssignmentInput) => Promise<void>;
  disabled?: boolean;
}

export function TeacherAssignmentForm({
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
  disabled = false,
}: TeacherAssignmentFormProps) {
  const { data: institutionsData, isLoading: institutionsLoading, isError: institutionsError } =
    useInstitutions({ page: 1, limit: 100 });
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeacherAssignmentInput>({
    resolver: zodResolver(createTeacherAssignmentSchema),
    defaultValues: {
      institutionId: defaultValues?.institutionId ?? "",
      teacherId: defaultValues?.teacherId ?? "",
      subjectId: defaultValues?.subjectId ?? "",
      courseId: defaultValues?.courseId ?? "",
      academicPeriodId: defaultValues?.academicPeriodId ?? "",
    },
  });
  const institutionId = useWatch({ control, name: "institutionId" });
  const selectedInstitution = institutionsData?.data.find((institution) => institution.id === institutionId);
  const { data: periodsData, isLoading: periodsLoading } = useAcademicPeriods({
    page: 1, limit: 100,
    institutionId: institutionId || undefined,
    regime: selectedInstitution?.regime ?? undefined,
  });
  const {
    data: teachersData,
    isLoading: teachersLoading,
    isError: teachersError,
  } = useUsers({
    page: 1,
    limit: 100,
    role: "TEACHER",
    isActive: true,
    institutionId: institutionId || undefined,
  });

  const academicPeriodId = useWatch({ control, name: "academicPeriodId" });
  const courseId = useWatch({ control, name: "courseId" });

  const { data: coursesData, isLoading: coursesLoading } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
    institutionId: institutionId || undefined,
    isActive: true,
  });

  const selectedCourse = coursesData?.data.find((course) => course.id === courseId);

  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({
    page: 1,
    limit: 100,
    isActive: true,
    gradeLevelId: selectedCourse?.gradeLevelId,
    institutionId: institutionId || undefined,
  });

  const periods = periodsData?.data ?? [];
  const teachers = (teachersData?.data ?? []).filter(
    (user) => user.profileId != null,
  );
  const courses = coursesData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar la asignación. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof CreateTeacherAssignmentInput;
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
            <Label htmlFor="assignmentInstitutionId">Institución *</Label>
            <Controller name="institutionId" control={control} render={({ field }) => (
              <Select id="assignmentInstitutionId" value={field.value} onBlur={field.onBlur}
                disabled={disabled || institutionsLoading || institutionsError}
                onChange={(event) => {
                  field.onChange(event);
                  setValue("academicPeriodId", "");
                  setValue("teacherId", "");
                  setValue("courseId", "");
                  setValue("subjectId", "");
                }}>
                <option value="">{institutionsError ? "No se pudieron cargar las instituciones" : "Seleccionar institución"}</option>
                {(institutionsData?.data ?? []).map((institution) => (
                  <option key={institution.id} value={institution.id}>{institution.name} ({institution.code})</option>
                ))}
              </Select>
            )} />
            {errors.institutionId ? <p className="text-sm text-destructive">{errors.institutionId.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="academicPeriodId">Período académico *</Label>
            <Controller
              name="academicPeriodId"
              control={control}
              render={({ field }) => (
                <Select
                  id="academicPeriodId"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event);
                    setValue("courseId", "");
                    setValue("subjectId", "");
                  }}
                  onBlur={field.onBlur}
                  disabled={disabled || !institutionId || periodsLoading}
                >
                  <option value="">Seleccionar período</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {formatAcademicPeriodOptionLabel(period)}
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
            <Label htmlFor="teacherId">Docente *</Label>
            <Controller
              name="teacherId"
              control={control}
              render={({ field }) => (
                <Select
                  id="teacherId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled || !institutionId || teachersLoading || teachersError}
                >
                  <option value="">Seleccionar docente</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.profileId!} value={teacher.profileId!}>
                      {teacher.firstName} {teacher.lastName}
                      {teacher.email ? ` (${teacher.email})` : ""}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.teacherId ? (
              <p className="text-sm text-destructive">{errors.teacherId.message}</p>
            ) : null}
            {teachersError ? (
              <p className="text-sm text-destructive">
                No se pudo cargar el listado de docentes. Verifica tu sesión e
                inténtalo de nuevo.
              </p>
            ) : null}
            {!teachersLoading && !teachersError && teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay docentes activos. Un super administrador debe crear
                usuarios con rol Docente en la sección Usuarios antes de
                asignarlos.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="courseId">Curso / paralelo *</Label>
            <Controller
              name="courseId"
              control={control}
              render={({ field }) => (
                <Select
                  id="courseId"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event);
                    setValue("subjectId", "");
                  }}
                  onBlur={field.onBlur}
                  disabled={disabled || !academicPeriodId || coursesLoading}
                >
                  <option value="">
                    {academicPeriodId
                      ? "Seleccionar curso"
                      : "Primero elige un período"}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.section})
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.courseId ? (
              <p className="text-sm text-destructive">{errors.courseId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="subjectId">Materia *</Label>
            <Controller
              name="subjectId"
              control={control}
              render={({ field }) => (
                <Select
                  id="subjectId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled || !courseId || subjectsLoading}
                >
                  <option value="">
                    {courseId ? "Seleccionar materia" : "Primero elige un curso"}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.subjectId ? (
              <p className="text-sm text-destructive">{errors.subjectId.message}</p>
            ) : null}
          </div>

          {errors.root ? (
            <p className="text-sm text-destructive sm:col-span-2">
              {errors.root.message}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={disabled || isSubmitting || !institutionId || institutionsError || teachersError}>
              {isSubmitting ? "Guardando…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
