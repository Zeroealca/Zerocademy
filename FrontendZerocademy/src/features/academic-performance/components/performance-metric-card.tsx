import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreBadge } from "@/features/academic-performance/components/score-badge";

interface PerformanceMetricCardProps {
  title: string;
  description?: string;
  value: number | null;
  subtitle?: string;
  variant?: "score" | "count";
}

export function PerformanceMetricCard({
  title,
  description,
  value,
  subtitle,
  variant = "score",
}: PerformanceMetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">
          {variant === "count" ? (
            <span className="tabular-nums">{value ?? "—"}</span>
          ) : (
            <ScoreBadge value={value} className="text-3xl font-semibold" />
          )}
        </div>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
