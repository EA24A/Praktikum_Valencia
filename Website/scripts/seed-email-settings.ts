import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const settings = [
  { key: "email.resend_api_key", value: process.env.RESEND_API_KEY },
  { key: "email.from", value: process.env.RESEND_FROM_EMAIL ?? "noreply@casafenicia.com" },
  { key: "email.reservation_admin", value: process.env.RESERVATION_ADMIN_EMAIL ?? "ali@casafenicia.com" },
  { key: "email.admin", value: process.env.ADMIN_EMAIL ?? "admin@casafenicia.com" },
].filter((entry): entry is { key: string; value: string } => Boolean(entry.value));

async function main() {
  if (settings.length === 0) {
    throw new Error("No email settings found in .env.local");
  }

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
    console.log(`✅ ${setting.key}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
