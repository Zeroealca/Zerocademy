import { AcademicPeriodDetailPage } from "@/features/academic-periods";

interface AcademicPeriodDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AcademicPeriodDetailRoute({
  params,
}: AcademicPeriodDetailRouteProps) {
  const { id } = await params;
  return <AcademicPeriodDetailPage periodId={id} />;
}
