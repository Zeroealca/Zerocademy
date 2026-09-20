import { AcademicPlanEditorPage } from "@/features/planning";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AcademicPlanEditorPage id={id}/>;}
