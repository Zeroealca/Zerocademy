import { z } from "zod";
const optionalText=z.string().optional();
export const academicPlanSchema=z.object({teacherAssignmentId:z.string().uuid("Selecciona una asignación docente."),academicTermId:z.string().uuid("Selecciona un período de evaluación."),title:z.string().trim().min(1,"El título es obligatorio.").max(200),description:optionalText,startDate:optionalText,endDate:optionalText,objectives:optionalText,contents:optionalText,activities:optionalText,resources:optionalText,evaluationNotes:optionalText,notes:optionalText}).refine((v)=>!v.startDate||!v.endDate||v.startDate<=v.endDate,{message:"La fecha de inicio no puede ser posterior a la fecha de fin.",path:["endDate"]});
export type AcademicPlanFormValues=z.infer<typeof academicPlanSchema>;
