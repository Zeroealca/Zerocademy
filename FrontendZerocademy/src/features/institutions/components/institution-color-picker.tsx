"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const HEX_PATTERN = /^#([0-9A-Fa-f]{6})$/;
const DEFAULT_PICKER_COLOR = "#1E40AF";

interface InstitutionColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

function normalizeHexInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.toUpperCase();
}

function pickerValueFromHex(hex: string): string {
  return HEX_PATTERN.test(hex) ? hex : DEFAULT_PICKER_COLOR;
}

export function InstitutionColorPicker({
  id,
  label,
  value,
  onChange,
  disabled = false,
  error,
  className,
}: InstitutionColorPickerProps) {
  const pickerValue = pickerValueFromHex(value);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          id={`${id}-picker`}
          value={pickerValue}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${label} (selector visual)`}
        />
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder="#1E40AF"
          onChange={(event) => onChange(normalizeHexInput(event.target.value))}
          className="font-mono text-sm"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
