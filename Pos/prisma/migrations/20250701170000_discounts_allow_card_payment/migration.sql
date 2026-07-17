-- Allow all discounts on card payments (clear legacy cash-only flag).
UPDATE "Discount" SET "requiresCashPayment" = false WHERE "requiresCashPayment" = true;
