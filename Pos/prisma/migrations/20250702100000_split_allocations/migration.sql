-- Per-split quantity allocations for split bills, e.g. [{ "splitIndex": 0, "quantity": 1 }].
ALTER TABLE "OrderItem" ADD COLUMN "splitAllocations" JSONB;
