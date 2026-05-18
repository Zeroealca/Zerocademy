import { EditAcademicPeriodPage } from "@/features/academic-periods";

interface EditAcademicPeriodRouteProps {
  params: Promise<{ id: string }>;
}

export default async function EditAcademicPeriodRoute({
  params,
}: EditAcademicPeriodRouteProps) {
  const { id } = await params;
  return <EditAcademicPeriodPage periodId={id} />;
}
