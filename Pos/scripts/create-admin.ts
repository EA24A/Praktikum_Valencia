import bcrypt from "bcryptjs";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { prisma } from "../lib/prisma";

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const email = (await rl.question("Superadmin email: ")).trim().toLowerCase();
    const name = (await rl.question("Full name: ")).trim();
    const password = await rl.question("Password: ");

    if (!email || !name || !password) {
      throw new Error("All fields are required.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "SUPERADMIN",
      },
    });

    console.log(`Superadmin created: ${user.email} (${user.id})`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
