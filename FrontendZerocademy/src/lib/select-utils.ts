export function isSelectValueMissing(
  value: string | undefined,
  optionIds: string[],
): boolean {
  if (!value) {
    return false;
  }

  return !optionIds.includes(value);
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Case-insensitive substring filter for searchable selects (DEMY-74). */
export function filterOptionsByQuery<T extends SelectOption>(
  options: readonly T[],
  query: string,
): T[] {
  const normalized = query.trim().toLocaleLowerCase("es");
  if (!normalized) {
    return [...options];
  }

  return options.filter((option) =>
    option.label.toLocaleLowerCase("es").includes(normalized),
  );
}
