import { EditEnrollmentPage } from "@/features/enrollments";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEnrollmentRoutePage({ params }: PageProps) {
  const { id } = await params;
  return <EditEnrollmentPage enrollmentId={id} />;
}
