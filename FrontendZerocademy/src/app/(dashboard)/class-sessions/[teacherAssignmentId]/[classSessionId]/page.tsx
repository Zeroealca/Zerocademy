import { ClassSessionStandalonePage } from "@/features/academic-execution";

export default async function ClassSessionPage({
  params,
}: {
  params: Promise<{ teacherAssignmentId: string; classSessionId: string }>;
}) {
  const { teacherAssignmentId, classSessionId } = await params;
  return (
    <ClassSessionStandalonePage
      teacherAssignmentId={teacherAssignmentId}
      classSessionId={classSessionId}
    />
  );
}
