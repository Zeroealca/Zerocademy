"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAcademicTerms,useEffectiveAcademicPeriodId } from "@/features/academic-periods";
import { useTeacherAssignments } from "@/features/teacher-assignments";
import { academicPlanSchema,type AcademicPlanFormValues } from "@/features/planning/schemas/academic-plan.schema";
import type { AcademicPlan,AcademicPlanInput } from "@/features/planning/types";
import { ApiError } from "@/lib/api-error";

export function AcademicPlanForm({plan,onSubmit,submitLabel}:{plan?:AcademicPlan;onSubmit:(value:AcademicPlanInput)=>Promise<void>;submitLabel:string}){
 const selectedPeriodId=useEffectiveAcademicPeriodId(); const periodId=plan?.academicPeriodId??selectedPeriodId; const assignments=useTeacherAssignments({page:1,limit:100,academicPeriodId:periodId}); const terms=useAcademicTerms(periodId??"");
 const form=useForm<AcademicPlanFormValues>({resolver:zodResolver(academicPlanSchema),defaultValues:toValues(plan)}); const termId=form.watch("academicTermId");
 useEffect(()=>{if(termId&&terms.data&&!terms.data.some((term)=>term.id===termId))form.setValue("academicTermId","");},[form,termId,terms.data]);
 const submit=form.handleSubmit(async(values)=>{try{await onSubmit(clean(values));}catch(error){const message=error instanceof ApiError?error.message:"No se pudo guardar la planificación."; form.setError("root",{message}); if(error instanceof ApiError) error.details?.forEach((detail)=>{const key=detail.field as keyof AcademicPlanFormValues;if(key in values)form.setError(key,{message:String(detail.message)});});}});
 if(assignments.isLoading||terms.isLoading)return <p className="text-sm text-muted-foreground">Cargando contexto de planificación…</p>;
 if(!periodId)return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Selecciona un período académico para crear un plan.</p>;
 return <Card><CardHeader><CardTitle>{plan?"Editar borrador":"Nuevo plan"}</CardTitle><CardDescription>Los borradores pueden completarse más tarde.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
 <Field label="Título" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></Field>
 <Field label="Asignación docente" error={form.formState.errors.teacherAssignmentId?.message}><Select disabled={Boolean(plan)} {...form.register("teacherAssignmentId")}><option value="">Selecciona una asignación</option>{assignments.data?.data.map(a=><option key={a.id} value={a.id}>{a.subjectName} — {a.courseName}</option>)}</Select></Field>
 <Field label="Período de evaluación" error={form.formState.errors.academicTermId?.message}><Select {...form.register("academicTermId")}><option value="">Selecciona un período</option>{terms.data?.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
 <Field label="Fecha de inicio" error={form.formState.errors.startDate?.message}><Input type="date" {...form.register("startDate")}/></Field><Field label="Fecha de fin" error={form.formState.errors.endDate?.message}><Input type="date" {...form.register("endDate")}/></Field>
 <Area form={form} name="description" label="Descripción"/><Area form={form} name="objectives" label="Objetivos de aprendizaje"/><Area form={form} name="contents" label="Contenidos"/><Area form={form} name="activities" label="Actividades"/><Area form={form} name="resources" label="Recursos"/><Area form={form} name="evaluationNotes" label="Estrategia de evaluación"/><Area form={form} name="notes" label="Notas internas"/>
 {form.formState.errors.root?<p className="text-sm text-destructive sm:col-span-2" role="alert">{form.formState.errors.root.message}</p>:null}<div className="sm:col-span-2"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting?"Guardando…":submitLabel}</Button></div>
 </form></CardContent></Card>;
}
function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <div className="space-y-2"><Label>{label}</Label>{children}{error?<p className="text-sm text-destructive">{error}</p>:null}</div>}
function Area({form,name,label}:{form:ReturnType<typeof useForm<AcademicPlanFormValues>>;name:Exclude<keyof AcademicPlanFormValues,"teacherAssignmentId"|"academicTermId"|"title"|"startDate"|"endDate">;label:string}){return <div className="space-y-2 sm:col-span-2"><Label>{label}</Label><Textarea rows={4} {...form.register(name)}/></div>}
function toValues(plan?:AcademicPlan):AcademicPlanFormValues{return {teacherAssignmentId:plan?.teacherAssignmentId??"",academicTermId:plan?.academicTermId??"",title:plan?.title??"",description:plan?.description??"",startDate:plan?.startDate??"",endDate:plan?.endDate??"",objectives:plan?.objectives??"",contents:plan?.contents??"",activities:plan?.activities??"",resources:plan?.resources??"",evaluationNotes:plan?.evaluationNotes??"",notes:plan?.notes??""};}
function clean(values: AcademicPlanFormValues): AcademicPlanInput {
  const optional = (value: string | undefined) => value || undefined;
  return { teacherAssignmentId: values.teacherAssignmentId, academicTermId: values.academicTermId, title: values.title, description: optional(values.description), startDate: optional(values.startDate), endDate: optional(values.endDate), objectives: optional(values.objectives), contents: optional(values.contents), activities: optional(values.activities), resources: optional(values.resources), evaluationNotes: optional(values.evaluationNotes), notes: optional(values.notes) };
}
