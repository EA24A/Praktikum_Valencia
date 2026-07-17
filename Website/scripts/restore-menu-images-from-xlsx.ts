/**
 * Restore website imageUrl from Casa Fenicia export XLSX (matches by category + name).
 * Usage: npx tsx scripts/restore-menu-images-from-xlsx.ts path/to/export.xlsx
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

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/restore-menu-images-from-xlsx.ts <file.xlsx>");
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

  const items = await prisma.menuItem.findMany();
  const itemByKey = new Map(
    items.map((item) => [`${item.categoryId}:${normalize(item.nameEs)}`, item]),
  );

  let restored = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = String(row.name ?? "").trim();
    const category = String(row.category ?? "").trim();
    const imageUrl = String(row.image_url ?? "").trim();
    if (!name || !category || !imageUrl) {
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

    if (item.imageUrl === imageUrl) {
      skipped += 1;
      continue;
    }

    await prisma.menuItem.update({
      where: { id: item.id },
      data: { imageUrl },
    });
    restored += 1;
    console.log(`Restored image: ${name}`);
  }

  console.log(`Done. ${restored} images restored, ${skipped} rows skipped.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
