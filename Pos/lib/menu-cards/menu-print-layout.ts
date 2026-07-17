import type { MenuPrintCategory } from "@/components/admin/menu-cards/menu-print-preview";

/** Canonical menu section order for Casa Fenicia print layout. */
export const MENU_PRINT_SECTION_ORDER = [
  "mainCourses",
  "entrees",
  "desserts",
  "coffeeTea",
  "icedCoffee",
  "drinks",
  "cocktails",
] as const;

export type MenuPrintSectionKey = (typeof MENU_PRINT_SECTION_ORDER)[number];

const SECTION_MATCHERS: Array<{ key: MenuPrintSectionKey; patterns: RegExp[] }> = [
  {
    key: "mainCourses",
    patterns: [/main\s*cours/i, /platos\s*princip/i, /hauptger/i],
  },
  {
    key: "entrees",
    patterns: [/entr(?:ee|ée|ante|antes)/i, /starter/i, /vorspeis/i],
  },
  {
    key: "desserts",
    patterns: [/dessert/i, /\bdulces\b/i, /postres/i, /nachspeis/i],
  },
  {
    key: "icedCoffee",
    patterns: [/iced\s*coffee/i, /colecci[oó]n.*helados/i, /eiskaffee/i],
  },
  {
    key: "coffeeTea",
    patterns: [/coffee\s*&?\s*tea/i, /caf[eé]\s*y\s*tes/i, /kaffee\s*&?\s*tee/i],
  },
  {
    key: "cocktails",
    patterns: [/cocktail/i, /c[oó]ctel/i],
  },
  {
    key: "drinks",
    patterns: [/\bdrinks\b/i, /\bbebidas\b/i, /getränke/i],
  },
];

const LANDSCAPE_COLUMN_BY_SECTION: Record<MenuPrintSectionKey, number> = {
  mainCourses: 0,
  entrees: 1,
  desserts: 2,
  coffeeTea: 3,
  icedCoffee: 2,
  drinks: 1,
  cocktails: 3,
};

const PORTRAIT_COLUMN_BY_SECTION: Record<MenuPrintSectionKey, number> = {
  mainCourses: 0,
  entrees: 0,
  desserts: 0,
  coffeeTea: 1,
  icedCoffee: 1,
  drinks: 1,
  cocktails: 1,
};

export function menuPrintSectionKey(categoryName: string): MenuPrintSectionKey | null {
  const name = categoryName.trim();
  for (const { key, patterns } of SECTION_MATCHERS) {
    if (patterns.some((pattern) => pattern.test(name))) {
      return key;
    }
  }
  return null;
}

export function menuPrintSectionOrder(categoryName: string): number {
  const key = menuPrintSectionKey(categoryName);
  if (!key) return MENU_PRINT_SECTION_ORDER.length + 1;
  return MENU_PRINT_SECTION_ORDER.indexOf(key);
}

export function sortMenuPrintCategories(
  categories: MenuPrintCategory[],
): MenuPrintCategory[] {
  return [...categories].sort(
    (a, b) => menuPrintSectionOrder(a.name) - menuPrintSectionOrder(b.name),
  );
}

export function columnForMenuPrintSection(
  sectionKey: MenuPrintSectionKey,
  columnCount: number,
): number {
  const map = columnCount >= 4 ? LANDSCAPE_COLUMN_BY_SECTION : PORTRAIT_COLUMN_BY_SECTION;
  const column = map[sectionKey];
  return Math.min(column, columnCount - 1);
}

export function categoryLayoutWeight(category: MenuPrintCategory): number {
  return category.items.length + 3;
}
