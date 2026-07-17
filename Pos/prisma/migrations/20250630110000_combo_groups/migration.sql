-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "comboComponentGroups" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "comboSourceProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
