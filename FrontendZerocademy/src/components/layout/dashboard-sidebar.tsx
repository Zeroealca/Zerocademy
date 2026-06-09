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
  Scale,
  School,
  UserRound,
  LayoutDashboard,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  canManageAcademicPeriods,
  canManagePlatformCatalog,
  canManageUsers,
  canViewAcademicEvaluation,
  canViewAcademicPerformance,
  canViewEnrollments,
  canViewGrades,
  canViewInstitutionOperations,
  canViewInstitutions,
  canViewOwnEnrollmentHistory,
  canViewStudents,
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.user);

  const navItems = [...baseNavItems];

  if (canManageAcademicPeriods(currentUser?.role)) {
    navItems.push(academicPeriodsNavItem);
  }

  if (canManagePlatformCatalog(currentUser?.role)) {
    navItems.push(
      academicLevelsNavItem,
      gradeLevelsNavItem,
      subjectsNavItem,
    );
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

  if (canViewInstitutions(currentUser?.role)) {
    navItems.push(institutionsNavItem);
  }

  if (canManageUsers(currentUser?.role)) {
    navItems.push(adminNavItem);
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
        <span className="font-semibold tracking-tight">Zerocademy</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Navegación principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
