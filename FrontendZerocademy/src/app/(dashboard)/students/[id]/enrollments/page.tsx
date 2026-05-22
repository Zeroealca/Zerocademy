import { StudentEnrollmentsPage } from "@/features/students";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentEnrollmentsRoutePage({ params }: PageProps) {
  const { id } = await params;
  return <StudentEnrollmentsPage studentId={id} />;
}
