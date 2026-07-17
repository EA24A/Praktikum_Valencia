"use server";

import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  calculateLineItemTax,
  calculateOrderTotals,
  formatDecimal,
  generateReceiptNumber,
} from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { getOrCreateCustomProductPlaceholder } from "@/lib/products/custom-product-placeholder";
import { incrementCashRegisterBalance } from "@/lib/actions/cash-register";
import { suggestNextCardReference, isValidCardReference } from "@/lib/card-reference";
import { applyAutoCombosToOrder } from "@/lib/combos/apply-auto-combos";
import { calculateSplitTotal, quantityForSplit } from "@/lib/split-bill";
import type { SplitAllocation, SplitItemAssignment } from "@/lib/split-bill";
import { parseSplitPayments, type SplitPaymentRecord } from "@/lib/split-payments";
import type { ComboComponentProduct } from "@/lib/receipt/combo-receipt-lines";
import { Prisma } from "@prisma/client";
import type {
  DiscountType,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@prisma/client";

export type PosOrderError =
  | "FORBIDDEN"
  | "NOT_CLOCKED_IN"
  | "NOT_FOUND"
  | "INVALID_STATUS"
  | "INVALID_INPUT"
  | "CASH_REQUIRED"
  | "INSUFFICIENT_TENDER"
  | "REASON_REQUIRED"
  | "PRODUCT_NOT_FOUND"
  | "SPLIT_INDEX_REQUIRED"
  | "SPLIT_ALREADY_PAID"
  | "SPLIT_NO_ITEMS"
  | "SPLIT_PAYMENTS_IN_PROGRESS"
  | "TABLE_OCCUPIED";

export type PosActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: PosOrderError; message?: string };

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

type PosSessionResult =
  | { ok: true; session: Session }
  | { ok: false; error: "FORBIDDEN" | "NOT_CLOCKED_IN" };

async function requirePosSession(): Promise<PosSessionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "FORBIDDEN" };
  }
  if (session.user.role !== "EMPLOYEE" && session.user.role !== "SUPERADMIN") {
    return { ok: false, error: "FORBIDDEN" };
  }

  return { ok: true, session };
}

function posAuthFailure(error: "FORBIDDEN" | "NOT_CLOCKED_IN") {
  return {
    success: false as const,
    error: (error === "NOT_CLOCKED_IN" ? "NOT_CLOCKED_IN" : "FORBIDDEN") as PosOrderError,
  };
}

async function getOpenOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { where: { isVoided: false } },
      discounts: true,
      table: { select: { id: true, number: true } },
    },
  });
}

function calculateDiscountAmount(
  discount: {
    type: DiscountType;
    value: Prisma.Decimal | number;
    comboProducts: string[];
  },
  items: Array<{ productId: string; total: number; isVoided: boolean }>,
  grossTotal: number,
): number {
  const activeItems = items.filter((item) => !item.isVoided);
  const value = decimalToNumber(discount.value);

  if (discount.type === "PERCENTAGE") {
    return formatDecimal(grossTotal * (value / 100));
  }

  if (discount.type === "FIXED_AMOUNT") {
    return formatDecimal(Math.min(value, grossTotal));
  }

  if (discount.type === "COMBO") {
    const productIds = activeItems.map((item) => item.productId);
    const hasAll = discount.comboProducts.every((id) => productIds.includes(id));
    if (!hasAll) return 0;

    const comboItemTotal = activeItems
      .filter((item) => discount.comboProducts.includes(item.productId))
      .reduce((sum, item) => sum + item.total, 0);
    return formatDecimal(Math.max(0, comboItemTotal - value));
  }

  return 0;
}

async function recalculateAndUpdateOrder(
  orderId: string,
  options?: { preserveKitchenStatus?: boolean },
) {
  await applyAutoCombosToOrder(orderId);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      discounts: true,
    },
  });

  if (!order) return null;

  const lineByItemId = new Map<
    string,
    { subtotal: number; taxAmount: number; total: number }
  >();

  for (const item of order.items) {
    if (item.isVoided) continue;

    const lineTax = calculateLineItemTax({
      unitPrice: decimalToNumber(item.unitPrice),
      quantity: item.quantity,
      taxRate: decimalToNumber(item.taxRate),
    });
    lineByItemId.set(item.id, lineTax);

    const storedSubtotal = decimalToNumber(item.subtotal);
    const storedTaxAmount = decimalToNumber(item.taxAmount);
    const storedTotal = decimalToNumber(item.total);

    if (
      storedSubtotal !== lineTax.subtotal ||
      storedTaxAmount !== lineTax.taxAmount ||
      storedTotal !== lineTax.total
    ) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          subtotal: lineTax.subtotal,
          taxAmount: lineTax.taxAmount,
          total: lineTax.total,
        },
      });
    }
  }

  const activeItems = order.items.filter((item) => !item.isVoided);
  const itemTotals = activeItems.map((item) => {
    const line = lineByItemId.get(item.id)!;
    return {
      subtotal: line.subtotal,
      taxAmount: line.taxAmount,
      total: line.total,
      isVoided: item.isVoided,
    };
  });

  let discountTotal = 0;
  if (order.discounts.length > 0) {
    const grossTotal = formatDecimal(
      activeItems.reduce((sum, item) => sum + decimalToNumber(item.total), 0),
    );
    for (const discount of order.discounts) {
      discountTotal += calculateDiscountAmount(
        discount,
        order.items.map((item) => ({
          productId: item.productId,
          total: decimalToNumber(item.total),
          isVoided: item.isVoided,
        })),
        grossTotal,
      );
    }
    discountTotal = formatDecimal(Math.min(discountTotal, grossTotal));
  }

  const totals = calculateOrderTotals(itemTotals, discountTotal);

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      ...(options?.preserveKitchenStatus ? {} : { kitchenCompletedAt: null }),
    },
  });
}

function parseSplitAllocations(value: unknown): SplitAllocation[] | null {
  if (!Array.isArray(value)) return null;
  const parsed: SplitAllocation[] = [];
  for (const entry of value) {
    if (
      entry &&
      typeof entry === "object" &&
      Number.isInteger((entry as SplitAllocation).splitIndex) &&
      Number.isInteger((entry as SplitAllocation).quantity) &&
      (entry as SplitAllocation).quantity > 0
    ) {
      parsed.push({
        splitIndex: (entry as SplitAllocation).splitIndex,
        quantity: (entry as SplitAllocation).quantity,
      });
    }
  }
  return parsed.length > 0 ? parsed : null;
}

function primarySplitIndex(allocations: SplitAllocation[]): number | null {
  const active = allocations.filter((entry) => entry.quantity > 0);
  if (active.length === 0) return null;
  if (active.length === 1) return active[0]!.splitIndex;
  return null;
}

function serializePosOrderItem(
  item: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    taxRate: Prisma.Decimal;
    subtotal: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    total: Prisma.Decimal;
    splitIndex: number | null;
    splitAllocations: unknown;
    isVoided: boolean;
    voidedAt: Date | null;
    voidReason: string | null;
    customName: string | null;
    customReason: string | null;
    comboSourceProductIds: string[];
    product: { id: string; nameEs: string; nameEn: string; nameDe: string };
  },
  componentById: Map<string, ComboComponentProduct>,
) {
  const unitPrice = decimalToNumber(item.unitPrice);
  const taxRate = decimalToNumber(item.taxRate);
  const line = calculateLineItemTax({
    unitPrice,
    quantity: item.quantity,
    taxRate,
  });
  const displayName = item.customName?.trim() || null;
  const comboSourceProductIds = item.comboSourceProductIds ?? [];
  const countsPerProduct = new Map<string, number>();
  for (const productId of comboSourceProductIds) {
    countsPerProduct.set(productId, (countsPerProduct.get(productId) ?? 0) + 1);
  }

  const comboComponents: ComboComponentProduct[] = [];
  for (const [productId, totalCount] of countsPerProduct) {
    const component = componentById.get(productId);
    if (!component) continue;
    comboComponents.push({
      ...component,
      countPerSet: item.quantity > 0 ? totalCount / item.quantity : totalCount,
    });
  }

  return {
    id: item.id,
    productId: item.productId,
    product: item.product,
    nameEs: displayName ?? item.product.nameEs,
    nameEn: displayName ?? item.product.nameEn,
    nameDe: displayName ?? item.product.nameDe,
    customName: item.customName,
    customReason: item.customReason,
    isCustom: Boolean(displayName),
    quantity: item.quantity,
    unitPrice,
    taxRate,
    subtotal: line.subtotal,
    taxAmount: line.taxAmount,
    total: line.total,
    splitIndex: item.splitIndex,
    splitAllocations: parseSplitAllocations(item.splitAllocations),
    isVoided: item.isVoided,
    voidedAt: item.voidedAt?.toISOString() ?? null,
    voidReason: item.voidReason,
    comboSourceProductIds,
    comboComponents,
  };
}

export async function serializePosOrderDetail(orderId: string) {
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
          requiresCashPayment: true,
        },
      },
    },
  });

  if (!order) return null;

  const comboSourceIds = [
    ...new Set(
      order.items.flatMap((item) => item.comboSourceProductIds ?? []).filter(Boolean),
    ),
  ];
  const comboSourceProducts =
    comboSourceIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: comboSourceIds } },
          select: {
            id: true,
            nameEs: true,
            nameEn: true,
            nameDe: true,
            taxRate: true,
          },
        })
      : [];
  const componentById = new Map<string, ComboComponentProduct>(
    comboSourceProducts.map((product) => [
      product.id,
      {
        productId: product.id,
        nameEs: product.nameEs,
        nameEn: product.nameEn,
        nameDe: product.nameDe,
        taxRate: decimalToNumber(product.taxRate),
        countPerSet: 1,
      },
    ]),
  );

  const items = order.items.map((item) => serializePosOrderItem(item, componentById));
  const discountTotal = decimalToNumber(order.discountTotal);
  const orderTotals =
    order.status === "OPEN"
      ? calculateOrderTotals(items, discountTotal)
      : {
          subtotal: decimalToNumber(order.subtotal),
          taxTotal: decimalToNumber(order.taxTotal),
          discountTotal,
          total: decimalToNumber(order.total),
        };

  return {
    id: order.id,
    receiptNumber: order.receiptNumber,
    status: order.status,
    type: order.type,
    subtotal: orderTotals.subtotal,
    taxTotal: orderTotals.taxTotal,
    discountTotal: orderTotals.discountTotal,
    total: orderTotals.total,
    paymentMethod: order.paymentMethod,
    amountTendered:
      order.amountTendered != null ? decimalToNumber(order.amountTendered) : null,
    changeGiven: order.changeGiven != null ? decimalToNumber(order.changeGiven) : null,
    isSplitBill: order.isSplitBill,
    splitCount: order.splitCount,
    paidSplitIndices: order.paidSplitIndices ?? [],
    cardReference: order.cardReference,
    tableId: order.tableId,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    table: order.table,
    createdBy: order.createdBy,
    paidBy: order.paidBy,
    items,
    discounts: order.discounts.map((d) => ({
      id: d.id,
      nameEs: d.nameEs,
      nameEn: d.nameEn,
      type: d.type,
      value: decimalToNumber(d.value),
      requiresCashPayment: d.requiresCashPayment,
    })),
  };
}

export type PosOrderDetail = NonNullable<Awaited<ReturnType<typeof serializePosOrderDetail>>>;

export async function createOrder(input: {
  type: OrderType;
  tableId?: string | null;
}) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  if (input.type === "DINE_IN") {
    if (!input.tableId) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }

    const table = await prisma.table.findFirst({
      where: { id: input.tableId, isActive: true },
    });
    if (!table) {
      return { success: false as const, error: "NOT_FOUND" as const };
    }

    const existingOpen = await prisma.order.findFirst({
      where: { tableId: input.tableId, status: "OPEN" },
    });
    if (existingOpen) {
      const detail = await serializePosOrderDetail(existingOpen.id);
      return { success: true as const, data: { order: detail!, created: false } };
    }
  }

  const order = await prisma.order.create({
    data: {
      type: input.type,
      tableId: input.type === "DINE_IN" ? input.tableId : null,
      status: "OPEN",
      subtotal: 0,
      taxTotal: 0,
      discountTotal: 0,
      total: 0,
      createdById: session.user.id,
    },
  });

  const detail = await serializePosOrderDetail(order.id);
  return { success: true as const, data: { order: detail!, created: true } };
}

export async function getOpenOrdersForPos() {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  const [tables, openOrders, settings] = await Promise.all([
    prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: "asc" },
    }),
    prisma.order.findMany({
      where: { status: "OPEN" },
      include: {
        table: { select: { id: true, number: true } },
        items: { where: { isVoided: false }, select: { id: true, total: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.settings.findUniqueOrThrow({ where: { id: "default" } }),
  ]);

  const orderByTable = new Map(
    openOrders.filter((o) => o.tableId).map((o) => [o.tableId!, o]),
  );

  const takeawayOrders = openOrders.filter((o) => o.type === "TAKEAWAY");
  const onlineOrders = openOrders.filter((o) => o.type === "ONLINE");

  return {
    success: true as const,
    data: {
      tables: tables.map((table) => {
        const openOrder = orderByTable.get(table.id);
        return {
          id: table.id,
          number: table.number,
          x: table.x,
          y: table.y,
          width: table.width,
          height: table.height,
          color: table.color,
          shape: table.shape,
          isActive: table.isActive,
          hasOpenOrder: !!openOrder,
          orderTotal: openOrder ? decimalToNumber(openOrder.total) : undefined,
          itemCount: openOrder?.items.length,
          openOrderId: openOrder?.id,
        };
      }),
      openOrders: openOrders.map((order) => ({
        id: order.id,
        type: order.type,
        tableId: order.tableId,
        table: order.table,
        total: decimalToNumber(order.total),
        itemCount: order.items.length,
        createdAt: order.createdAt.toISOString(),
      })),
      takeawayOrders: takeawayOrders.map((order) => ({
        id: order.id,
        total: decimalToNumber(order.total),
        itemCount: order.items.length,
        createdAt: order.createdAt.toISOString(),
      })),
      onlineOrders: onlineOrders.map((order) => ({
        id: order.id,
        total: decimalToNumber(order.total),
        itemCount: order.items.length,
        createdAt: order.createdAt.toISOString(),
      })),
      mapWidth: settings.mapWidth,
      mapHeight: settings.mapHeight,
      receiptEmailEnabled: settings.receiptEmailEnabled,
      registerCacheVersion: settings.registerCacheVersion,
      suggestedCardReference: suggestNextCardReference(settings.lastCardReference),
    },
  };
}

export async function updateLastCardReference(reference: string) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }

  const trimmed = reference.trim();
  if (!trimmed || !isValidCardReference(trimmed)) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  await prisma.settings.update({
    where: { id: "default" },
    data: { lastCardReference: trimmed },
  });

  return {
    success: true as const,
    data: {
      lastCardReference: trimmed,
      suggestedCardReference: suggestNextCardReference(trimmed),
    },
  };
}

export async function getOrderDetail(orderId: string) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  const detail = await serializePosOrderDetail(orderId);
  if (!detail) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  return { success: true as const, data: { order: detail } };
}

export async function addOrderItem(orderId: string, productId: string) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  const order = await getOpenOrder(orderId);
  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const existingItem = await prisma.orderItem.findFirst({
    where: { orderId, productId, isVoided: false },
  });
  if (existingItem) {
    return updateItemQty(orderId, existingItem.id, existingItem.quantity + 1);
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  });
  if (!product) {
    return { success: false as const, error: "PRODUCT_NOT_FOUND" as const };
  }

  const unitPrice = decimalToNumber(product.price);
  const taxRate = decimalToNumber(product.taxRate);
  const lineTax = calculateLineItemTax({ unitPrice, quantity: 1, taxRate });

  await prisma.orderItem.create({
    data: {
      orderId,
      productId,
      quantity: 1,
      unitPrice,
      taxRate,
      subtotal: lineTax.subtotal,
      taxAmount: lineTax.taxAmount,
      total: lineTax.total,
    },
  });

  await recalculateAndUpdateOrder(orderId);
  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function addCustomOrderItem(
  orderId: string,
  input: { name: string; price: number; taxRate: number; reason: string },
) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }

  const name = input.name?.trim();
  const reason = input.reason?.trim();
  if (!name) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }
  if (!reason) {
    return { success: false as const, error: "REASON_REQUIRED" as const };
  }
  if (input.price < 0 || Number.isNaN(input.price)) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }
  if (input.taxRate < 0 || input.taxRate > 100 || Number.isNaN(input.taxRate)) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  const order = await getOpenOrder(orderId);
  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const productId = await getOrCreateCustomProductPlaceholder();
  const unitPrice = formatDecimal(input.price);
  const taxRate = formatDecimal(input.taxRate);
  const lineTax = calculateLineItemTax({ unitPrice, quantity: 1, taxRate });

  await prisma.orderItem.create({
    data: {
      orderId,
      productId,
      quantity: 1,
      unitPrice,
      taxRate,
      subtotal: lineTax.subtotal,
      taxAmount: lineTax.taxAmount,
      total: lineTax.total,
      customName: name,
      customReason: reason,
    },
  });

  await recalculateAndUpdateOrder(orderId);
  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function updateItemQty(orderId: string, itemId: string, quantity: number) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  if (quantity < 1) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: { order: true },
  });

  if (!item) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (item.order.status !== "OPEN" || item.isVoided) {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const lineTax = calculateLineItemTax({
    unitPrice: decimalToNumber(item.unitPrice),
    quantity,
    taxRate: decimalToNumber(item.taxRate),
  });

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      quantity,
      subtotal: lineTax.subtotal,
      taxAmount: lineTax.taxAmount,
      total: lineTax.total,
    },
  });

  await recalculateAndUpdateOrder(orderId);
  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function updateItemUnitPrice(
  orderId: string,
  itemId: string,
  unitPrice: number,
) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }

  const price = formatDecimal(unitPrice);
  if (price < 0.01) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: { order: true },
  });

  if (!item) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (item.order.status !== "OPEN" || item.isVoided) {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const lineTax = calculateLineItemTax({
    unitPrice: price,
    quantity: item.quantity,
    taxRate: decimalToNumber(item.taxRate),
  });

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      unitPrice: price,
      subtotal: lineTax.subtotal,
      taxAmount: lineTax.taxAmount,
      total: lineTax.total,
    },
  });

  await recalculateAndUpdateOrder(orderId);
  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

function serializeSplittableItems(
  items: Array<{
    quantity: number;
    unitPrice: Prisma.Decimal | number;
    taxRate: Prisma.Decimal | number;
    subtotal: Prisma.Decimal | number;
    taxAmount: Prisma.Decimal | number;
    total: Prisma.Decimal | number;
    isVoided: boolean;
    splitIndex: number | null;
    splitAllocations: unknown;
  }>,
) {
  return items.map((item) => ({
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    taxRate: decimalToNumber(item.taxRate),
    subtotal: decimalToNumber(item.subtotal),
    taxAmount: decimalToNumber(item.taxAmount),
    total: decimalToNumber(item.total),
    isVoided: item.isVoided,
    splitIndex: item.splitIndex,
    splitAllocations: parseSplitAllocations(item.splitAllocations),
  }));
}

function currentPayableTotal(
  order: { total: Prisma.Decimal | number; discountTotal: Prisma.Decimal | number },
  items: ReturnType<typeof serializeSplittableItems>,
  splitIndex?: number | null,
) {
  const discountTotal = decimalToNumber(order.discountTotal);
  if (splitIndex != null) {
    return calculateSplitTotal(items, splitIndex, discountTotal).total;
  }
  return decimalToNumber(order.total);
}

function pickAdjustmentItem(
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: Prisma.Decimal | number;
    taxRate: Prisma.Decimal | number;
    subtotal: Prisma.Decimal | number;
    taxAmount: Prisma.Decimal | number;
    total: Prisma.Decimal | number;
    isVoided: boolean;
    splitIndex: number | null;
    splitAllocations: unknown;
    createdAt: Date;
  }>,
  splitIndex?: number | null,
) {
  const active = orderItems.filter((item) => !item.isVoided);
  if (active.length === 0) return null;

  if (splitIndex != null) {
    const serialized = serializeSplittableItems(active);
    const onSplit = active.filter(
      (_, index) => quantityForSplit(serialized[index]!, splitIndex) > 0,
    );
    return onSplit[onSplit.length - 1] ?? null;
  }

  return active[active.length - 1] ?? null;
}

async function bumpItemUnitPrice(
  item: {
    id: string;
    quantity: number;
    unitPrice: Prisma.Decimal | number;
    taxRate: Prisma.Decimal | number;
    splitIndex: number | null;
    splitAllocations: unknown;
  },
  unitPriceDelta: number,
) {
  const currentPrice = decimalToNumber(item.unitPrice);
  const nextPrice = formatDecimal(Math.max(0.01, currentPrice + unitPriceDelta));
  const lineTax = calculateLineItemTax({
    unitPrice: nextPrice,
    quantity: item.quantity,
    taxRate: decimalToNumber(item.taxRate),
  });

  await prisma.orderItem.update({
    where: { id: item.id },
    data: {
      unitPrice: nextPrice,
      subtotal: lineTax.subtotal,
      taxAmount: lineTax.taxAmount,
      total: lineTax.total,
    },
  });
}

export async function setPayableTotal(
  orderId: string,
  targetTotal: number,
  splitIndex?: number | null,
) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }

  const total = formatDecimal(targetTotal);
  if (total < 0.01 || Number.isNaN(total)) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { where: { isVoided: false }, orderBy: { createdAt: "asc" } },
      discounts: true,
    },
  });

  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN" || order.items.length === 0) {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  if (splitIndex != null) {
    if (!order.isSplitBill) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }
    const splitCount = order.splitCount ?? 2;
    if (splitIndex < 0 || splitIndex >= splitCount) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }
    if ((order.paidSplitIndices ?? []).includes(splitIndex)) {
      return { success: false as const, error: "SPLIT_ALREADY_PAID" as const };
    }
  } else if (order.isSplitBill) {
    return { success: false as const, error: "SPLIT_INDEX_REQUIRED" as const };
  }

  let serializedItems = serializeSplittableItems(order.items);
  let currentTotal = currentPayableTotal(order, serializedItems, splitIndex);
  if (Math.abs(currentTotal - total) < 0.005) {
    const detail = await serializePosOrderDetail(orderId);
    return { success: true as const, data: { order: detail! } };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const remaining = formatDecimal(total - currentTotal);
    if (Math.abs(remaining) < 0.005) break;

    const adjustmentItem = pickAdjustmentItem(order.items, splitIndex);
    if (!adjustmentItem) {
      return { success: false as const, error: "SPLIT_NO_ITEMS" as const };
    }

    const itemIndex = order.items.findIndex((item) => item.id === adjustmentItem.id);
    const itemSerialized = serializedItems[itemIndex] ?? serializeSplittableItems([adjustmentItem])[0]!;

    const divisor =
      splitIndex != null
        ? Math.max(1, quantityForSplit(itemSerialized, splitIndex))
        : Math.max(1, adjustmentItem.quantity);

    await bumpItemUnitPrice(adjustmentItem, remaining / divisor);
    await recalculateAndUpdateOrder(orderId, { preserveKitchenStatus: true });

    const refreshed = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: { where: { isVoided: false }, orderBy: { createdAt: "asc" } },
        discounts: true,
      },
    });

    order.items = refreshed.items;
    serializedItems = serializeSplittableItems(refreshed.items);
    currentTotal = currentPayableTotal(refreshed, serializedItems, splitIndex);
  }

  if (Math.abs(currentTotal - total) >= 0.02) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function voidOrderItem(
  orderId: string,
  itemId: string,
  voidReason: string,
) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  const reason = voidReason?.trim();
  if (!reason) {
    return { success: false as const, error: "REASON_REQUIRED" as const };
  }

  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: { order: true },
  });

  if (!item) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (item.order.status !== "OPEN" || item.isVoided) {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      isVoided: true,
      voidedAt: new Date(),
      voidedById: session.user.id,
      voidReason: reason,
    },
  });

  await recalculateAndUpdateOrder(orderId);
  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function applyOrderDiscount(orderId: string, discountId: string) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { discounts: true },
  });

  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const discount = await prisma.discount.findFirst({
    where: { id: discountId, isActive: true },
  });
  if (!discount) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      discounts: {
        set: [{ id: discountId }],
      },
    },
  });

  await recalculateAndUpdateOrder(orderId, { preserveKitchenStatus: true });
  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function configureSplitBill(
  orderId: string,
  input: {
    isSplitBill: boolean;
    splitCount?: number;
    assignments?: SplitItemAssignment[];
  },
) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const splitCount = input.splitCount ?? order.splitCount ?? 2;
  if (input.isSplitBill && (splitCount < 2 || splitCount > 10)) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  const paidSplitIndices = order.paidSplitIndices ?? [];
  const splitStructureChanging =
    !input.isSplitBill ||
    (input.isSplitBill &&
      input.splitCount != null &&
      input.splitCount !== order.splitCount) ||
    Boolean(input.assignments?.length);

  if (paidSplitIndices.length > 0 && splitStructureChanging) {
    return { success: false as const, error: "SPLIT_PAYMENTS_IN_PROGRESS" as const };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      isSplitBill: input.isSplitBill,
      splitCount: input.isSplitBill ? splitCount : null,
      ...(splitStructureChanging ? { paidSplitIndices: [] } : {}),
    },
  });

  if (!input.isSplitBill) {
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { splitIndex: null, splitAllocations: Prisma.DbNull },
    });
  }

  if (input.assignments?.length) {
    const itemIds = input.assignments.map((a) => a.itemId);
    const orderItems = await prisma.orderItem.findMany({
      where: { id: { in: itemIds }, orderId, isVoided: false },
    });
    if (orderItems.length !== itemIds.length) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }

    const itemById = new Map(orderItems.map((item) => [item.id, item]));
    const maxSplitIndex = splitCount - 1;

    for (const assignment of input.assignments) {
      const item = itemById.get(assignment.itemId);
      if (!item) {
        return { success: false as const, error: "INVALID_INPUT" as const };
      }

      const normalized = assignment.allocations.filter((entry) => entry.quantity > 0);
      const assignedQty = normalized.reduce((sum, entry) => sum + entry.quantity, 0);

      if (assignedQty !== item.quantity) {
        return { success: false as const, error: "INVALID_INPUT" as const };
      }

      if (
        normalized.some(
          (entry) =>
            entry.splitIndex < 0 ||
            entry.splitIndex > maxSplitIndex ||
            entry.quantity < 0 ||
            !Number.isInteger(entry.quantity),
        )
      ) {
        return { success: false as const, error: "INVALID_INPUT" as const };
      }
    }

    await prisma.$transaction(
      input.assignments.map((assignment) => {
        const allocations = assignment.allocations.filter((entry) => entry.quantity > 0);
        return prisma.orderItem.update({
          where: { id: assignment.itemId },
          data: {
            splitAllocations: allocations as unknown as Prisma.InputJsonValue,
            splitIndex: primarySplitIndex(allocations),
          },
        });
      }),
    );
  }

  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function payOrder(
  orderId: string,
  input: {
    paymentMethod: PaymentMethod;
    cardReference?: string;
    amountTendered?: number;
    splitIndex?: number;
  },
) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }
  const session = authResult.session;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { where: { isVoided: false } },
      discounts: true,
    },
  });

  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }
  if (order.items.length === 0) {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  const discountTotal = decimalToNumber(order.discountTotal);
  const serializedItems = order.items.map((item) => ({
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    taxRate: decimalToNumber(item.taxRate),
    subtotal: decimalToNumber(item.subtotal),
    taxAmount: decimalToNumber(item.taxAmount),
    total: decimalToNumber(item.total),
    isVoided: item.isVoided,
    splitIndex: item.splitIndex,
    splitAllocations: parseSplitAllocations(item.splitAllocations),
  }));

  let payTotal: number;
  let splitIndex: number | null = null;
  let orderFullyPaid = false;

  if (order.isSplitBill) {
    if (input.splitIndex == null || !Number.isInteger(input.splitIndex)) {
      return { success: false as const, error: "SPLIT_INDEX_REQUIRED" as const };
    }

    splitIndex = input.splitIndex;
    const splitCount = order.splitCount ?? 2;
    if (splitIndex < 0 || splitIndex >= splitCount) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }

    const paidSplitIndices = order.paidSplitIndices ?? [];
    if (paidSplitIndices.includes(splitIndex)) {
      return { success: false as const, error: "SPLIT_ALREADY_PAID" as const };
    }

    const splitTotals = calculateSplitTotal(
      serializedItems,
      splitIndex,
      discountTotal,
    );
    if (splitTotals.itemCount === 0 || splitTotals.total <= 0) {
      return { success: false as const, error: "SPLIT_NO_ITEMS" as const };
    }

    payTotal = splitTotals.total;
    orderFullyPaid = paidSplitIndices.length + 1 >= splitCount;
  } else {
    if (input.splitIndex != null) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }
    payTotal = decimalToNumber(order.total);
    orderFullyPaid = true;
  }

  const receiptNumber = generateReceiptNumber();
  const paidAt = new Date();

  let amountTendered: number | null = null;
  let changeGiven: number | null = null;

  if (input.paymentMethod === "CASH") {
    if (input.amountTendered == null || Number.isNaN(input.amountTendered)) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }
    amountTendered = formatDecimal(input.amountTendered);
    if (amountTendered < payTotal) {
      return { success: false as const, error: "INSUFFICIENT_TENDER" as const };
    }
    changeGiven = formatDecimal(amountTendered - payTotal);
  }

  await prisma.$transaction(async (tx) => {
    if (order.isSplitBill && splitIndex != null) {
      const newPaidIndices = [...(order.paidSplitIndices ?? []), splitIndex].sort(
        (a, b) => a - b,
      );

      const existingSplitPayments = parseSplitPayments(order.splitPayments);
      const splitPaymentEntry: SplitPaymentRecord = {
        splitIndex,
        paymentMethod: input.paymentMethod,
        cardReference:
          input.paymentMethod === "CARD"
            ? input.cardReference?.trim() || null
            : null,
        total: payTotal,
        amountTendered:
          input.paymentMethod === "CASH" ? amountTendered : null,
        changeGiven: input.paymentMethod === "CASH" ? changeGiven : null,
      };
      const updatedSplitPayments = [
        ...existingSplitPayments.filter(
          (entry) => entry.splitIndex !== splitIndex,
        ),
        splitPaymentEntry,
      ].sort((a, b) => a.splitIndex - b.splitIndex);

      await tx.order.update({
        where: { id: orderId },
        data: {
          paidSplitIndices: newPaidIndices,
          splitPayments: updatedSplitPayments,
          ...(orderFullyPaid
            ? {
                status: "PAID" satisfies OrderStatus,
                paymentMethod: input.paymentMethod,
                cardReference:
                  input.paymentMethod === "CARD"
                    ? input.cardReference?.trim() || null
                    : null,
                amountTendered:
                  input.paymentMethod === "CASH"
                    ? formatDecimal(amountTendered!)
                    : null,
                changeGiven:
                  input.paymentMethod === "CASH"
                    ? formatDecimal(changeGiven!)
                    : null,
                receiptNumber,
                paidById: session.user.id,
                paidAt,
              }
            : {}),
        },
      });
    } else {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID" satisfies OrderStatus,
          paymentMethod: input.paymentMethod,
          cardReference:
            input.paymentMethod === "CARD" ? input.cardReference?.trim() || null : null,
          amountTendered:
            input.paymentMethod === "CASH" ? formatDecimal(amountTendered!) : null,
          changeGiven:
            input.paymentMethod === "CASH" ? formatDecimal(changeGiven!) : null,
          receiptNumber,
          paidById: session.user.id,
          paidAt,
        },
      });
    }

    if (input.paymentMethod === "CASH") {
      await incrementCashRegisterBalance(payTotal, tx);
    }

    if (input.paymentMethod === "CARD" && input.cardReference?.trim()) {
      await tx.settings.update({
        where: { id: "default" },
        data: { lastCardReference: input.cardReference.trim() },
      });
    }
  });

  const settings = await prisma.settings.findUniqueOrThrow({
    where: { id: "default" },
  });

  const detail = await serializePosOrderDetail(orderId);
  return {
    success: true as const,
    data: {
      order: detail!,
      splitIndex,
      orderFullyPaid,
      paidSplitTotal: payTotal,
      suggestedCardReference:
        input.paymentMethod === "CARD" && input.cardReference?.trim()
          ? suggestNextCardReference(input.cardReference.trim())
          : suggestNextCardReference(settings.lastCardReference),
      settings: {
        businessName: settings.businessName,
        businessAddress: settings.businessAddress,
        businessPhone: settings.businessPhone,
        taxId: settings.taxId,
        currencySymbol: settings.currencySymbol,
        receiptHeaderEs: settings.receiptHeaderEs,
        receiptHeaderEn: settings.receiptHeaderEn,
        receiptFooterEs: settings.receiptFooterEs,
        receiptFooterEn: settings.receiptFooterEn,
        kitchenPrintingEnabled: settings.kitchenPrintingEnabled,
        receiptEmailEnabled: settings.receiptEmailEnabled,
        cashRegisterBalance: decimalToNumber(settings.cashRegisterBalance),
      },
    },
  };
}

export async function convertOrderType(
  orderId: string,
  input: { type: OrderType; tableId?: string | null },
) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      type: true,
      tableId: true,
      paidSplitIndices: true,
    },
  });

  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }
  if ((order.paidSplitIndices ?? []).length > 0) {
    return { success: false as const, error: "SPLIT_PAYMENTS_IN_PROGRESS" as const };
  }

  if (input.type === "DINE_IN") {
    if (!input.tableId) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }

    const table = await prisma.table.findFirst({
      where: { id: input.tableId, isActive: true },
    });
    if (!table) {
      return { success: false as const, error: "NOT_FOUND" as const };
    }

    const occupied = await prisma.order.findFirst({
      where: {
        tableId: input.tableId,
        status: "OPEN",
        id: { not: orderId },
      },
    });
    if (occupied) {
      return { success: false as const, error: "TABLE_OCCUPIED" as const };
    }
  }

  if (order.type === "ONLINE" || input.type === "ONLINE") {
    return { success: false as const, error: "INVALID_INPUT" as const };
  }

  if (input.type === order.type) {
    if (input.type === "TAKEAWAY" || input.tableId === order.tableId) {
      return { success: false as const, error: "INVALID_INPUT" as const };
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      type: input.type,
      tableId: input.type === "DINE_IN" ? input.tableId : null,
    },
  });

  const detail = await serializePosOrderDetail(orderId);
  return { success: true as const, data: { order: detail! } };
}

export async function cancelOrder(orderId: string) {
  const authResult = await requirePosSession();
  if (!authResult.ok) {
    return posAuthFailure(authResult.error);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }
  if (order.status !== "OPEN") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId } }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        subtotal: 0,
        taxTotal: 0,
        discountTotal: 0,
        total: 0,
        isSplitBill: false,
        splitCount: null,
        paidSplitIndices: [],
        discounts: { set: [] },
      },
    }),
  ]);

  return { success: true as const, data: { orderId } };
}
