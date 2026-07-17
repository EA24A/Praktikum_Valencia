-- Track which split-bill parts have been paid (0-based indices).
ALTER TABLE "Order" ADD COLUMN "paidSplitIndices" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
