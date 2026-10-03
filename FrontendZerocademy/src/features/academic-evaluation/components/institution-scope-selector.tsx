"use client";

import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useInstitutions } from "@/features/institutions/hooks/use-institutions";

const INSTITUTION_SCOPE_STORAGE_KEY = "academic-evaluation-institution-id";

interface InstitutionScopeSelectorProps {
  value: string;
  onChange: (institutionId: string) => void;
}

export function InstitutionScopeSelector({
  value,
  onChange,
}: InstitutionScopeSelectorProps) {
  const { data, isLoading } = useInstitutions({ page: 1, limit: 100 });
  const options =
    data?.data.map((institution) => ({
      value: institution.id,
      label: institution.name,
    })) ?? [];

  return (
    <div className="grid gap-2 sm:max-w-md">
      <Label htmlFor="institution-scope">Institución</Label>
      <SearchableSelect
        id="institution-scope"
        value={value}
        onChange={(event) => {
          const institutionId = event.target.value;
          if (institutionId) {
            sessionStorage.setItem(INSTITUTION_SCOPE_STORAGE_KEY, institutionId);
          } else {
            sessionStorage.removeItem(INSTITUTION_SCOPE_STORAGE_KEY);
          }
          onChange(institutionId);
        }}
        options={options}
        placeholder={
          isLoading ? "Cargando instituciones…" : "Seleccione una institución"
        }
        searchPlaceholder="Buscar institución…"
        emptyLabel="No hay instituciones disponibles"
        loading={isLoading}
        disabled={isLoading}
      />
    </div>
  );
}
