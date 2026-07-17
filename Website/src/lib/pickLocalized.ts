/**
 * Pick the right localized field from a Prisma row that exposes
 * `nameEs` / `nameEn` / `nameAr?` (or descriptionEs/En/Ar?).
 *
 * Falls back: ar -> en -> es so the UI never renders an empty string
 * for content the admin has not translated yet.
 */
export function pickName<T extends { nameEs: string; nameEn: string; nameAr?: string | null }>(
  row: T,
  locale: string
): string {
  if (locale === "ar") return row.nameAr || row.nameEn || row.nameEs;
  if (locale === "es") return row.nameEs;
  return row.nameEn;
}

export function pickDescription<
  T extends {
    descriptionEs?: string | null;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
  },
>(row: T, locale: string): string | null {
  if (locale === "ar") {
    return row.descriptionAr || row.descriptionEn || row.descriptionEs || null;
  }
  if (locale === "es") return row.descriptionEs ?? null;
  return row.descriptionEn ?? null;
}
