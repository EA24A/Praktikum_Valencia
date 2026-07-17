import * as XLSX from "xlsx";
import {
  syncMenuFromPosProductRows,
  type PosCatalogProductRow,
} from "./posCatalogSync";

function parseCatalogRows(buffer: Buffer | ArrayBuffer): PosCatalogProductRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return rows
    .map((row) => ({
      sku: String(row.sku ?? "").trim(),
      product_type: String(row.product_type ?? "product").trim().toLowerCase(),
      name: String(row.name ?? "").trim(),
      name_en: String(row.name_en ?? "").trim(),
      name_ar: String(row.name_ar ?? "").trim(),
      category: String(row.category ?? "").trim(),
      price: Number(row.price),
      tax_rate: Number(row.tax_rate ?? 10),
      available: row.available as string | boolean,
      pos_only: String(row.pos_only ?? "").trim().toUpperCase() === "TRUE",
    }))
    .filter((row) => row.sku && row.name && row.category && !Number.isNaN(row.price));
}

export async function syncMenuFromCatalogBuffer(buffer: Buffer | ArrayBuffer) {
  const rows = parseCatalogRows(buffer);
  const result = await syncMenuFromPosProductRows(rows);
  return {
    upserted: result.upserted,
    deleted: result.deleted,
    deactivated: result.deactivated,
    combosRemoved: 0,
    posOnlyCount: result.posOnlyCount,
    webVisibleCount: result.webVisibleCount,
    totalInFile: result.totalInCatalog,
  };
}

export {
  syncMenuFromPosProductRows,
  fetchAndSyncFromPosApi,
  restoreMenuWebContent,
} from "./posCatalogSync";
