import type { PaymentMethod } from "@prisma/client";

export type PaymentChannelStats = {
  revenue: number;
  orders: number;
};

export type PaymentBreakdown = {
  cash: PaymentChannelStats;
  online: PaymentChannelStats;
};

export function emptyPaymentChannelStats(): PaymentChannelStats {
  return { revenue: 0, orders: 0 };
}

export function emptyPaymentBreakdown(): PaymentBreakdown {
  return {
    cash: emptyPaymentChannelStats(),
    online: emptyPaymentChannelStats(),
  };
}

export function paymentChannelKey(
  method: PaymentMethod | null | undefined,
): keyof PaymentBreakdown | null {
  if (method === "CASH") return "cash";
  if (method === "CARD") return "online";
  return null;
}

export function addPaymentToBreakdown(
  breakdown: PaymentBreakdown,
  method: PaymentMethod | null | undefined,
  revenue: number,
  orders = 1,
): void {
  const key = paymentChannelKey(method);
  if (!key) return;
  breakdown[key].revenue += revenue;
  breakdown[key].orders += orders;
}

export function totalPaymentBreakdown(breakdown: PaymentBreakdown): PaymentChannelStats {
  return {
    revenue: breakdown.cash.revenue + breakdown.online.revenue,
    orders: breakdown.cash.orders + breakdown.online.orders,
  };
}

export function paymentBreakdownFromGroupedRows(
  rows: Array<{
    paymentMethod: PaymentMethod | null;
    _sum: { total: { toNumber(): number } | number | null };
    _count: number;
  }>,
  toNumber: (value: { toNumber(): number } | number | null | undefined) => number,
): PaymentBreakdown {
  const breakdown = emptyPaymentBreakdown();
  for (const row of rows) {
    addPaymentToBreakdown(
      breakdown,
      row.paymentMethod,
      toNumber(row._sum.total),
      row._count,
    );
  }
  return breakdown;
}
