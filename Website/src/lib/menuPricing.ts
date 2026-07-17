import { formatPrice } from "./utils";

type Numeric = number | string | { toNumber(): number };

function toNumber(value: Numeric) {
  return typeof value === "object" ? value.toNumber() : Number(value);
}

/** POS prices are final (IVA included); taxRate is informational only. */
export function priceWithTax(finalPrice: Numeric, _taxRate?: Numeric) {
  return Math.round(toNumber(finalPrice) * 100) / 100;
}

export function formatPriceWithTax(finalPrice: Numeric, taxRate?: Numeric) {
  return formatPrice(priceWithTax(finalPrice, taxRate));
}

export function parseAvailable(value: unknown) {
  return String(value ?? "").trim().toUpperCase() === "TRUE";
}
