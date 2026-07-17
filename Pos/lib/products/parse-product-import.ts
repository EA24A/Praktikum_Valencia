import * as XLSX from "xlsx";

export interface ProductImportRow {
  rowNumber: number;
  sku: string;
  nameEs: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  categoryDe: string;
  price: number;
  taxRate: number | null;
  isActive: boolean;
  posOnly: boolean;
  sortOrder: number;
}

export interface ProductImportParseResult {
  rows: ProductImportRow[];
  errors: { row: number; message: string }[];
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "si" ||
    normalized === "sí"
  );
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", ".").trim());
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function cell(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  return undefined;
}

export function normalizeCategoryKey(name: string): string {
  return name.trim().toLowerCase();
}

export function parseProductImportWorkbook(
  buffer: ArrayBuffer,
): ProductImportParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "catalog") ??
    workbook.SheetNames[0];

  if (!sheetName) {
    return { rows: [], errors: [{ row: 0, message: "No worksheet found" }] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "Empty worksheet" }] };
  }

  const headerRow = matrix[0].map(normalizeHeader);
  const headerIndex = new Map(headerRow.map((key, index) => [key, index]));

  const get = (row: (string | number | boolean)[], ...aliases: string[]) => {
    for (const alias of aliases) {
      const index = headerIndex.get(alias);
      if (index !== undefined) {
        return row[index];
      }
    }
    return "";
  };

  const required = ["name", "category", "price"];
  const missing = required.filter((key) => !headerIndex.has(key));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: `Missing columns: ${missing.join(", ")}. Expected Casa Fenicia export format.`,
        },
      ],
    };
  }

  const rows: ProductImportRow[] = [];
  const errors: { row: number; message: string }[] = [];
  const sortByCategory = new Map<string, number>();

  for (let i = 1; i < matrix.length; i++) {
    const raw = matrix[i];
    const rowNumber = i + 1;

    if (!raw || raw.every((cell) => String(cell ?? "").trim() === "")) {
      continue;
    }

    const record: Record<string, unknown> = {};
    headerRow.forEach((key, index) => {
      record[key] = raw[index];
    });

    const productType = String(get(raw, "product_type") ?? "product")
      .trim()
      .toLowerCase();
    if (productType && productType !== "product") {
      continue;
    }

    const nameEs = String(get(raw, "name") ?? "").trim();
    const nameEnRaw = String(get(raw, "name_en") ?? "").trim();
    const category = String(get(raw, "category") ?? "").trim();
    const categoryEn = String(get(raw, "category_en") ?? "").trim();
    const categoryDe = String(get(raw, "category_de") ?? "").trim();
    const price = parsePrice(get(raw, "price"));
    const available = cell(record, "available");
    const posOnlyRaw = cell(record, "pos_only");
    const taxRateRaw = get(raw, "tax_rate");
    const sku = String(get(raw, "sku") ?? "").trim();

    if (!nameEs) {
      errors.push({ row: rowNumber, message: "Missing product name" });
      continue;
    }
    if (!category) {
      errors.push({ row: rowNumber, message: `"${nameEs}": missing category` });
      continue;
    }
    if (price === null) {
      errors.push({ row: rowNumber, message: `"${nameEs}": invalid price` });
      continue;
    }

    const categoryKey = normalizeCategoryKey(category);
    const sortOrder = sortByCategory.get(categoryKey) ?? 0;
    sortByCategory.set(categoryKey, sortOrder + 1);

    const taxRateParsed = parsePrice(taxRateRaw);

    rows.push({
      rowNumber,
      sku,
      nameEs,
      nameEn: nameEnRaw || nameEs,
      category,
      categoryEn,
      categoryDe,
      price,
      taxRate: taxRateParsed,
      isActive: available === undefined ? true : parseBoolean(available),
      posOnly: posOnlyRaw === undefined ? false : parseBoolean(posOnlyRaw),
      sortOrder,
    });
  }

  return { rows, errors };
}
