import { AcademicPlanDetailPage } from "@/features/planning";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AcademicPlanDetailPage id={id}/>;}
