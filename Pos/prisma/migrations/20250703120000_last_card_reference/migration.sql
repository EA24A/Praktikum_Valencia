-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "lastCardReference" TEXT;

-- Seed from the most recent paid card order
UPDATE "Settings"
SET "lastCardReference" = sub."cardReference"
FROM (
  SELECT "cardReference"
  FROM "Order"
  WHERE "status" = 'PAID'
    AND "paymentMethod" = 'CARD'
    AND "cardReference" IS NOT NULL
  ORDER BY "paidAt" DESC NULLS LAST
  LIMIT 1
) AS sub
WHERE "Settings"."id" = 'default';
