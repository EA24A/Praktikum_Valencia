-- Persist per-split payment metadata (method, card reference, totals).
ALTER TABLE "Order" ADD COLUMN "splitPayments" JSONB;
