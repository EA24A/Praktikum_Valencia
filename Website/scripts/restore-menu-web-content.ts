/**
 * Fill gaps in menu web content from:
 * 1. menu-web-snapshot.json (prior export / xlsx-derived)
 * 2. Fuzzy sibling match in DB (e.g. Cortado <- Café Cortado)
 * 3. menuWebContent.ts fallbacks
 *
 * Usage:
 *   npx tsx scripts/restore-menu-web-content.ts
 *   npx tsx scripts/restore-menu-web-content.ts --force-images
 *   npx tsx scripts/restore-menu-web-content.ts --from-xlsx path/to/export.xlsx
 */

import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  lookupWebEnrichment,
  mergeWebFields,
  normalizeMenuName,
  pickWebFields,
} from "../src/lib/menuWebContent";
import { restoreMenuWebContent } from "../src/lib/posCatalogSync";

type SnapshotRow = {
  nameEs: string;
  nameEn?: string;
  imageUrl?: string | null;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  nameAr?: string | null;
  isFeatured?: boolean;
  allergens?: string[];
};

const ALIAS_GROUPS: string[][] = [
  ["cortado", "cafe cortado"],
  ["cafe solo", "cafe espresso"],
  ["cafe afogatto", "affogato freddo", "cafe afogato"],
  ["cafe afogato", "affogato freddo"],
];

function loadSnapshot(filePath: string): Map<string, SnapshotRow> {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as SnapshotRow[];
  const map = new Map<string, SnapshotRow>();
  for (const row of raw) {
    if (row.nameEs) map.set(normalizeMenuName(row.nameEs), row);
  }
  return map;
}

function loadXlsx(filePath: string): Map<string, SnapshotRow> {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const map = new Map<string, SnapshotRow>();

  for (const row of rows) {
    const nameEs = String(row.name ?? row.name_es ?? "").trim();
    if (!nameEs) continue;
    map.set(normalizeMenuName(nameEs), {
      nameEs,
      nameEn: String(row.name_en ?? "").trim() || undefined,
      imageUrl: String(row.image_url ?? "").trim() || null,
      descriptionEs: String(row.description ?? row.description_es ?? "").trim() || null,
      descriptionEn: String(row.description_en ?? "").trim() || null,
      descriptionAr: String(row.description_ar ?? "").trim() || null,
      nameAr: String(row.name_ar ?? "").trim() || null,
    });
  }
  return map;
}

function findAliasMatch(
  nameEs: string,
  byName: Map<string, { web: ReturnType<typeof pickWebFields> }>
) {
  const key = normalizeMenuName(nameEs);
  for (const group of ALIAS_GROUPS) {
    if (!group.includes(key)) continue;
    for (const alias of group) {
      if (alias === key) continue;
      const donor = byName.get(alias);
      if (donor?.web.imageUrl || donor?.web.descriptionEs) return donor.web;
    }
  }
  return null;
}

async function applySources(
  sources: Map<string, SnapshotRow>[],
  options: { overwriteImages?: boolean }
) {
  const items = await prisma.menuItem.findMany();
  const byName = new Map(
    items.map((item) => [normalizeMenuName(item.nameEs), { item, web: pickWebFields(item) }])
  );

  let updated = 0;

  for (const item of items) {
    const key = normalizeMenuName(item.nameEs);
    let donor: ReturnType<typeof pickWebFields> | null = null;

    for (const source of sources) {
      const row = source.get(key);
      if (row) {
        donor = mergeWebFields(donor, {
          imageUrl: row.imageUrl ?? undefined,
          descriptionEs: row.descriptionEs ?? undefined,
          descriptionEn: row.descriptionEn ?? undefined,
          descriptionAr: row.descriptionAr ?? undefined,
          nameAr: row.nameAr ?? undefined,
          isFeatured: row.isFeatured,
          allergens: row.allergens,
        });
      }
    }

    const aliasDonor = findAliasMatch(item.nameEs, byName);
    if (aliasDonor) donor = mergeWebFields(donor, aliasDonor);

    const enrichment = lookupWebEnrichment(item.nameEs);
    const merged = mergeWebFields(donor ?? pickWebFields(item), enrichment);
    const current = pickWebFields(item);

    const data: Record<string, unknown> = {};

    if (!current.nameAr && merged.nameAr) data.nameAr = merged.nameAr;
    if (!current.descriptionEs && merged.descriptionEs) data.descriptionEs = merged.descriptionEs;
    if (!current.descriptionEn && merged.descriptionEn) data.descriptionEn = merged.descriptionEn;
    if (!current.descriptionAr && merged.descriptionAr) data.descriptionAr = merged.descriptionAr;
    if (!current.isFeatured && merged.isFeatured) data.isFeatured = true;
    if (current.allergens.length === 0 && merged.allergens.length > 0) {
      data.allergens = merged.allergens;
    }

    const shouldSetImage =
      merged.imageUrl && (options.overwriteImages || !current.imageUrl);
    if (shouldSetImage) data.imageUrl = merged.imageUrl;

    if (Object.keys(data).length > 0) {
      await prisma.menuItem.update({ where: { id: item.id }, data });
      updated += 1;
    }
  }

  return updated;
}

async function main() {
  const args = process.argv.slice(2);
  const forceImages = args.includes("--force-images");
  const xlsxIdx = args.indexOf("--from-xlsx");
  const xlsxPath = xlsxIdx >= 0 ? args[xlsxIdx + 1] : undefined;

  const sources: Map<string, SnapshotRow>[] = [];

  const snapshotPath = path.join(process.cwd(), "scripts/menu-web-snapshot.json");
  if (fs.existsSync(snapshotPath)) {
    sources.push(loadSnapshot(snapshotPath));
    console.log("Loaded snapshot:", snapshotPath);
  }

  if (xlsxPath && fs.existsSync(xlsxPath)) {
    sources.push(loadXlsx(xlsxPath));
    console.log("Loaded xlsx:", xlsxPath);
  }

  let updated = 0;
  if (sources.length > 0) {
    updated = await applySources(sources, { overwriteImages: forceImages });
    console.log("Applied external sources to", updated, "items");
  }

  const base = await restoreMenuWebContent({ overwriteImages: forceImages });
  console.log(
    `Done: ${base.imagesRestored} images, ${base.textRestored} text fields from rules (${base.total} items)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
