import { cn } from "@/lib/utils";

export function formatCurrency(
  amount: number | string,
  locale = "es-ES",
  currency = "EUR",
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDecimal(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export interface LineItemTaxInput {
  unitPrice: number;
  quantity: number;
  taxRate: number;
}

export interface LineItemTaxResult {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function calculateLineItemTax({
  unitPrice,
  quantity,
  taxRate,
}: LineItemTaxInput): LineItemTaxResult {
  // Product price is final (IVA included); taxRate is for receipt breakdown only.
  const total = formatDecimal(unitPrice * quantity);
  if (taxRate <= 0) {
    return { subtotal: total, taxAmount: 0, total };
  }
  const taxAmount = formatDecimal(total - total / (1 + taxRate / 100));
  const subtotal = formatDecimal(total - taxAmount);
  return { subtotal, taxAmount, total };
}

export function calculateOrderTotals(
  items: Array<{ subtotal: number; taxAmount: number; total: number; isVoided?: boolean }>,
  discountTotal = 0,
) {
  const activeItems = items.filter((item) => !item.isVoided);
  const subtotal = formatDecimal(activeItems.reduce((sum, item) => sum + item.subtotal, 0));
  const taxTotal = formatDecimal(activeItems.reduce((sum, item) => sum + item.taxAmount, 0));
  const grossTotal = formatDecimal(activeItems.reduce((sum, item) => sum + item.total, 0));
  const total = formatDecimal(Math.max(0, grossTotal - discountTotal));
  return { subtotal, taxTotal, discountTotal: formatDecimal(discountTotal), total };
}

export function generateReceiptNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 900 + 100);
  return `${y}${m}${d}-${random}`;
}

const RECEIPT_TYPE_PREFIX = {
  DINE_IN: "DI",
  TAKEAWAY: "TW",
  ONLINE: "OL",
} as const;

export function formatReceiptNumberByType(
  type: keyof typeof RECEIPT_TYPE_PREFIX,
  sequence: number,
): string {
  const prefix = RECEIPT_TYPE_PREFIX[type];
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

export { cn };
