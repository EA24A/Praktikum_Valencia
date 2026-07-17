import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("Skipping prisma migrate deploy: DATABASE_URL is not set.");
  process.exit(0);
}

console.log("Running prisma migrate deploy...");
execSync("prisma migrate deploy", { stdio: "inherit" });
