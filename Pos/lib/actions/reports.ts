import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth-utils";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  subDays,
  eachDayOfInterval,
  format,
  differenceInMinutes,
} from "date-fns";
import type { PaymentMethod } from "@prisma/client";
import {
  addPaymentToBreakdown,
  emptyPaymentBreakdown,
  paymentBreakdownFromGroupedRows,
  type PaymentBreakdown,
} from "@/lib/reports/payment-breakdown";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7Days"
  | "thisMonth"
  | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

function toNumber(
  value: { toNumber(): number } | number | null | undefined,
): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

export function getDateRangeFromPreset(
  preset: DateRangePreset,
  customFrom?: Date,
  customTo?: Date,
): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "last7Days":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfDay(now) };
    case "custom":
      return {
        from: customFrom ? startOfDay(customFrom) : startOfDay(now),
        to: customTo ? endOfDay(customTo) : endOfDay(now),
      };
  }
}

export function parseDateRangeParams(
  from?: string | null,
  to?: string | null,
): DateRange {
  if (from && to) {
    return {
      from: startOfDay(new Date(from)),
      to: endOfDay(new Date(to)),
    };
  }
  return getDateRangeFromPreset("today");
}

function paidOrdersWhere(range: DateRange) {
  return {
    status: "PAID" as const,
    paidAt: { gte: range.from, lte: range.to },
  };
}

async function getPaymentBreakdownForRange(range: DateRange): Promise<PaymentBreakdown> {
  const rows = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: {
      ...paidOrdersWhere(range),
      paymentMethod: { not: null },
    },
    _sum: { total: true },
    _count: true,
  });

  return paymentBreakdownFromGroupedRows(rows, toNumber);
}

export async function getSalesOverview(range: DateRange) {
  await requireSuperadmin();

  const orders = await prisma.order.findMany({
    where: paidOrdersWhere(range),
    select: { total: true, paidAt: true, paymentMethod: true },
  });

  const paymentBreakdown = emptyPaymentBreakdown();
  const totalRevenue = orders.reduce((sum, o) => sum + toNumber(o.total), 0);
  const orderCount = orders.length;
  const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const dailyMap = new Map(
    days.map((d) => [
      format(d, "yyyy-MM-dd"),
      {
        date: format(d, "yyyy-MM-dd"),
        revenue: 0,
        orders: 0,
        cashRevenue: 0,
        onlineRevenue: 0,
        cashOrders: 0,
        onlineOrders: 0,
      },
    ]),
  );

  for (const order of orders) {
    const revenue = toNumber(order.total);
    addPaymentToBreakdown(paymentBreakdown, order.paymentMethod, revenue);

    if (!order.paidAt) continue;
    const key = format(order.paidAt, "yyyy-MM-dd");
    const entry = dailyMap.get(key);
    if (entry) {
      entry.revenue += revenue;
      entry.orders += 1;
      if (order.paymentMethod === "CASH") {
        entry.cashRevenue += revenue;
        entry.cashOrders += 1;
      } else if (order.paymentMethod === "CARD") {
        entry.onlineRevenue += revenue;
        entry.onlineOrders += 1;
      }
    }
  }

  return {
    totalRevenue,
    orderCount,
    averageTicket,
    paymentBreakdown,
    dailySales: Array.from(dailyMap.values()),
  };
}

export async function getBestSellers(range: DateRange) {
  await requireSuperadmin();

  const items = await prisma.orderItem.findMany({
    where: {
      isVoided: false,
      order: paidOrdersWhere(range),
    },
    include: {
      product: { select: { id: true, nameEs: true, nameEn: true, nameDe: true } },
      order: { select: { paymentMethod: true } },
    },
  });

  const map = new Map<
    string,
    {
      productId: string;
      nameEs: string;
      nameEn: string;
      nameDe: string;
      quantity: number;
      revenue: number;
      cashRevenue: number;
      onlineRevenue: number;
    }
  >();

  for (const item of items) {
    const existing = map.get(item.productId);
    const qty = item.quantity;
    const revenue = toNumber(item.total);
    const cashRevenue = item.order.paymentMethod === "CASH" ? revenue : 0;
    const onlineRevenue = item.order.paymentMethod === "CARD" ? revenue : 0;
    if (existing) {
      existing.quantity += qty;
      existing.revenue += revenue;
      existing.cashRevenue += cashRevenue;
      existing.onlineRevenue += onlineRevenue;
    } else {
      map.set(item.productId, {
        productId: item.productId,
        nameEs: item.product.nameEs,
        nameEn: item.product.nameEn,
        nameDe: item.product.nameDe,
        quantity: qty,
        revenue,
        cashRevenue,
        onlineRevenue,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

export async function getPeakHours(range: DateRange) {
  await requireSuperadmin();

  const orders = await prisma.order.findMany({
    where: paidOrdersWhere(range),
    select: { total: true, paidAt: true, paymentMethod: true },
  });

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    orders: 0,
    revenue: 0,
    cashRevenue: 0,
    onlineRevenue: 0,
  }));

  for (const order of orders) {
    if (!order.paidAt) continue;
    const h = order.paidAt.getHours();
    const revenue = toNumber(order.total);
    hours[h].orders += 1;
    hours[h].revenue += revenue;
    if (order.paymentMethod === "CASH") {
      hours[h].cashRevenue += revenue;
    } else if (order.paymentMethod === "CARD") {
      hours[h].onlineRevenue += revenue;
    }
  }

  return hours;
}

export async function getEmployeePerformance(range: DateRange) {
  await requireSuperadmin();

  const orders = await prisma.order.findMany({
    where: paidOrdersWhere(range),
    select: {
      total: true,
      paymentMethod: true,
      paidBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  const map = new Map<
    string,
    {
      employeeId: string;
      name: string;
      orders: number;
      revenue: number;
      cashRevenue: number;
      onlineRevenue: number;
    }
  >();

  for (const order of orders) {
    const employee = order.paidBy ?? order.createdBy;
    const existing = map.get(employee.id);
    const revenue = toNumber(order.total);
    const cashRevenue = order.paymentMethod === "CASH" ? revenue : 0;
    const onlineRevenue = order.paymentMethod === "CARD" ? revenue : 0;
    if (existing) {
      existing.orders += 1;
      existing.revenue += revenue;
      existing.cashRevenue += cashRevenue;
      existing.onlineRevenue += onlineRevenue;
    } else {
      map.set(employee.id, {
        employeeId: employee.id,
        name: employee.name,
        orders: 1,
        revenue,
        cashRevenue,
        onlineRevenue,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

export async function getPaymentMethods(range: DateRange) {
  await requireSuperadmin();

  const orders = await prisma.order.findMany({
    where: {
      ...paidOrdersWhere(range),
      paymentMethod: { not: null },
    },
    select: { paymentMethod: true, total: true },
  });

  const map = new Map<
    PaymentMethod,
    { method: PaymentMethod; orders: number; revenue: number }
  >();

  for (const order of orders) {
    if (!order.paymentMethod) continue;
    const existing = map.get(order.paymentMethod);
    const revenue = toNumber(order.total);
    if (existing) {
      existing.orders += 1;
      existing.revenue += revenue;
    } else {
      map.set(order.paymentMethod, {
        method: order.paymentMethod,
        orders: 1,
        revenue,
      });
    }
  }

  return Array.from(map.values());
}

export async function getCategoryPerformance(range: DateRange) {
  await requireSuperadmin();

  const items = await prisma.orderItem.findMany({
    where: {
      isVoided: false,
      order: paidOrdersWhere(range),
    },
    include: {
      product: {
        include: { category: { select: { id: true, nameEs: true, nameEn: true, nameDe: true } } },
      },
      order: { select: { paymentMethod: true } },
    },
  });

  const map = new Map<
    string,
    {
      categoryId: string;
      nameEs: string;
      nameEn: string;
      nameDe: string;
      quantity: number;
      revenue: number;
      cashRevenue: number;
      onlineRevenue: number;
    }
  >();

  for (const item of items) {
    const cat = item.product.category;
    const existing = map.get(cat.id);
    const qty = item.quantity;
    const revenue = toNumber(item.total);
    const cashRevenue = item.order.paymentMethod === "CASH" ? revenue : 0;
    const onlineRevenue = item.order.paymentMethod === "CARD" ? revenue : 0;
    if (existing) {
      existing.quantity += qty;
      existing.revenue += revenue;
      existing.cashRevenue += cashRevenue;
      existing.onlineRevenue += onlineRevenue;
    } else {
      map.set(cat.id, {
        categoryId: cat.id,
        nameEs: cat.nameEs,
        nameEn: cat.nameEn,
        nameDe: cat.nameDe,
        quantity: qty,
        revenue,
        cashRevenue,
        onlineRevenue,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

export async function getDiscountUsage(range: DateRange) {
  await requireSuperadmin();

  const orders = await prisma.order.findMany({
    where: {
      ...paidOrdersWhere(range),
      discountTotal: { gt: 0 },
    },
    include: {
      discounts: {
        select: { id: true, nameEs: true, nameEn: true, type: true, value: true },
      },
    },
  });

  const map = new Map<
    string,
    {
      discountId: string;
      nameEs: string;
      nameEn: string;
      type: string;
      value: number;
      uses: number;
      totalSaved: number;
    }
  >();

  for (const order of orders) {
    const saved = toNumber(order.discountTotal);
    if (order.discounts.length === 0) {
      const key = "manual";
      const existing = map.get(key);
      if (existing) {
        existing.uses += 1;
        existing.totalSaved += saved;
      } else {
        map.set(key, {
          discountId: key,
          nameEs: "Descuento manual",
          nameEn: "Manual discount",
          type: "MANUAL",
          value: 0,
          uses: 1,
          totalSaved: saved,
        });
      }
      continue;
    }

    for (const discount of order.discounts) {
      const existing = map.get(discount.id);
      const value = toNumber(discount.value);
      if (existing) {
        existing.uses += 1;
        existing.totalSaved += saved / order.discounts.length;
      } else {
        map.set(discount.id, {
          discountId: discount.id,
          nameEs: discount.nameEs,
          nameEn: discount.nameEn,
          type: discount.type,
          value,
          uses: 1,
          totalSaved: saved / order.discounts.length,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.uses - a.uses);
}

export async function getTableTurnover(range: DateRange) {
  await requireSuperadmin();

  const orders = await prisma.order.findMany({
    where: {
      ...paidOrdersWhere(range),
      type: "DINE_IN",
      tableId: { not: null },
    },
    select: {
      total: true,
      paymentMethod: true,
      createdAt: true,
      paidAt: true,
      table: { select: { id: true, number: true } },
    },
  });

  const map = new Map<
    string,
    {
      tableId: string;
      tableNumber: string;
      turns: number;
      totalRevenue: number;
      cashRevenue: number;
      onlineRevenue: number;
      totalDurationMinutes: number;
    }
  >();

  for (const order of orders) {
    if (!order.table) continue;
    const duration = order.paidAt
      ? differenceInMinutes(order.paidAt, order.createdAt)
      : 0;
    const existing = map.get(order.table.id);
    const revenue = toNumber(order.total);
    const cashRevenue = order.paymentMethod === "CASH" ? revenue : 0;
    const onlineRevenue = order.paymentMethod === "CARD" ? revenue : 0;
    if (existing) {
      existing.turns += 1;
      existing.totalRevenue += revenue;
      existing.cashRevenue += cashRevenue;
      existing.onlineRevenue += onlineRevenue;
      existing.totalDurationMinutes += duration;
    } else {
      map.set(order.table.id, {
        tableId: order.table.id,
        tableNumber: order.table.number,
        turns: 1,
        totalRevenue: revenue,
        cashRevenue,
        onlineRevenue,
        totalDurationMinutes: duration,
      });
    }
  }

  return Array.from(map.values())
    .map((t) => ({
      ...t,
      avgDurationMinutes:
        t.turns > 0 ? Math.round(t.totalDurationMinutes / t.turns) : 0,
    }))
    .sort((a, b) => b.turns - a.turns);
}

export async function getRefundsLog(range: DateRange) {
  await requireSuperadmin();

  const refunds = await prisma.refund.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
    },
    include: {
      order: {
        select: { receiptNumber: true, total: true, paymentMethod: true },
      },
      issuedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return refunds.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    receiptNumber: r.order.receiptNumber,
    amount: toNumber(r.amount),
    paymentMethod: r.order.paymentMethod,
    reason: r.reason,
    issuedByName: r.issuedBy.name,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getAllReportsData(range: DateRange) {
  await requireSuperadmin();

  const [
    salesOverview,
    bestSellers,
    peakHours,
    paymentMethods,
    categoryPerformance,
    discountUsage,
    tableTurnover,
    refundsLog,
  ] = await Promise.all([
    getSalesOverview(range),
    getBestSellers(range),
    getPeakHours(range),
    getPaymentMethods(range),
    getCategoryPerformance(range),
    getDiscountUsage(range),
    getTableTurnover(range),
    getRefundsLog(range),
  ]);

  return {
    salesOverview,
    bestSellers,
    peakHours,
    paymentMethods,
    categoryPerformance,
    discountUsage,
    tableTurnover,
    refundsLog,
  };
}

export async function getDashboardKpis() {
  await requireSuperadmin();

  const today = getDateRangeFromPreset("today");

  const [paymentBreakdown, todayOrderCount, openTableGroups, clockedInCount] =
    await Promise.all([
      getPaymentBreakdownForRange(today),
      prisma.order.count({ where: paidOrdersWhere(today) }),
      prisma.order.groupBy({
        by: ["tableId"],
        where: { status: "OPEN", tableId: { not: null } },
      }),
      prisma.timeEntry.count({ where: { clockOut: null } }),
    ]);

  const todaySales =
    paymentBreakdown.cash.revenue + paymentBreakdown.online.revenue;

  return {
    todaySales,
    todaySalesCash: paymentBreakdown.cash.revenue,
    todaySalesOnline: paymentBreakdown.online.revenue,
    todayOrdersCash: paymentBreakdown.cash.orders,
    todayOrdersOnline: paymentBreakdown.online.orders,
    todayOrders: todayOrderCount,
    activeTables: openTableGroups.length,
    clockedIn: clockedInCount,
  };
}

export async function getOpenOrders() {
  await requireSuperadmin();

  const orders = await prisma.order.findMany({
    where: { status: "OPEN" },
    include: {
      table: { select: { number: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((o) => ({
    id: o.id,
    tableNumber: o.table?.number ?? null,
    type: o.type,
    total: toNumber(o.total),
    createdAt: o.createdAt.toISOString(),
    createdByName: o.createdBy.name,
    elapsedMinutes: differenceInMinutes(new Date(), o.createdAt),
  }));
}

export async function getHourlySalesToday() {
  await requireSuperadmin();
  return getPeakHours(getDateRangeFromPreset("today"));
}
