-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "comboComponentIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
