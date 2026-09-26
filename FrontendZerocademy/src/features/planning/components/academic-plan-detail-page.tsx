"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { AcademicUnitsSection } from "@/features/planning/components/academic-units-section";
import { useAcademicPlan,useDeleteAcademicPlan,usePublishAcademicPlan } from "@/features/planning/hooks/use-academic-plans";
import { canManageAcademicPlanning,canViewAcademicExecution } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
export function AcademicPlanDetailPage({ id }: { id: string }) {
  const user = useAuthStore((state) => state.user);
  const query = useAcademicPlan(id);
  const publish = usePublishAcademicPlan();
  const remove = useDeleteAcademicPlan();
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Cargando plan…</p>;
  if (query.isError || !query.data) return <p className="text-sm text-destructive">No se encontró el plan o no tienes acceso.</p>;
  const plan = query.data;
  const draft = plan.status === "DRAFT" && plan.academicPeriodStatus !== "CLOSED" && canManageAcademicPlanning(user?.role);
  const action = async (kind: "publish" | "delete") => {
    if (!window.confirm(kind === "publish" ? "¿Publicar este plan? Después será de solo lectura." : "¿Eliminar este borrador?")) return;
    try {
      if (kind === "publish") await publish.mutateAsync(id);
      else await remove.mutateAsync(id);
    } catch {
      alert("No se pudo completar la acción.");
    }
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">{plan.title}</h1><p className="text-sm text-muted-foreground">{plan.subjectName} · {plan.courseName} {plan.courseSection} · {plan.academicTermName}</p></div>
      <div className="flex gap-2">{draft ? <Button asChild variant="outline"><Link href={`/academic-plans/${id}/edit`}>Editar borrador</Link></Button> : null}{draft ? <Button disabled={publish.isPending} onClick={() => action("publish")}>Publicar</Button> : null}{draft ? <Button disabled={remove.isPending} onClick={() => action("delete")} variant="destructive">Eliminar</Button> : null}</div>
    </div>
    <Card><CardContent className="grid gap-2 p-5 text-sm sm:grid-cols-2"><p><strong>Estado:</strong> {plan.status === "DRAFT" ? "Borrador" : "Publicado"}</p><p><strong>Docente:</strong> {plan.teacherFirstName} {plan.teacherLastName}</p><p><strong>Período:</strong> {plan.academicPeriodName}</p><p><strong>Fechas:</strong> {plan.startDate ?? "Sin definir"}{plan.endDate ? ` – ${plan.endDate}` : ""}</p></CardContent></Card>
    {canViewAcademicExecution(user?.role) ? <Card><CardHeader><CardTitle className="text-base">Ejecución académica</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 p-5 pt-0 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Consulta las sesiones de clase registradas para esta asignación docente.</p><Button asChild variant="outline"><Link href={`/academic-plans/${id}/execution`}>Ver sesiones</Link></Button></CardContent></Card> : null}
    <div className="grid gap-4">{[["Descripción", plan.description], ["Objetivos de aprendizaje", plan.objectives], ["Contenidos", plan.contents], ["Actividades", plan.activities], ["Recursos", plan.resources], ["Estrategia de evaluación", plan.evaluationNotes], ["Notas", plan.notes]].filter(([, value]) => value).map(([title, value]) => <Card key={title}><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm">{value}</CardContent></Card>)}</div>
    <AcademicUnitsSection academicPlanEndDate={plan.endDate} academicPlanId={plan.id} academicPlanStartDate={plan.startDate} canManage={draft}/>
  </div>;
}
