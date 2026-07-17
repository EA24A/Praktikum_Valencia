import type { PosOrderError } from "@/lib/actions/pos-orders";

export function posErrorStatus(error: PosOrderError): number {
  switch (error) {
    case "FORBIDDEN":
    case "NOT_CLOCKED_IN":
      return 403;
    case "NOT_FOUND":
    case "PRODUCT_NOT_FOUND":
      return 404;
    case "CASH_REQUIRED":
    case "INSUFFICIENT_TENDER":
      return 422;
    default:
      return 400;
  }
}
