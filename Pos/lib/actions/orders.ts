"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { formatDecimal, formatReceiptNumberByType } from "@/lib/calculations";
import { buildSplitBreakdownForDisplay } from "@/lib/split-bill";
import {
  buildSplitPaymentSlots,
  parseSplitPayments,
  type SplitPaymentRecord,
} from "@/lib/split-payments";
import { decrementCashRegisterBalance } from "@/lib/actions/cash-register";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, OrderType, PaymentMethod, Prisma } from "@prisma/client";

export interface OrderListFilters {
  dateFrom?: string;
  dateTo?: string;
  tableId?: string;
  employeeId?: string;
  paymentMethod?: PaymentMethod;
}

export type OrderActionError = "FORBIDDEN" | "NOT_FOUND" | "INVALID_STATUS" | "INVALID_AMOUNT" | "REASON_REQUIRED";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: OrderActionError; message?: string };

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

async function requireSuperadminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return null;
  }
  return session;
}

function buildOrderWhere(filters: OrderListFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    // Admin history: completed sales only (exclude open tickets and POS cancellations).
    status: "PAID",
  };

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    }
  }

  if (filters.tableId) {
    where.tableId = filters.tableId;
  }

  if (filters.employeeId) {
    where.createdById = filters.employeeId;
  }

  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  return where;
}

function parseSplitAllocations(value: unknown) {
  if (!Array.isArray(value)) return null;
  const parsed: Array<{ splitIndex: number; quantity: number }> = [];
  for (const entry of value) {
    if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as { splitIndex?: unknown }).splitIndex === "number" &&
      typeof (entry as { quantity?: unknown }).quantity === "number"
    ) {
      parsed.push({
        splitIndex: (entry as { splitIndex: number }).splitIndex,
        quantity: (entry as { quantity: number }).quantity,
      });
    }
  }
  return parsed.length > 0 ? parsed : null;
}

function serializeOrderSummary(order: {
  id: string;
  receiptNumber: string | null;
  cardReference: string | null;
  status: OrderStatus;
  type: string;
  subtotal: Prisma.Decimal;
  taxTotal: Prisma.Decimal;
  discountTotal: Prisma.Decimal;
  total: Prisma.Decimal;
  paymentMethod: PaymentMethod | null;
  createdAt: Date;
  paidAt: Date | null;
  isSplitBill: boolean;
  splitCount: number | null;
  splitPayments: unknown;
  table: { id: string; number: string } | null;
  createdBy: { id: string; name: string };
  paidBy: { id: string; name: string } | null;
  refunds: { amount: Prisma.Decimal }[];
}) {
  const refundedTotal = formatDecimal(
    order.refunds.reduce((sum, refund) => sum + decimalToNumber(refund.amount), 0),
  );

  const splitPayments = parseSplitPayments(order.splitPayments);
  const splitPaymentSlots =
    order.isSplitBill && order.splitCount
      ? buildSplitPaymentSlots({
          splitCount: order.splitCount,
          splitPayments,
          legacyCardReference: order.cardReference,
          legacyPaymentMethod: order.paymentMethod,
        })
      : [];

  return {
    id: order.id,
    receiptNumber: order.receiptNumber,
    cardReference: order.cardReference,
    status: order.status,
    type: order.type,
    subtotal: decimalToNumber(order.subtotal),
    taxTotal: decimalToNumber(order.taxTotal),
    discountTotal: decimalToNumber(order.discountTotal),
    total: decimalToNumber(order.total),
    refundedTotal,
    remainingRefundable: formatDecimal(Math.max(0, decimalToNumber(order.total) - refundedTotal)),
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    isSplitBill: order.isSplitBill,
    splitCount: order.splitCount,
    splitPayments,
    splitPaymentSlots,
    table: order.table,
    createdBy: order.createdBy,
    paidBy: order.paidBy,
  };
}

export async function listOrders(filters: OrderListFilters = {}): Promise<
  ActionResult<{ orders: ReturnType<typeof serializeOrderSummary>[] }>
> {
  const session = await requireSuperadminSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const orders = await prisma.order.findMany({
    where: buildOrderWhere(filters),
    include: {
      table: { select: { id: true, number: true } },
      createdBy: { select: { id: true, name: true } },
      paidBy: { select: { id: true, name: true } },
      refunds: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return {
    success: true,
    data: { orders: orders.map(serializeOrderSummary) },
  };
}

export async function getOrderDetail(orderId: string) {
  const session = await requireSuperadminSession();
  if (!session) {
    return { success: false as const, error: "FORBIDDEN" as const };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: { select: { id: true, number: true } },
      createdBy: { select: { id: true, name: true } },
      paidBy: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, nameEs: true, nameEn: true, nameDe: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      discounts: {
        select: {
          id: true,
          nameEs: true,
          nameEn: true,
          type: true,
          value: true,
        },
      },
      refunds: {
        include: {
          issuedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const refundedTotal = formatDecimal(
    order.refunds.reduce((sum, refund) => sum + decimalToNumber(refund.amount), 0),
  );

  const splitPayments = parseSplitPayments(order.splitPayments);
  const splitPaymentSlots =
    order.isSplitBill && order.splitCount
      ? buildSplitPaymentSlots({
          splitCount: order.splitCount,
          splitPayments,
          legacyCardReference: order.cardReference,
          legacyPaymentMethod: order.paymentMethod,
        })
      : [];

  return {
    success: true as const,
    data: {
      id: order.id,
      receiptNumber: order.receiptNumber,
      status: order.status,
      type: order.type,
      subtotal: decimalToNumber(order.subtotal),
      taxTotal: decimalToNumber(order.taxTotal),
      discountTotal: decimalToNumber(order.discountTotal),
      total: decimalToNumber(order.total),
      refundedTotal,
      remainingRefundable: formatDecimal(Math.max(0, decimalToNumber(order.total) - refundedTotal)),
      paymentMethod: order.paymentMethod,
      isSplitBill: order.isSplitBill,
      splitCount: order.splitCount,
      paidSplitIndices: order.paidSplitIndices ?? [],
      splitPayments,
      splitPaymentSlots,
      cardReference: order.cardReference,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
      table: order.table,
      createdBy: order.createdBy,
      paidBy: order.paidBy,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
        nameEs: item.customName ?? item.product.nameEs,
        nameEn: item.customName ?? item.product.nameEn,
        nameDe: item.customName ?? item.product.nameDe,
        customName: item.customName,
        customReason: item.customReason,
        isCustom: Boolean(item.customName),
        quantity: item.quantity,
        unitPrice: decimalToNumber(item.unitPrice),
        taxRate: decimalToNumber(item.taxRate),
        subtotal: decimalToNumber(item.subtotal),
        taxAmount: decimalToNumber(item.taxAmount),
        total: decimalToNumber(item.total),
        splitIndex: item.splitIndex,
        splitAllocations: parseSplitAllocations(item.splitAllocations),
        isVoided: item.isVoided,
        voidedAt: item.voidedAt?.toISOString() ?? null,
        voidReason: item.voidReason,
      })),
      splitBreakdown:
        order.isSplitBill && order.splitCount
          ? buildSplitBreakdownForDisplay(
              order.items
                .filter((item) => !item.isVoided)
                .map((item) => ({
                  nameEs: item.customName ?? item.product.nameEs,
                  nameEn: item.customName ?? item.product.nameEn,
                  nameDe: item.customName ?? item.product.nameDe,
                  quantity: item.quantity,
                  unitPrice: decimalToNumber(item.unitPrice),
                  taxRate: decimalToNumber(item.taxRate),
                  subtotal: decimalToNumber(item.subtotal),
                  taxAmount: decimalToNumber(item.taxAmount),
                  total: decimalToNumber(item.total),
                  splitIndex: item.splitIndex,
                  splitAllocations: parseSplitAllocations(item.splitAllocations),
                })),
              order.splitCount,
              decimalToNumber(order.discountTotal),
            )
          : [],
      discounts: order.discounts.map((discount) => ({
        id: discount.id,
        nameEs: discount.nameEs,
        nameEn: discount.nameEn,
        type: discount.type,
        value: decimalToNumber(discount.value),
      })),
      refunds: order.refunds.map((refund) => ({
        id: refund.id,
        amount: decimalToNumber(refund.amount),
        reason: refund.reason,
        createdAt: refund.createdAt.toISOString(),
        issuedBy: refund.issuedBy,
      })),
    },
  };
}

export type OrderDetail = NonNullable<
  Extract<Awaited<ReturnType<typeof getOrderDetail>>, { success: true }>["data"]
>;

export type OrderSummary = Extract<
  Awaited<ReturnType<typeof listOrders>>,
  { success: true }
>["data"]["orders"][number];

export interface IssueRefundInput {
  amount?: number;
  reason: string;
  full?: boolean;
}

async function renumberPaidReceiptsByType(
  tx: Prisma.TransactionClient,
) {
  const types: OrderType[] = ["DINE_IN", "TAKEAWAY", "ONLINE"];

  for (const type of types) {
    const orders = await tx.order.findMany({
      where: { type, status: "PAID" },
      orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    for (let index = 0; index < orders.length; index += 1) {
      await tx.order.update({
        where: { id: orders[index].id },
        data: {
          receiptNumber: formatReceiptNumberByType(type, index + 1),
        },
      });
    }
  }
}

export async function bulkDeleteOrders(
  ids: string[],
): Promise<
  | { success: true; deleted: number }
  | { success: false; error: OrderActionError; message?: string }
> {
  const session = await requireSuperadminSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  if (ids.length === 0) {
    return {
      success: false,
      error: "INVALID_AMOUNT",
      message: "No orders selected",
    };
  }

  const openCount = await prisma.order.count({
    where: { id: { in: ids }, status: "OPEN" },
  });

  if (openCount > 0) {
    return {
      success: false,
      error: "INVALID_STATUS",
      message: "Open orders cannot be deleted. Cancel them on the POS first.",
    };
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.refund.deleteMany({ where: { orderId: { in: ids } } });

    for (const orderId of ids) {
      await tx.order.update({
        where: { id: orderId },
        data: { discounts: { set: [] } },
      });
    }

    const result = await tx.order.deleteMany({
      where: { id: { in: ids } },
    });

    await renumberPaidReceiptsByType(tx);

    return result.count;
  });

  revalidatePath("/admin/orders");

  return { success: true, deleted };
}

export async function updateOrderCardReference(
  orderId: string,
  cardReference: string | null,
  splitIndex?: number,
): Promise<
  | {
      success: true;
      data: {
        cardReference: string | null;
        splitPayments?: SplitPaymentRecord[];
        splitPaymentSlots?: ReturnType<typeof buildSplitPaymentSlots>;
      };
    }
  | { success: false; error: OrderActionError }
> {
  const session = await requireSuperadminSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isSplitBill: true,
      splitCount: true,
      cardReference: true,
      paymentMethod: true,
      splitPayments: true,
    },
  });

  if (!order) {
    return { success: false, error: "NOT_FOUND" };
  }

  const normalized = cardReference?.trim() || null;

  if (order.isSplitBill && splitIndex != null) {
    const splitCount = order.splitCount ?? 0;
    if (splitIndex < 0 || splitIndex >= splitCount) {
      return { success: false, error: "INVALID_AMOUNT" };
    }

    const existingSplitPayments = parseSplitPayments(order.splitPayments);
    const current = existingSplitPayments.find(
      (entry) => entry.splitIndex === splitIndex,
    );

    const updatedSplitPayments = current
      ? existingSplitPayments.map((entry) =>
          entry.splitIndex === splitIndex
            ? { ...entry, cardReference: normalized }
            : entry,
        )
      : [
          ...existingSplitPayments,
          {
            splitIndex,
            paymentMethod: "CARD" as const,
            cardReference: normalized,
            total: 0,
          },
        ];

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { splitPayments: updatedSplitPayments },
      select: {
        cardReference: true,
        paymentMethod: true,
        splitCount: true,
        splitPayments: true,
      },
    });

    const splitPayments = parseSplitPayments(updated.splitPayments);
    const splitPaymentSlots =
      updated.splitCount != null
        ? buildSplitPaymentSlots({
            splitCount: updated.splitCount,
            splitPayments,
            legacyCardReference: updated.cardReference,
            legacyPaymentMethod: updated.paymentMethod,
          })
        : [];

    revalidatePath("/admin/orders");

    return {
      success: true,
      data: {
        cardReference: updated.cardReference,
        splitPayments,
        splitPaymentSlots,
      },
    };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { cardReference: normalized },
    select: { cardReference: true },
  });

  revalidatePath("/admin/orders");

  return {
    success: true,
    data: { cardReference: updated.cardReference },
  };
}

export async function issueRefund(orderId: string, input: IssueRefundInput) {
  const session = await requireSuperadminSession();
  if (!session) {
    return { success: false as const, error: "FORBIDDEN" as const };
  }

  const reason = input.reason?.trim();
  if (!reason) {
    return { success: false as const, error: "REASON_REQUIRED" as const };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      total: true,
      paymentMethod: true,
      refunds: { select: { amount: true } },
    },
  });

  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  if (order.status !== "PAID") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const refundedSoFar = formatDecimal(
    order.refunds.reduce((sum, refund) => sum + decimalToNumber(refund.amount), 0),
  );
  const remaining = formatDecimal(Math.max(0, decimalToNumber(order.total) - refundedSoFar));

  if (remaining <= 0) {
    return { success: false as const, error: "INVALID_AMOUNT" as const };
  }

  let amount: number;
  if (input.full) {
    amount = remaining;
  } else if (input.amount != null) {
    amount = formatDecimal(input.amount);
  } else {
    return { success: false as const, error: "INVALID_AMOUNT" as const };
  }

  if (amount <= 0 || amount > remaining) {
    return { success: false as const, error: "INVALID_AMOUNT" as const };
  }

  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.refund.create({
      data: {
        orderId,
        amount,
        reason,
        issuedById: session.user.id,
      },
      include: {
        issuedBy: { select: { id: true, name: true } },
      },
    });

    if (order.paymentMethod === "CASH") {
      await decrementCashRegisterBalance(amount, tx);
    }

    return created;
  });

  return {
    success: true as const,
    data: {
      id: refund.id,
      amount: decimalToNumber(refund.amount),
      reason: refund.reason,
      createdAt: refund.createdAt.toISOString(),
      issuedBy: refund.issuedBy,
      remainingRefundable: formatDecimal(remaining - amount),
    },
  };
}
