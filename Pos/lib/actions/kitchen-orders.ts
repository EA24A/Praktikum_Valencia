"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

export type KitchenOrderItem = {
  id: string;
  quantity: number;
  nameEs: string;
  nameEn: string;
  nameDe: string;
};

export type KitchenOrder = {
  id: string;
  type: "DINE_IN" | "TAKEAWAY" | "ONLINE";
  status: "OPEN" | "PAID";
  tableNumber: string | null;
  createdAt: string;
  kitchenCompletedAt: string | null;
  items: KitchenOrderItem[];
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export type KitchenOrdersSummary = {
  pending: KitchenOrder[];
  completed: KitchenOrder[];
};

function serializeKitchenOrder(
  order: {
    id: string;
    type: "DINE_IN" | "TAKEAWAY" | "ONLINE";
    status: "OPEN" | "PAID" | "CANCELLED";
    kitchenCompletedAt: Date | null;
    createdAt: Date;
    table: { number: string } | null;
    items: Array<{
      id: string;
      quantity: number;
      customName: string | null;
      product: { nameEs: string; nameEn: string; nameDe: string };
    }>;
  },
): KitchenOrder {
  return {
    id: order.id,
    type: order.type,
    status: order.status === "PAID" ? "PAID" : "OPEN",
    tableNumber: order.table?.number ?? null,
    createdAt: order.createdAt.toISOString(),
    kitchenCompletedAt: order.kitchenCompletedAt?.toISOString() ?? null,
    items: order.items.map((item) => {
      const displayName = item.customName?.trim() || null;
      return {
        id: item.id,
        quantity: item.quantity,
        nameEs: displayName ?? item.product.nameEs,
        nameEn: displayName ?? item.product.nameEn,
        nameDe: displayName ?? item.product.nameDe,
      };
    }),
  };
}

export async function getKitchenOrders(): Promise<
  { success: true; data: KitchenOrdersSummary } | { success: false; error: "FORBIDDEN" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const todayStart = startOfToday();

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["OPEN", "PAID"] },
      items: { some: { isVoided: false } },
      OR: [
        { kitchenCompletedAt: null },
        { kitchenCompletedAt: { gte: todayStart } },
      ],
    },
    include: {
      table: { select: { number: true } },
      items: {
        where: { isVoided: false },
        include: {
          product: { select: { nameEs: true, nameEn: true, nameDe: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = orders.map(serializeKitchenOrder);
  const pending = serialized
    .filter((order) => !order.kitchenCompletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const completed = serialized
    .filter((order) => order.kitchenCompletedAt)
    .sort((a, b) => (b.kitchenCompletedAt ?? "").localeCompare(a.kitchenCompletedAt ?? ""));

  return {
    success: true,
    data: { pending, completed },
  };
}

export async function setKitchenOrderCompleted(
  orderId: string,
  completed: boolean,
): Promise<
  | { success: true; data: KitchenOrder }
  | { success: false; error: "FORBIDDEN" | "NOT_FOUND" | "INVALID_STATUS" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: { select: { number: true } },
      items: {
        where: { isVoided: false },
        include: {
          product: { select: { nameEs: true, nameEn: true, nameDe: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return { success: false, error: "NOT_FOUND" };
  }
  if (
    (order.status !== "OPEN" && order.status !== "PAID") ||
    order.items.length === 0
  ) {
    return { success: false, error: "INVALID_STATUS" };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { kitchenCompletedAt: completed ? new Date() : null },
    include: {
      table: { select: { number: true } },
      items: {
        where: { isVoided: false },
        include: {
          product: { select: { nameEs: true, nameEn: true, nameDe: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return { success: true, data: serializeKitchenOrder(updated) };
}

export async function markAllKitchenOrdersCompleted(): Promise<
  { success: true; data: { count: number } } | { success: false; error: "FORBIDDEN" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const result = await prisma.order.updateMany({
    where: {
      status: { in: ["OPEN", "PAID"] },
      kitchenCompletedAt: null,
      items: { some: { isVoided: false } },
    },
    data: { kitchenCompletedAt: new Date() },
  });

  return { success: true, data: { count: result.count } };
}
