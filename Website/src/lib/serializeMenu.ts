/**
 * Prisma returns Decimal objects for price fields.
 * Next.js cannot serialize these across the Server→Client boundary.
 * This utility converts them to plain numbers recursively.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object" && "toNumber" in (obj as object)) {
    // Prisma Decimal instance
    return (obj as unknown as { toNumber(): number }).toNumber() as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal) as unknown as T;
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeDecimal(value);
    }
    return result as T;
  }
  return obj;
}
