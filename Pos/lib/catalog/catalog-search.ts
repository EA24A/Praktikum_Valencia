import type { LocalizedCatalogItem } from "@/lib/catalog/localized-name";

/** Lowercase and strip accents so "cafe" matches "Café" and "jamon" matches "Jamón". */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/** All name variants used for cross-language dish search. */
export function catalogSearchNames(item: LocalizedCatalogItem): string[] {
  const names = [item.nameEs, item.nameEn];
  const german = item.nameDe?.trim();
  if (german) {
    names.push(german);
  }
  return names.filter((name) => name.length > 0);
}

/** Match query against Spanish, English, and German names (accent-insensitive). */
export function matchesCatalogSearch(
  item: LocalizedCatalogItem,
  rawQuery: string,
): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  const searchable = catalogSearchNames(item).map(normalizeSearchText);
  const tokens = query.split(/\s+/).filter(Boolean);

  return tokens.every((token) =>
    searchable.some((name) => name.includes(token)),
  );
}
