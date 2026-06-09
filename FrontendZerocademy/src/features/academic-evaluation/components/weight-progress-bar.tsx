"use client";

import { cn } from "@/lib/utils";

interface WeightProgressBarProps {
  total: number;
  target?: number;
  label: string;
}

export function WeightProgressBar({
  total,
  target = 100,
  label,
}: WeightProgressBarProps) {
  const percentage = Math.min((total / target) * 100, 100);
  const isValid = Math.abs(total - target) < 0.02;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            isValid ? "text-foreground" : "text-destructive",
          )}
        >
          {total.toFixed(2)}% / {target}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isValid ? "bg-primary" : "bg-destructive",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
