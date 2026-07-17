import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  categoryLocalePreset,
  resolveCategoryImportNames,
} from "../lib/catalog/category-locale-presets";
import { normalizeCategoryKey } from "../lib/products/parse-product-import";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function needsEnglishBackfill(nameEs: string, nameEn: string) {
  const es = nameEs.trim();
  const en = nameEn.trim();
  if (!en || !es) return false;
  return normalizeCategoryKey(en) === normalizeCategoryKey(es);
}

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  let updated = 0;
  for (const category of categories) {
    const preset = categoryLocalePreset(category.nameEs);
    const resolved = resolveCategoryImportNames(
      category.nameEs,
      needsEnglishBackfill(category.nameEs, category.nameEn)
        ? preset?.nameEn
        : category.nameEn,
      category.nameDe,
    );

    const data: { nameEn?: string; nameDe?: string } = {};
    if (resolved.nameEn !== category.nameEn) {
      data.nameEn = resolved.nameEn;
    }
    if (resolved.nameDe && resolved.nameDe !== category.nameDe) {
      data.nameDe = resolved.nameDe;
    }

    if (Object.keys(data).length === 0) continue;

    await prisma.category.update({
      where: { id: category.id },
      data,
    });
    updated++;
    console.log(
      `Updated ${category.nameEs}: EN="${data.nameEn ?? category.nameEn}" DE="${data.nameDe ?? category.nameDe}"`,
    );
  }

  console.log(`Done. ${updated} categor${updated === 1 ? "y" : "ies"} updated.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
