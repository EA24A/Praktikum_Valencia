-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "registerOpeningFloat" DECIMAL(10, 2) NOT NULL DEFAULT 50;

-- Existing register balance is treated as opening float until the first end-of-day close.
UPDATE "Settings"
SET "registerOpeningFloat" = "cashRegisterBalance"
WHERE "id" = 'default';
