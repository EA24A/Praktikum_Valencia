import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const items = await prisma.menuItem.findMany({
    select: {
      nameEs: true,
      imageUrl: true,
      descriptionEs: true,
      descriptionEn: true,
    },
  });

  const withImg = items.filter((i) => i.imageUrl).length;
  const withDesc = items.filter((i) => i.descriptionEs || i.descriptionEn).length;

  console.log("total", items.length, "with image", withImg, "with desc", withDesc);
  console.log(
    "missing image",
    items.filter((i) => !i.imageUrl).map((i) => i.nameEs),
  );
  console.log(
    "missing desc",
    items.filter((i) => !i.descriptionEs && !i.descriptionEn).map((i) => i.nameEs),
  );

  await prisma.$disconnect();
}

main().catch(console.error);
