import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const cats = await prisma.menuCategory.findMany({
    select: { id: true, slug: true, nameEs: true, nameEn: true, nameAr: true },
    orderBy: { displayOrder: "asc" },
  });
  console.log("CATEGORIES:");
  for (const c of cats) {
    console.log(`  - ${c.nameEs} | ${c.nameEn} | AR=${c.nameAr ?? "(null)"}`);
  }

  const items = await prisma.menuItem.findMany({
    select: {
      id: true,
      nameEs: true,
      nameEn: true,
      nameAr: true,
      descriptionEs: true,
      descriptionEn: true,
      descriptionAr: true,
    },
    orderBy: { displayOrder: "asc" },
  });
  console.log(`\nITEMS (${items.length}):`);
  for (const i of items) {
    console.log(`  - ${i.nameEs} | ${i.nameEn} | AR=${i.nameAr ?? "(null)"}`);
  }

  const variants = await prisma.itemVariant.findMany({
    select: { id: true, nameEs: true, nameEn: true, nameAr: true },
  });
  console.log(`\nVARIANTS (${variants.length}):`);
  for (const v of variants) {
    console.log(`  - ${v.nameEs} | ${v.nameEn} | AR=${v.nameAr ?? "(null)"}`);
  }

  const groups = await prisma.modifierGroup.findMany({
    select: { id: true, nameEs: true, nameEn: true, nameAr: true },
  });
  console.log(`\nMODIFIER GROUPS (${groups.length}):`);
  for (const g of groups) {
    console.log(`  - ${g.nameEs} | ${g.nameEn} | AR=${g.nameAr ?? "(null)"}`);
  }

  const mods = await prisma.modifier.findMany({
    select: { id: true, nameEs: true, nameEn: true, nameAr: true },
  });
  console.log(`\nMODIFIERS (${mods.length}):`);
  for (const m of mods) {
    console.log(`  - ${m.nameEs} | ${m.nameEn} | AR=${m.nameAr ?? "(null)"}`);
  }

  const combos = await prisma.comboDeal.findMany({
    select: {
      id: true,
      nameEs: true,
      nameEn: true,
      nameAr: true,
      descriptionEs: true,
      descriptionEn: true,
      descriptionAr: true,
    },
  });
  console.log(`\nCOMBOS (${combos.length}):`);
  for (const c of combos) {
    console.log(`  - ${c.nameEs} | ${c.nameEn} | AR=${c.nameAr ?? "(null)"}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
