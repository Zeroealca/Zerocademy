import { Badge } from "@/components/ui/badge";
import type { ClassSessionStatus } from "@/features/academic-execution/types";

const STATUS_CONFIG: Record<
  ClassSessionStatus,
  { label: string; variant: "success" | "muted" | "secondary" }
> = {
  SCHEDULED: { label: "Programada", variant: "secondary" },
  COMPLETED: { label: "Realizada", variant: "success" },
  CANCELLED: { label: "Cancelada", variant: "muted" },
};

export function ClassSessionStatusBadge({
  status,
}: {
  status: ClassSessionStatus;
}) {
  const config = STATUS_CONFIG[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
