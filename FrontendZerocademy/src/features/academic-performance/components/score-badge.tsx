import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  value: number | null | undefined;
  isPassing?: boolean | null;
  className?: string;
}

export function ScoreBadge({ value, isPassing, className }: ScoreBadgeProps) {
  if (value == null) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Sin datos
      </span>
    );
  }

  const tone =
    isPassing === true
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : isPassing === false
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-foreground";

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-sm font-medium tabular-nums",
        tone,
        className,
      )}
    >
      {value.toFixed(2)}
    </span>
  );
}
