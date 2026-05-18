import { EditGradeLevelPage } from "@/features/grade-levels";

interface EditGradeLevelRouteProps {
  params: Promise<{ id: string }>;
}

export default async function EditGradeLevelRoutePage({
  params,
}: EditGradeLevelRouteProps) {
  const { id } = await params;
  return <EditGradeLevelPage gradeId={id} />;
}
