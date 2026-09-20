"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMyRepresentativeStudents } from "@/features/representatives/hooks/use-representatives";
import { useAuthStore } from "@/stores/use-auth-store";

export function RepresentativeHomePage() {
  const role = useAuthStore((state) => state.user?.role);
  const students = useMyRepresentativeStudents(role === "REPRESENTATIVE");
  if (role !== "REPRESENTATIVE") return <p className="py-12 text-center text-sm text-muted-foreground">No tienes acceso a esta sección.</p>;
  return <div className="space-y-8"><header><h1 className="text-2xl font-semibold tracking-tight">Mis estudiantes</h1><p className="mt-1 text-sm text-muted-foreground">Consulta información académica y asistencia de los estudiantes autorizados.</p></header>{students.isLoading ? <p className="text-sm text-muted-foreground">Cargando estudiantes…</p> : students.isError ? <div className="space-y-2"><p className="text-sm text-destructive">No se pudieron cargar los estudiantes.</p><Button variant="outline" size="sm" onClick={() => void students.refetch()}>Reintentar</Button></div> : students.data?.length ? <div className="grid gap-4 md:grid-cols-2">{students.data.map((student) => <article key={student.id} className="space-y-4 rounded-lg border border-border bg-card p-5"><div><h2 className="font-semibold">{student.fullName}</h2><p className="text-sm text-muted-foreground">{student.gradeLevelName ?? "Sin matrícula actual"}{student.courseName ? ` · ${student.courseName} ${student.section ?? ""}` : ""}</p>{student.academicPeriodName ? <p className="text-sm text-muted-foreground">{student.academicPeriodName}</p> : null}</div><div className="flex flex-wrap gap-2"><Button asChild size="sm"><Link href={`/report-cards?studentId=${student.studentId}`}>Ver libreta</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/grades?studentId=${student.studentId}`}>Ver notas</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/attendance/reports?studentId=${student.studentId}`}>Ver asistencia</Link></Button></div></article>)}</div> : <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No tienes estudiantes asociados actualmente.</p>}</div>;
}
