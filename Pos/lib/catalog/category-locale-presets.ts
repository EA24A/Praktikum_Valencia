import { normalizeCategoryKey } from "@/lib/products/parse-product-import";

/** Default EN/DE labels for common Spanish menu category names (POS-only; not synced to website). */
const CATEGORY_LOCALE_PRESETS: Record<string, { nameEn: string; nameDe: string }> = {
  bebidas: { nameEn: "Drinks", nameDe: "Getränke" },
  drinks: { nameEn: "Drinks", nameDe: "Getränke" },
  café: { nameEn: "Café", nameDe: "Kaffee" },
  cafe: { nameEn: "Café", nameDe: "Kaffee" },
  entrantes: { nameEn: "Starters", nameDe: "Vorspeisen" },
  "café y tes": { nameEn: "Coffee & Tea", nameDe: "Kaffee & Tee" },
  "cafe y tes": { nameEn: "Coffee & Tea", nameDe: "Kaffee & Tee" },
  "colección de cafés helados": {
    nameEn: "Iced Coffee Collection",
    nameDe: "Eiskaffee-Spezialitäten",
  },
  "coleccion de cafes helados": {
    nameEn: "Iced Coffee Collection",
    nameDe: "Eiskaffee-Spezialitäten",
  },
  "combo popular": { nameEn: "Combos", nameDe: "Kombos" },
  cócteles: { nameEn: "Cocktails", nameDe: "Cocktails" },
  cocteles: { nameEn: "Cocktails", nameDe: "Cocktails" },
  "bocados libaneses": { nameEn: "Lebanese Bites", nameDe: "Libanesische Häppchen" },
  "platos principales": { nameEn: "Main Courses", nameDe: "Hauptgerichte" },
  dulces: { nameEn: "Desserts", nameDe: "Nachspeisen" },
  postres: { nameEn: "Desserts", nameDe: "Nachspeisen" },
  comida: { nameEn: "Food", nameDe: "Speisen" },
};

export function categoryLocalePreset(nameEs: string) {
  return CATEGORY_LOCALE_PRESETS[normalizeCategoryKey(nameEs)];
}

export function resolveCategoryImportNames(
  nameEs: string,
  nameEn?: string,
  nameDe?: string,
) {
  const preset = categoryLocalePreset(nameEs);
  const trimmedEn = nameEn?.trim();
  const trimmedDe = nameDe?.trim();

  return {
    nameEs: nameEs.trim(),
    nameEn: trimmedEn || preset?.nameEn || nameEs.trim(),
    nameDe: trimmedDe || preset?.nameDe || "",
  };
}
