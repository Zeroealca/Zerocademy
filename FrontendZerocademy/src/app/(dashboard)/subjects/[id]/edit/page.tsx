import { EditSubjectPage } from "@/features/subjects";

interface EditSubjectRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubjectRoutePage({
  params,
}: EditSubjectRoutePageProps) {
  const { id } = await params;
  return <EditSubjectPage subjectId={id} />;
}
