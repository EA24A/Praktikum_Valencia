/**
 * One-shot helper: backfills Arabic translations for already-seeded
 * categories and menu items. Idempotent: only writes nameAr / descriptionAr
 * when they are currently null/empty, so re-running it never overwrites
 * what the admin has already edited.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Translation tables ─────────────────────────────────────────────────────

const CATEGORY_AR: Record<string, string> = {
  entrantes: "المقبلات",
  principales: "الأطباق الرئيسية",
  carnes: "أطباق اللحوم",
  vegetariano: "نباتي",
  bebidas: "المشروبات",
  postres: "الحلويات",
};

type ItemTranslation = { name: string; description?: string };

// Keyed by Spanish name (which is what's seeded today).
const ITEM_AR: Record<string, ItemTranslation> = {
  "Hummus Clásico": {
    name: "حُمُّص كلاسيكي",
    description: "كريمة الحمص بزيت الزيتون والفلفل الأحمر، تُقدَّم مع خبز البيتا.",
  },
  "Falafel (6 uds)": {
    name: "فلافل (6 قطع)",
    description: "أقراص الحمص المقرمشة مع صلصة الطحينة والخضروات الطازجة.",
  },
  Tabbouleh: {
    name: "تبولة",
    description: "سلطة بقدونس طازج مع البندورة والبرغل والليمون وزيت الزيتون.",
  },
  "Shawarma de Pollo": {
    name: "شاورما الدجاج",
    description: "دجاج متبَّل بالبهارات اللبنانية ملفوف بخبز البيتا مع صلصة الثوم.",
  },
  Kibbeh: {
    name: "كبة",
    description: "أقراص لحم الضأن بالبرغل والبهارات. 4 قطع.",
  },
  "Meze Vegetariano": {
    name: "مَزّة نباتية",
    description: "تشكيلة من الحمص والفلافل والتبولة وبابا غنوج.",
  },
};

async function main() {
  console.log("Backfilling Arabic translations...");

  // Categories
  let catUpdates = 0;
  const cats = await prisma.menuCategory.findMany();
  for (const c of cats) {
    if (c.nameAr && c.nameAr.trim()) continue;
    const ar = CATEGORY_AR[c.slug];
    if (!ar) {
      console.log(`  · skipping category "${c.nameEs}" (slug=${c.slug}) - no translation`);
      continue;
    }
    await prisma.menuCategory.update({ where: { id: c.id }, data: { nameAr: ar } });
    catUpdates++;
    console.log(`  ✓ category: ${c.nameEs} → ${ar}`);
  }

  // Items
  let itemUpdates = 0;
  const items = await prisma.menuItem.findMany();
  for (const item of items) {
    const tr = ITEM_AR[item.nameEs];
    if (!tr) {
      console.log(`  · skipping item "${item.nameEs}" - no translation`);
      continue;
    }
    const data: { nameAr?: string; descriptionAr?: string } = {};
    if (!item.nameAr || !item.nameAr.trim()) data.nameAr = tr.name;
    if (tr.description && (!item.descriptionAr || !item.descriptionAr.trim())) {
      data.descriptionAr = tr.description;
    }
    if (Object.keys(data).length === 0) continue;
    await prisma.menuItem.update({ where: { id: item.id }, data });
    itemUpdates++;
    console.log(`  ✓ item: ${item.nameEs} → ${tr.name}`);
  }

  console.log(`\nDone. Categories updated: ${catUpdates}, items updated: ${itemUpdates}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
