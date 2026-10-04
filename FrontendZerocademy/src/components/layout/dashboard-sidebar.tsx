"use client";

import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  GitBranch,
  GraduationCap,
  Layers,
  Library,
  NotebookPen,
  BarChart3,
  FileText,
  ClipboardCheck,
  Scale,
  School,
  UserRound,
  LayoutDashboard,
  Users,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  canManageAcademicPeriods,
  canManagePlatformCatalog,
  canViewSubjects,
  canManageUsers,
  canViewAcademicEvaluation,
  canViewAcademicPerformance,
  canViewReportCards,
  canViewAttendance,
  canViewOwnAttendance,
  canViewEnrollments,
  canViewGrades,
  canViewInstitutionOperations,
  canViewInstitutions,
  canViewOwnEnrollmentHistory,
  canViewStudents,
  canViewRepresentativePortal,
  canViewAcademicPlanning,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const baseNavItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
];

const institutionsNavItem = {
  href: "/institutions",
  label: "Instituciones",
  icon: Building2,
};

const adminNavItem = {
  href: "/users",
  label: "Usuarios",
  icon: Users,
};

const academicPeriodsNavItem = {
  href: "/academic-periods",
  label: "Períodos académicos",
  icon: CalendarDays,
};

const academicLevelsNavItem = {
  href: "/academic-levels",
  label: "Niveles académicos",
  icon: Layers,
};

const gradeLevelsNavItem = {
  href: "/grade-levels",
  label: "Grados",
  icon: BookOpen,
};

const coursesNavItem = {
  href: "/courses",
  label: "Cursos / Paralelos",
  icon: School,
};

const subjectsNavItem = {
  href: "/subjects",
  label: "Materias",
  icon: Library,
};

const teacherAssignmentsNavItem = {
  href: "/teacher-assignments",
  label: "Asignaciones docentes",
  icon: ClipboardList,
};

const studentsNavItem = {
  href: "/students",
  label: "Estudiantes",
  icon: UserRound,
};

const enrollmentsNavItem = {
  href: "/enrollments",
  label: "Matrículas",
  icon: GraduationCap,
};

const myEnrollmentsNavItem = {
  href: "/my-enrollments",
  label: "Mis matrículas",
  icon: GraduationCap,
};

const gradesNavItem = {
  href: "/grades",
  label: "Notas",
  icon: NotebookPen,
};

const academicPerformanceNavItem = {
  href: "/academic-performance",
  label: "Rendimiento",
  icon: BarChart3,
};

const reportCardsNavItem = {
  href: "/report-cards",
  label: "Reportes académicos",
  icon: FileText,
};
const attendanceNavItem = {
  href: "/attendance",
  label: "Asistencia",
  icon: ClipboardCheck,
};
const myAttendanceNavItem = {
  href: "/attendance/reports",
  label: "Mi asistencia",
  icon: ClipboardCheck,
};
const representativeNavItem = {
  href: "/representative",
  label: "Mis estudiantes",
  icon: HeartHandshake,
};

const academicStructureNavItem = {
  href: "/academic-structure",
  label: "Estructura (árbol)",
  icon: GitBranch,
};

const academicEvaluationNavItem = {
  href: "/academic-evaluation",
  label: "Evaluación académica",
  icon: Scale,
};
const academicPlanningNavItem = { href: "/academic-plans", label: "Planificación académica", icon: ClipboardList };

interface DashboardSidebarProps {
  isMobileMenuOpen: boolean;
  onMobileMenuChange: (isOpen: boolean) => void;
  isDesktopCollapsed: boolean;
}

export function DashboardSidebar({
  isMobileMenuOpen,
  onMobileMenuChange,
  isDesktopCollapsed,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.user);

  const navItems = [...baseNavItems];

  if (canViewRepresentativePortal(currentUser?.role)) {
    navItems.push(representativeNavItem);
  }

  if (canManageAcademicPeriods(currentUser?.role)) {
    navItems.push(academicPeriodsNavItem);
  }

  if (canManagePlatformCatalog(currentUser?.role)) {
    navItems.push(academicLevelsNavItem, gradeLevelsNavItem);
  }

  if (currentUser?.role !== "STUDENT" && canViewSubjects(currentUser?.role)) {
    navItems.push(subjectsNavItem);
  }

  if (canViewInstitutionOperations(currentUser?.role)) {
    navItems.push(
      coursesNavItem,
      teacherAssignmentsNavItem,
      academicStructureNavItem,
    );
  }

  if (canViewAcademicEvaluation(currentUser?.role)) {
    navItems.push(academicEvaluationNavItem);
  }
  if (canViewAcademicPlanning(currentUser?.role)) navItems.push(academicPlanningNavItem);

  if (canViewStudents(currentUser?.role)) {
    navItems.push(studentsNavItem);
  }

  if (canViewEnrollments(currentUser?.role)) {
    navItems.push(enrollmentsNavItem);
  }

  if (canViewOwnEnrollmentHistory(currentUser?.role)) {
    navItems.push(myEnrollmentsNavItem);
  }

  if (canViewGrades(currentUser?.role)) {
    navItems.push(gradesNavItem);
  }

  if (canViewAcademicPerformance(currentUser?.role)) {
    navItems.push(academicPerformanceNavItem);
  }

  if (
    currentUser?.role !== "STUDENT" &&
    canViewReportCards(currentUser?.role)
  ) {
    navItems.push(reportCardsNavItem);
  }
  if (canViewAttendance(currentUser?.role)) navItems.push(attendanceNavItem);
  if (
    currentUser?.role !== "STUDENT" &&
    canViewOwnAttendance(currentUser?.role)
  )
    navItems.push(myAttendanceNavItem);

  if (canViewInstitutions(currentUser?.role)) {
    navItems.push(institutionsNavItem);
  }

  if (canManageUsers(currentUser?.role)) {
    navItems.push(adminNavItem);
  }

  const navigation = (
    <nav
      className="flex flex-1 flex-col gap-1 p-4"
      aria-label="Navegación principal"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={() => onMobileMenuChange(false)}
            title={isDesktopCollapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isDesktopCollapsed && "md:justify-center",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span
              className={cn(
                "min-w-0 truncate",
                isDesktopCollapsed && "md:hidden",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
          isDesktopCollapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-border",
            isDesktopCollapsed ? "justify-center px-3" : "px-6",
          )}
        >
          <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
          <span
            className={cn(
              "font-semibold tracking-tight",
              isDesktopCollapsed && "md:hidden",
            )}
          >
            Zerocademy
          </span>
        </div>
        {navigation}
      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-foreground/30 md:hidden">
          <aside
            className="flex h-full w-[min(18rem,85vw)] flex-col border-r border-border bg-card shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex h-16 items-center gap-2 border-b border-border px-6">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
              <span className="font-semibold tracking-tight">Zerocademy</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{navigation}</div>
          </aside>
          <button
            type="button"
            className="absolute inset-y-0 left-[min(18rem,85vw)] right-0"
            aria-label="Cerrar menú"
            onClick={() => onMobileMenuChange(false)}
          />
        </div>
      ) : null}
    </>
  );
}
