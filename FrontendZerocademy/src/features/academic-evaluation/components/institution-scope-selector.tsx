"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useInstitutions } from "@/features/institutions/hooks/use-institutions";

interface InstitutionScopeSelectorProps {
  value: string;
  onChange: (institutionId: string) => void;
}

export function InstitutionScopeSelector({
  value,
  onChange,
}: InstitutionScopeSelectorProps) {
  const { data, isLoading } = useInstitutions({ page: 1, limit: 100 });

  return (
    <div className="grid gap-2 sm:max-w-md">
      <Label htmlFor="institution-scope">Institución</Label>
      <Select
        id="institution-scope"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? "Cargando instituciones…" : "Seleccione una institución"}
        </option>
        {data?.data.map((institution) => (
          <option key={institution.id} value={institution.id}>
            {institution.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
