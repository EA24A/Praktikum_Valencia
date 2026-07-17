/**
 * Sync menu from CasaPOS catalog XLSX (source of truth).
 * Removes products not in file, upserts the rest, clears variants/modifiers/combos.
 *
 * Usage:
 *   npx tsx scripts/sync-menu-catalog.ts [path-to.xlsx]
 */

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { syncMenuFromCatalogBuffer } from "../src/lib/menuImport";

const defaultPath = path.join(
  process.env.HOME ?? process.env.USERPROFILE ?? "",
  "Downloads",
  "casapos-products-2026-06-27.xlsx"
);

async function main() {
  const filePath = process.argv[2] ?? defaultPath;

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Syncing menu from ${filePath}...\n`);
  const buffer = fs.readFileSync(filePath);
  const result = await syncMenuFromCatalogBuffer(buffer);

  console.log("Done:");
  console.log(`  Upserted:     ${result.upserted}`);
  console.log(`  Deleted:      ${result.deleted}`);
  console.log(`  Deactivated:  ${result.deactivated}`);
  console.log(`  Combos removed: ${result.combosRemoved}`);
  console.log(`  Total in file:  ${result.totalInFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
