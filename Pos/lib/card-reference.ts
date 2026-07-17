/**
 * Increments the trailing numeric segment of a terminal reference.
 * Examples: 001977 → 001978, BBVA-001977 → BBVA-001978
 */
export function incrementCardReference(
  reference: string | null | undefined,
): string | null {
  const trimmed = reference?.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (!match) return trimmed;

  const [, prefix, digits] = match;
  const nextNum = Number.parseInt(digits, 10) + 1;
  const padded = String(nextNum).padStart(digits.length, "0");
  return `${prefix}${padded}`;
}

export function suggestNextCardReference(
  lastReference: string | null | undefined,
): string | null {
  return incrementCardReference(lastReference) ?? lastReference?.trim() ?? null;
}

export function isValidCardReference(reference: string): boolean {
  return /^(.*?)(\d+)$/.test(reference.trim());
}
