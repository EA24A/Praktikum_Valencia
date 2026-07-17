import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.siteSetting.upsert({
    where: { key: "instagram_url" },
    update: { value: "https://www.instagram.com/casafeniciavlc?igsh=YWVsNjkxc2Y5ZXNl&utm_source=qr" },
    create: { key: "instagram_url", value: "https://www.instagram.com/casafeniciavlc?igsh=YWVsNjkxc2Y5ZXNl&utm_source=qr" },
  });
  await prisma.siteSetting.upsert({
    where: { key: "tiktok_url" },
    update: { value: "https://www.tiktok.com/@casafeniciavlc?_r=1&_t=ZN-965NxciF8LO" },
    create: { key: "tiktok_url", value: "https://www.tiktok.com/@casafeniciavlc?_r=1&_t=ZN-965NxciF8LO" },
  });
  console.log("Social links saved to DB");
}

main().finally(() => prisma.$disconnect());
