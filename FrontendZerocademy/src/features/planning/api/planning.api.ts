import { apiClient } from "@/lib/api-client";
import type { AcademicPlan, AcademicPlanInput, AcademicPlansFilters, AcademicPlansListResponse, UpdateAcademicPlanInput } from "@/features/planning/types";
function query(filters:AcademicPlansFilters){const p=new URLSearchParams({page:String(filters.page),limit:String(filters.limit)}); for(const [key,value] of Object.entries(filters)) if(value!==undefined&&key!=="page"&&key!=="limit")p.set(key,String(value)); return p.toString();}
export const fetchAcademicPlans=(filters:AcademicPlansFilters)=>apiClient<AcademicPlansListResponse>(`/v1/academic-plans?${query(filters)}`);
export const fetchAcademicPlan=(id:string)=>apiClient<AcademicPlan>(`/v1/academic-plans/${id}`);
export const createAcademicPlan=(payload:AcademicPlanInput)=>apiClient<AcademicPlan>("/v1/academic-plans",{method:"POST",body:payload});
export const updateAcademicPlan=(id:string,payload:UpdateAcademicPlanInput)=>apiClient<AcademicPlan>(`/v1/academic-plans/${id}`,{method:"PATCH",body:payload});
export const publishAcademicPlan=(id:string)=>apiClient<AcademicPlan>(`/v1/academic-plans/${id}/publish`,{method:"POST"});
export const deleteAcademicPlan=(id:string)=>apiClient<void>(`/v1/academic-plans/${id}`,{method:"DELETE"});
