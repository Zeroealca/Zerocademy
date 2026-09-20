"use client";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { createAcademicPlan,deleteAcademicPlan,fetchAcademicPlan,fetchAcademicPlans,publishAcademicPlan,updateAcademicPlan } from "@/features/planning/api/planning.api";
import { planningKeys } from "@/features/planning/api/planning.keys";
import type { AcademicPlanInput,AcademicPlansFilters,UpdateAcademicPlanInput } from "@/features/planning/types";
export function useAcademicPlans(filters:AcademicPlansFilters){return useQuery({queryKey:planningKeys.list(filters),queryFn:()=>fetchAcademicPlans(filters)});}
export function useAcademicPlan(id:string){return useQuery({queryKey:planningKeys.detail(id),queryFn:()=>fetchAcademicPlan(id),enabled:Boolean(id)});}
function useInvalidate(){const client=useQueryClient();return ()=>client.invalidateQueries({queryKey:planningKeys.all});}
export function useCreateAcademicPlan(){const invalidate=useInvalidate();return useMutation({mutationFn:(payload:AcademicPlanInput)=>createAcademicPlan(payload),onSuccess:invalidate});}
export function useUpdateAcademicPlan(){const invalidate=useInvalidate();return useMutation({mutationFn:({id,payload}:{id:string;payload:UpdateAcademicPlanInput})=>updateAcademicPlan(id,payload),onSuccess:invalidate});}
export function usePublishAcademicPlan(){const invalidate=useInvalidate();return useMutation({mutationFn:publishAcademicPlan,onSuccess:invalidate});}
export function useDeleteAcademicPlan(){const invalidate=useInvalidate();return useMutation({mutationFn:deleteAcademicPlan,onSuccess:invalidate});}
