/**
 * Restore website enrichments from Casa Fenicia export XLSX:
 * imageUrl, descriptionEs/En/Ar, nameAr, isFeatured, allergens.
 * Only fills empty fields unless --force is passed.
 *
 * Usage:
 *   npx tsx scripts/restore-menu-enrichment-from-xlsx.ts path/to/export.xlsx
 *   npx tsx scripts/restore-menu-enrichment-from-xlsx.ts path/to/export.xlsx --force
 */
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function str(value: unknown): string {
  return String(value ?? "").trim();
}

function parseFeatured(value: unknown): boolean {
  return str(value).toUpperCase() === "TRUE";
}

function parseAllergens(value: unknown): string[] {
  const raw = str(value);
  if (!raw) return [];
  return raw
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function main() {
  const filePath = process.argv[2];
  const force = process.argv.includes("--force");
  if (!filePath) {
    console.error(
      "Usage: npx tsx scripts/restore-menu-enrichment-from-xlsx.ts <file.xlsx> [--force]",
    );
    process.exit(1);
  }

  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const categories = await prisma.menuCategory.findMany();
  const categoryByName = new Map(
    categories.map((category) => [normalize(category.nameEs), category.id]),
  );

  const items = await prisma.menuItem.findMany({
    select: {
      id: true,
      categoryId: true,
      nameEs: true,
      imageUrl: true,
      descriptionEs: true,
      descriptionEn: true,
      descriptionAr: true,
      nameAr: true,
      isFeatured: true,
      allergens: true,
    },
  });
  const itemByKey = new Map(
    items.map((item) => [`${item.categoryId}:${normalize(item.nameEs)}`, item]),
  );

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = str(row.name);
    const category = str(row.category);
    if (!name || !category) {
      skipped += 1;
      continue;
    }

    const categoryId = categoryByName.get(normalize(category));
    if (!categoryId) {
      skipped += 1;
      continue;
    }

    const item = itemByKey.get(`${categoryId}:${normalize(name)}`);
    if (!item) {
      skipped += 1;
      continue;
    }

    const patch: {
      imageUrl?: string;
      descriptionEs?: string;
      descriptionEn?: string;
      descriptionAr?: string;
      nameAr?: string;
      isFeatured?: boolean;
      allergens?: string[];
    } = {};

    const imageUrl = str(row.image_url);
    const descriptionEs = str(row.description);
    const descriptionEn = str(row.description_en);
    const descriptionAr = str(row.description_ar);
    const nameAr = str(row.name_ar);
    const allergens = parseAllergens(row.allergens);
    const isFeatured = parseFeatured(row.featured);

    if (imageUrl && (force || !item.imageUrl)) patch.imageUrl = imageUrl;
    if (descriptionEs && (force || !item.descriptionEs)) patch.descriptionEs = descriptionEs;
    if (descriptionEn && (force || !item.descriptionEn)) patch.descriptionEn = descriptionEn;
    if (descriptionAr && (force || !item.descriptionAr)) patch.descriptionAr = descriptionAr;
    if (nameAr && (force || !item.nameAr)) patch.nameAr = nameAr;
    if (isFeatured && (force || !item.isFeatured)) patch.isFeatured = isFeatured;
    if (allergens.length > 0 && (force || item.allergens.length === 0)) {
      patch.allergens = allergens;
    }

    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }

    await prisma.menuItem.update({
      where: { id: item.id },
      data: patch,
    });
    updated += 1;
    console.log(`Enriched: ${name}`);
  }

  console.log(`Done. ${updated} items enriched, ${skipped} rows skipped.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
