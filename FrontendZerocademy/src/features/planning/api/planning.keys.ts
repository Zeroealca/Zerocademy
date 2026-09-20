import type { AcademicPlansFilters } from "@/features/planning/types";
export const planningKeys = { all:["academic-plans"] as const, lists:()=>[...planningKeys.all,"list"] as const, list:(filters:AcademicPlansFilters)=>[...planningKeys.lists(),filters] as const, detail:(id:string)=>[...planningKeys.all,"detail",id] as const };
