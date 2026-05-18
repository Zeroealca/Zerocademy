import { EditCoursePage } from "@/features/courses";

interface EditCourseRouteProps {
  params: Promise<{ id: string }>;
}

export default async function EditCourseRoutePage({
  params,
}: EditCourseRouteProps) {
  const { id } = await params;
  return <EditCoursePage courseId={id} />;
}
