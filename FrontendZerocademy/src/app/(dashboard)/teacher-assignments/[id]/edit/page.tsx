import { EditTeacherAssignmentPage } from "@/features/teacher-assignments";

interface EditTeacherAssignmentRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeacherAssignmentRoutePage({
  params,
}: EditTeacherAssignmentRoutePageProps) {
  const { id } = await params;
  return <EditTeacherAssignmentPage assignmentId={id} />;
}
