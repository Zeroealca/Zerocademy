import { ClassSessionAttendanceRoute } from "@/features/academic-execution/components/class-session-attendance-page";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string; classSessionId: string }>;
}) {
  const { id, classSessionId } = await params;
  return (
    <ClassSessionAttendanceRoute
      academicPlanId={id}
      classSessionId={classSessionId}
    />
  );
}
