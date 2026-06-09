import { AssessmentDetailPage } from "@/features/grades";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AssessmentDetailPage assessmentId={id} />;
}
