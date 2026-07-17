import type { MenuPrintCategory } from "@/components/admin/menu-cards/menu-print-preview";
import {
  categoryLayoutWeight,
  columnForMenuPrintSection,
  menuPrintSectionKey,
  sortMenuPrintCategories,
} from "@/lib/menu-cards/menu-print-layout";

export { categoryLayoutWeight } from "@/lib/menu-cards/menu-print-layout";

export function distributeCategories(
  categories: MenuPrintCategory[],
  columnCount: number,
  options?: { reserveLastColumn?: number },
): MenuPrintCategory[][] {
  if (columnCount < 1) return [categories];

  const columns: MenuPrintCategory[][] = Array.from({ length: columnCount }, () => []);
  const weights = new Array<number>(columnCount).fill(0);

  if (options?.reserveLastColumn && columnCount > 1) {
    weights[columnCount - 1] = options.reserveLastColumn;
  }

  const sorted = sortMenuPrintCategories(categories);
  const unknown: MenuPrintCategory[] = [];

  for (const category of sorted) {
    const sectionKey = menuPrintSectionKey(category.name);
    if (!sectionKey) {
      unknown.push(category);
      continue;
    }

    const target = columnForMenuPrintSection(sectionKey, columnCount);
    columns[target]!.push(category);
    weights[target]! += categoryLayoutWeight(category);
  }

  for (const category of unknown) {
    let target = 0;
    for (let index = 1; index < columnCount; index += 1) {
      if (weights[index]! < weights[target]!) {
        target = index;
      }
    }
    columns[target]!.push(category);
    weights[target]! += categoryLayoutWeight(category);
  }

  return columns;
}
