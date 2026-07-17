-- AlterTable
ALTER TABLE "LuggageStorage" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill existing rows: €1/hour + €5 per full day
UPDATE "LuggageStorage"
SET "price" = (("durationHours" / 24) * 5) + (("durationHours" % 24) * 1);
