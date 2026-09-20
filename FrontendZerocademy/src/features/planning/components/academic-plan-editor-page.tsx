"use client";
import { useRouter } from "next/navigation";
import { AcademicPlanForm } from "@/features/planning/components/academic-plan-form";
import { useAcademicPlan,useCreateAcademicPlan,useUpdateAcademicPlan } from "@/features/planning/hooks/use-academic-plans";
import type { AcademicPlanInput } from "@/features/planning/types";
export function AcademicPlanEditorPage({id}:{id?:string}){const router=useRouter();const detail=useAcademicPlan(id??"");const create=useCreateAcademicPlan();const update=useUpdateAcademicPlan();if(id&&detail.isLoading)return <p className="text-sm text-muted-foreground">Cargando borrador…</p>;if(id&&(!detail.data||detail.data.status!=="DRAFT"||detail.data.academicPeriodStatus==="CLOSED"))return <p className="text-sm text-destructive">Este plan no se puede editar.</p>;const save=async(values:AcademicPlanInput)=>{const result=id?await update.mutateAsync({id,payload:values}):await create.mutateAsync(values);router.push(`/academic-plans/${result.id}`)};return <div className="space-y-4"><h1 className="text-2xl font-semibold">{id?"Editar plan":"Nuevo plan"}</h1><AcademicPlanForm plan={detail.data} onSubmit={save} submitLabel="Guardar borrador"/></div>}
