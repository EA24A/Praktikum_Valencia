-- Cash register balance and cash payment tender/change.
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "cashRegisterBalance" DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountTendered" DECIMAL(10, 2);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "changeGiven" DECIMAL(10, 2);
