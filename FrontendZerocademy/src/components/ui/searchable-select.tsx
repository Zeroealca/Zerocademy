"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  filterOptionsByQuery,
  isSelectValueMissing,
  type SelectOption,
} from "@/lib/select-utils";
import { cn } from "@/lib/utils";

export interface SearchableSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: readonly SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  loading?: boolean;
  loadingSelectedLabel?: string;
}

export const SearchableSelect = React.forwardRef<
  HTMLSelectElement,
  SearchableSelectProps
>(
  (
    {
      options,
      value,
      placeholder = "Selecciona una opción",
      searchPlaceholder = "Buscar…",
      emptyLabel = "Sin resultados",
      loading = false,
      loadingSelectedLabel = "Cargando opción seleccionada…",
      disabled,
      className,
      id,
      onChange,
      onBlur,
      name,
      ...props
    },
    ref,
  ) => {
    const [query, setQuery] = React.useState("");
    const selected = typeof value === "string" ? value : "";
    const optionIds = options.map((option) => option.value);
    const filtered = filterOptionsByQuery(options, query);
    const showMissingSelected =
      Boolean(selected) &&
      (loading || isSelectValueMissing(selected, optionIds));

    return (
      <div className={cn("space-y-2", className)}>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={disabled || loading}
          aria-label={searchPlaceholder}
          autoComplete="off"
        />
        <Select
          ref={ref}
          id={id}
          name={name}
          value={selected}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled || loading}
          {...props}
        >
          <option value="">
            {loading ? "Cargando…" : placeholder}
          </option>
          {showMissingSelected ? (
            <option value={selected}>{loadingSelectedLabel}</option>
          ) : null}
          {filtered.length === 0 && !showMissingSelected ? (
            <option value="" disabled>
              {emptyLabel}
            </option>
          ) : null}
          {filtered.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    );
  },
);
SearchableSelect.displayName = "SearchableSelect";
