"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useAcademicHierarchy } from "@/features/academic-structure/hooks/use-academic-hierarchy";
import type {
  AcademicHierarchyFilters,
  AcademicLevelNode,
  ClassroomCourseNode,
  GradeLevelNode,
} from "@/features/academic-structure/types";
import { ACTIVE_STATUS_LABELS } from "@/features/academic-levels/constants";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import { useInstitutions } from "@/features/institutions/hooks/use-institutions";
import { canViewInstitutionOperations } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function AcademicHierarchyPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<AcademicHierarchyFilters>({});
  const { data: institutionsData, isLoading: institutionsLoading, isError: institutionsError } =
    useInstitutions({ page: 1, limit: 100 });
  const selectedInstitution = institutionsData?.data.find(
    (institution) => institution.id === filters.institutionId,
  );
  const { data: periodsData, isLoading: periodsLoading, isError: periodsError } = useAcademicPeriods({
    page: 1,
    limit: 100,
    institutionId: filters.institutionId,
    regime: selectedInstitution?.regime ?? undefined,
  });
  const { data, isLoading, isError, refetch } = useAcademicHierarchy(filters);

  if (!canViewInstitutionOperations(currentUser?.role)) {
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
              disabled={periodsLoading || periodsError}
              value={filters.academicPeriodId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  academicPeriodId: event.target.value || undefined,
                }))
              }
            >
              <option value="">{periodsLoading ? "Cargando períodos..." : periodsError ? "No se pudieron cargar los períodos" : "Solo niveles y grados (sin cursos)"}</option>
              {(periodsData?.data ?? []).map((period) => (
                <option key={period.id} value={period.id}>
                  {formatAcademicPeriodOptionLabel(period)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institutionId">Institución</Label>
            <Select
              id="institutionId"
              disabled={institutionsLoading || institutionsError}
              value={filters.institutionId ?? ""}
              onChange={(event) =>
                setFilters({
                  institutionId: event.target.value || undefined,
                })
              }
            >
              <option value="">{institutionsLoading ? "Cargando instituciones..." : institutionsError ? "No se pudieron cargar las instituciones" : "Todas las instituciones disponibles"}</option>
              {(institutionsData?.data ?? []).map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name} ({institution.code})
                </option>
              ))}
            </Select>
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
  const [isExpanded, setIsExpanded] = useState(true);
  const contentId = useId();

  return (
    <li
      aria-expanded={isExpanded}
      aria-selected={false}
      className="rounded-lg border border-border bg-muted/20 p-4"
      role="treeitem"
    >
      <details
        open={isExpanded}
        onToggle={(event) => setIsExpanded(event.currentTarget.open)}
      >
      <TreeNodeHeader
        title={`${level.name} (${level.code})`}
        order={level.order}
        isActive={level.isActive}
        isExpanded={isExpanded}
        contentId={contentId}
        expandable
      />
      {(
        level.gradeLevels.length === 0 ? (
          <p
            className="mt-2 pl-9 text-sm text-muted-foreground"
            id={contentId}
          >
            Sin grados.
          </p>
        ) : (
          <ul
            className="mt-3 space-y-3 border-l border-border pl-4"
            id={contentId}
            role="group"
          >
            {level.gradeLevels.map((grade) => (
              <GradeBranch
                key={grade.id}
                grade={grade}
                showCourses={showCourses}
              />
            ))}
          </ul>
        )
      )}
      </details>
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
  const [isExpanded, setIsExpanded] = useState(true);
  const contentId = useId();
  const canExpand = showCourses;

  return (
    <li
      aria-expanded={canExpand ? isExpanded : undefined}
      aria-selected={false}
      role="treeitem"
    >
      <details
        open={canExpand ? isExpanded : true}
        onToggle={(event) => {
          if (canExpand) setIsExpanded(event.currentTarget.open);
        }}
      >
      <TreeNodeHeader
        title={`${grade.name} (${grade.code})`}
        order={grade.order}
        isActive={grade.isActive}
        isExpanded={isExpanded}
        contentId={contentId}
        expandable={canExpand}
      />
      {showCourses ? (
        grade.courses.length === 0 ? (
          <p
            className="mt-1 pl-9 text-sm text-muted-foreground"
            id={contentId}
          >
            Sin cursos en este período.
          </p>
        ) : (
          <ul
            className="mt-2 space-y-2 border-l border-dashed border-border pl-4"
            id={contentId}
            role="group"
          >
            {grade.courses.map((course) => (
              <CourseLeaf key={course.id} course={course} />
            ))}
          </ul>
        )
      ) : null}
      </details>
    </li>
  );
}

function CourseLeaf({ course }: { course: ClassroomCourseNode }) {
  return (
    <li
      aria-selected={false}
      className="flex flex-wrap items-center gap-2 text-sm"
      role="treeitem"
    >
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
  isExpanded,
  contentId,
  expandable = false,
}: {
  title: string;
  order: number;
  isActive: boolean;
  isExpanded: boolean;
  contentId: string;
  expandable?: boolean;
}) {
  const Icon = isExpanded ? ChevronDown : ChevronRight;
  const content = (
    <>
      {expandable ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="min-w-0 break-words font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">Orden {order}</span>
      <Badge variant={isActive ? "success" : "muted"}>
        {ACTIVE_STATUS_LABELS[String(isActive) as "true" | "false"]}
      </Badge>
    </>
  );

    return (
        <summary
          aria-controls={contentId}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Colapsar ${title}` : `Expandir ${title}`}
          className="flex min-h-9 w-full list-none flex-wrap items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors [&::-webkit-details-marker]:hidden hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ cursor: expandable ? "pointer" : "default" }}
          onClick={expandable ? undefined : (event) => event.preventDefault()}
        >
          {content}
        </summary>
    );
}
