export type LocalizedCatalogItem = {
  nameEs: string;
  nameEn: string;
  nameDe?: string | null;
};

/** POS display name by UI locale. German falls back to English when nameDe is empty. */
export function localizedCatalogName(
  item: LocalizedCatalogItem,
  locale: string,
): string {
  if (locale === "es") return item.nameEs;
  if (locale === "de") {
    const german = item.nameDe?.trim();
    return german || item.nameEn;
  }
  return item.nameEn;
}
