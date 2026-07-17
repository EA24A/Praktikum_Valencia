import * as XLSX from "xlsx";
import { format } from "date-fns";
import { formatDecimal } from "@/lib/calculations";

export interface ProductExportRow {
  id: string;
  nameEs: string;
  nameEn: string;
  categoryName: string;
  categoryNameEn: string;
  categoryNameDe: string;
  price: number;
  taxRate: number;
  isActive: boolean;
  posOnly: boolean;
  sortOrder: number;
}

/** Stored price is already the final customer price (IVA included). */
export function priceAfterTax(price: number, _taxRate?: number): number {
  return formatDecimal(price);
}

export const PRODUCT_EXPORT_HEADERS = [
  "sku",
  "product_type",
  "name",
  "name_en",
  "category",
  "category_en",
  "category_de",
  "price",
  "tax_rate",
  "price_after_tax",
  "currency",
  "available",
  "pos_only",
] as const;

export function buildProductExportFilename(date = new Date()): string {
  return `casapos-products-${format(date, "yyyy-MM-dd")}.xlsx`;
}

export function buildProductExportXlsx(rows: ProductExportRow[]): ArrayBuffer {
  const sheetRows: (string | number)[][] = [
    [...PRODUCT_EXPORT_HEADERS],
    ...rows
      .sort((a, b) => {
        const category = a.categoryName.localeCompare(b.categoryName, "es");
        if (category !== 0) return category;
        return a.sortOrder - b.sortOrder;
      })
      .map((row) => [
        row.id,
        "product",
        row.nameEs,
        row.nameEn,
        row.categoryName,
        row.categoryNameEn,
        row.categoryNameDe,
        row.price,
        row.taxRate,
        priceAfterTax(row.price, row.taxRate),
        "EUR",
        row.isActive ? "TRUE" : "FALSE",
        row.posOnly ? "TRUE" : "FALSE",
      ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 32 },
    { wch: 32 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catalog");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
