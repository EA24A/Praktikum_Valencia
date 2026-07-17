"use server";

import { auth } from "@/auth";
import { formatDecimal } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const SETTINGS_ID = "default";
const DEFAULT_CLOSING_FLOAT = 50;

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

async function requireEmployeeSession() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "EMPLOYEE" && session.user.role !== "SUPERADMIN") {
    return null;
  }
  return session;
}

export type CashRegisterPayment = {
  id: string;
  receiptNumber: string | null;
  total: number;
  amountTendered: number | null;
  changeGiven: number | null;
  paidAt: string;
  type: "DINE_IN" | "TAKEAWAY" | "ONLINE";
  tableNumber: string | null;
  paidByName: string | null;
};

export type CashRegisterSummary = {
  balance: number;
  openingFloat: number;
  todayCashInRegister: number;
  defaultClosingFloat: number;
  todayCashSales: number;
  todayCashOrderCount: number;
  recentPayments: CashRegisterPayment[];
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getCashRegisterSummary(): Promise<
  { success: true; data: CashRegisterSummary } | { success: false; error: "FORBIDDEN" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const todayStart = startOfToday();

  const [settings, todayCashOrders, recentPayments] = await Promise.all([
    prisma.settings.findUniqueOrThrow({ where: { id: SETTINGS_ID } }),
    prisma.order.findMany({
      where: {
        status: "PAID",
        paymentMethod: "CASH",
        paidAt: { gte: todayStart },
      },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: {
        status: "PAID",
        paymentMethod: "CASH",
      },
      orderBy: { paidAt: "desc" },
      take: 25,
      select: {
        id: true,
        receiptNumber: true,
        total: true,
        amountTendered: true,
        changeGiven: true,
        paidAt: true,
        type: true,
        table: { select: { number: true } },
        paidBy: { select: { name: true } },
      },
    }),
  ]);

  const todayCashSales = formatDecimal(
    todayCashOrders.reduce((sum, order) => sum + decimalToNumber(order.total), 0),
  );

  const balance = decimalToNumber(settings.cashRegisterBalance);
  const openingFloat = decimalToNumber(settings.registerOpeningFloat);
  const todayCashInRegister = formatDecimal(Math.max(0, balance - openingFloat));

  return {
    success: true,
    data: {
      balance,
      openingFloat,
      todayCashInRegister,
      defaultClosingFloat: DEFAULT_CLOSING_FLOAT,
      todayCashSales,
      todayCashOrderCount: todayCashOrders.length,
      recentPayments: recentPayments.map((order) => ({
        id: order.id,
        receiptNumber: order.receiptNumber,
        total: decimalToNumber(order.total),
        amountTendered:
          order.amountTendered != null ? decimalToNumber(order.amountTendered) : null,
        changeGiven:
          order.changeGiven != null ? decimalToNumber(order.changeGiven) : null,
        paidAt: order.paidAt!.toISOString(),
        type: order.type,
        tableNumber: order.table?.number ?? null,
        paidByName: order.paidBy?.name ?? null,
      })),
    },
  };
}

export async function closeRegisterForDay(
  floatToLeave: number,
  countedBalance?: number,
): Promise<
  | {
      success: true;
      data: {
        systemBalance: number;
        countedBalance: number;
        adjustment: number;
        floatLeft: number;
        amountRemoved: number;
        balance: number;
        openingFloat: number;
      };
    }
  | { success: false; error: "FORBIDDEN" | "INVALID_INPUT" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  if (floatToLeave < 0 || Number.isNaN(floatToLeave)) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const settings = await prisma.settings.findUniqueOrThrow({
    where: { id: SETTINGS_ID },
  });

  const systemBalance = decimalToNumber(settings.cashRegisterBalance);
  const effectiveBalance =
    countedBalance != null && !Number.isNaN(countedBalance)
      ? formatDecimal(countedBalance)
      : systemBalance;

  if (effectiveBalance < 0) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const floatLeft = formatDecimal(floatToLeave);

  if (floatLeft > effectiveBalance) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const amountRemoved = formatDecimal(effectiveBalance - floatLeft);
  const adjustment = formatDecimal(effectiveBalance - systemBalance);

  await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: {
      cashRegisterBalance: floatLeft,
      registerOpeningFloat: floatLeft,
    },
  });

  return {
    success: true,
    data: {
      systemBalance,
      countedBalance: effectiveBalance,
      adjustment,
      floatLeft,
      amountRemoved,
      balance: floatLeft,
      openingFloat: floatLeft,
    },
  };
}

export async function incrementCashRegisterBalance(amount: number, tx: Prisma.TransactionClient) {
  if (amount <= 0) return;
  await tx.settings.update({
    where: { id: SETTINGS_ID },
    data: {
      cashRegisterBalance: { increment: formatDecimal(amount) },
    },
  });
}

export async function decrementCashRegisterBalance(amount: number, tx: Prisma.TransactionClient) {
  if (amount <= 0) return;
  await tx.settings.update({
    where: { id: SETTINGS_ID },
    data: {
      cashRegisterBalance: { decrement: formatDecimal(amount) },
    },
  });
}

