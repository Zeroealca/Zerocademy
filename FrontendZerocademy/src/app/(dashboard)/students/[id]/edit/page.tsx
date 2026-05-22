import { EditStudentPage } from "@/features/students";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentRoutePage({ params }: PageProps) {
  const { id } = await params;
  return <EditStudentPage studentId={id} />;
}
