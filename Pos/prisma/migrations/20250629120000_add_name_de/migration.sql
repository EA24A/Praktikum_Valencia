-- POS-only German labels; not included in website catalog sync.
ALTER TABLE "Category" ADD COLUMN "nameDe" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "nameDe" TEXT NOT NULL DEFAULT '';
