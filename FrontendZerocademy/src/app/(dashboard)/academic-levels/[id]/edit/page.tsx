import { EditAcademicLevelPage } from "@/features/academic-levels";

interface EditAcademicLevelRouteProps {
  params: Promise<{ id: string }>;
}

export default async function EditAcademicLevelRoutePage({
  params,
}: EditAcademicLevelRouteProps) {
  const { id } = await params;
  return <EditAcademicLevelPage levelId={id} />;
}
