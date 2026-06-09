export function isSelectValueMissing(
  value: string | undefined,
  optionIds: string[],
): boolean {
  if (!value) {
    return false;
  }

  return !optionIds.includes(value);
}
