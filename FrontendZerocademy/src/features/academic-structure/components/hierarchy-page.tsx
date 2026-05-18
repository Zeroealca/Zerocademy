"use client";

import Link from "next/link";
import { useState } from "react";
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
import { useAcademicHierarchy } from "@/features/academic-structure/hooks/use-academic-hierarchy";
import type {
  AcademicHierarchyFilters,
  AcademicLevelNode,
  ClassroomCourseNode,
  GradeLevelNode,
} from "@/features/academic-structure/types";
import { ACTIVE_STATUS_LABELS } from "@/features/academic-levels/constants";
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import { canViewAcademicStructure } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function AcademicHierarchyPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<AcademicHierarchyFilters>({});
  const { data: periodsData } = useAcademicPeriods({ page: 1, limit: 100 });
  const { data, isLoading, isError, refetch } = useAcademicHierarchy(filters);

  if (!canViewAcademicStructure(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <p className="text-sm text-muted-foreground">
          No tienes permiso para ver la estructura académica.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  const levels = data?.levels ?? [];
  const showCourses = Boolean(filters.academicPeriodId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Estructura académica
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista en árbol de niveles, grados y cursos por período.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Selecciona un período para incluir cursos y paralelos en el árbol.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="periodFilter">Período académico</Label>
            <Select
              id="periodFilter"
              value={filters.academicPeriodId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  academicPeriodId: event.target.value || undefined,
                }))
              }
            >
              <option value="">Sin cursos en el árbol</option>
              {(periodsData?.data ?? []).map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institutionId">ID de institución (opcional)</Label>
            <Input
              id="institutionId"
              placeholder="UUID de la institución"
              value={filters.institutionId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  institutionId: event.target.value || undefined,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Árbol jerárquico</CardTitle>
          <CardDescription>
            {showCourses
              ? "Niveles → grados → cursos del período seleccionado"
              : "Niveles → grados (sin cursos)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Cargando estructura…
            </p>
          ) : null}

          {isError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                No se pudo cargar la estructura académica.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : null}

          {!isLoading && !isError && levels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay niveles académicos configurados.
            </p>
          ) : null}

          {!isLoading && !isError && levels.length > 0 ? (
            <ul className="space-y-4" role="tree" aria-label="Estructura académica">
              {levels.map((level) => (
                <LevelBranch key={level.id} level={level} showCourses={showCourses} />
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function LevelBranch({
  level,
  showCourses,
}: {
  level: AcademicLevelNode;
  showCourses: boolean;
}) {
  return (
    <li className="rounded-lg border border-border bg-muted/20 p-4" role="treeitem">
      <TreeNodeHeader
        title={`${level.name} (${level.code})`}
        order={level.order}
        isActive={level.isActive}
      />
      {level.gradeLevels.length === 0 ? (
        <p className="mt-2 pl-4 text-sm text-muted-foreground">Sin grados.</p>
      ) : (
        <ul className="mt-3 space-y-3 border-l border-border pl-4" role="group">
          {level.gradeLevels.map((grade) => (
            <GradeBranch
              key={grade.id}
              grade={grade}
              showCourses={showCourses}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function GradeBranch({
  grade,
  showCourses,
}: {
  grade: GradeLevelNode;
  showCourses: boolean;
}) {
  return (
    <li role="treeitem">
      <TreeNodeHeader
        title={`${grade.name} (${grade.code})`}
        order={grade.order}
        isActive={grade.isActive}
      />
      {showCourses ? (
        grade.courses.length === 0 ? (
          <p className="mt-1 pl-4 text-sm text-muted-foreground">
            Sin cursos en este período.
          </p>
        ) : (
          <ul className="mt-2 space-y-2 border-l border-dashed border-border pl-4">
            {grade.courses.map((course) => (
              <CourseLeaf key={course.id} course={course} />
            ))}
          </ul>
        )
      ) : null}
    </li>
  );
}

function CourseLeaf({ course }: { course: ClassroomCourseNode }) {
  return (
    <li className="flex flex-wrap items-center gap-2 text-sm" role="treeitem">
      <span className="font-medium">
        {course.name} — Paralelo {course.section}
      </span>
      {course.capacity ? (
        <span className="text-muted-foreground">({course.capacity} cupos)</span>
      ) : null}
      <Badge variant={course.isActive ? "success" : "muted"}>
        {ACTIVE_STATUS_LABELS[String(course.isActive) as "true" | "false"]}
      </Badge>
    </li>
  );
}

function TreeNodeHeader({
  title,
  order,
  isActive,
}: {
  title: string;
  order: number;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">Orden {order}</span>
      <Badge variant={isActive ? "success" : "muted"}>
        {ACTIVE_STATUS_LABELS[String(isActive) as "true" | "false"]}
      </Badge>
    </div>
  );
}
