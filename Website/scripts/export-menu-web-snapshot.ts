import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import fs from "node:fs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const items = await prisma.menuItem.findMany({
    select: {
      nameEs: true,
      nameEn: true,
      imageUrl: true,
      descriptionEs: true,
      descriptionEn: true,
      descriptionAr: true,
      nameAr: true,
      isFeatured: true,
      allergens: true,
    },
  });

  fs.writeFileSync(
    "scripts/menu-web-snapshot.json",
    JSON.stringify(items, null, 2)
  );
  console.log("Wrote", items.length, "items to scripts/menu-web-snapshot.json");
}

main().finally(() => prisma.$disconnect());
