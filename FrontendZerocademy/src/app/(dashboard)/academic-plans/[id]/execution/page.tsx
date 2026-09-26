import { ClassSessionsWorkspacePage } from "@/features/academic-execution";

export default async function AcademicPlanExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClassSessionsWorkspacePage academicPlanId={id} />;
}
