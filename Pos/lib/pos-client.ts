"use client";

import type { SplitItemAssignment } from "@/lib/split-bill";
import { calculateLineItemTax } from "@/lib/calculations";
import type { PosOrderDetail } from "@/lib/actions/pos-orders";
import type { CartItem } from "@/stores/pos-store";
import type { PosOrderType } from "@/types";

export function orderDetailToCartItems(order: PosOrderDetail): CartItem[] {
  return order.items.map((item) => {
    const line = calculateLineItemTax({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      taxRate: item.taxRate,
    });

    return {
      id: item.id,
      productId: item.productId,
      nameEs: item.nameEs,
      nameEn: item.nameEn,
      nameDe: item.nameDe,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      ...line,
      customReason: item.customReason,
      isCustom: item.isCustom,
      splitIndex: item.splitIndex,
      splitAllocations: item.splitAllocations ?? null,
      isVoided: item.isVoided,
    };
  });
}

export async function fetchPosBootstrap() {
  const [ordersRes, categoriesRes, discountsRes] = await Promise.all([
    fetch("/api/orders?scope=pos", { cache: "no-store" }),
    fetch("/api/categories", { cache: "no-store" }),
    fetch("/api/discounts", { cache: "no-store" }),
  ]);

  if (!ordersRes.ok || !categoriesRes.ok || !discountsRes.ok) {
    throw new Error("Failed to load POS data");
  }

  const ordersData = await ordersRes.json();
  const categoriesData = await categoriesRes.json();
  const discountsData = await discountsRes.json();

  return {
    tables: ordersData.tables,
    openOrders: ordersData.openOrders,
    takeawayOrders: ordersData.takeawayOrders,
    onlineOrders: ordersData.onlineOrders ?? [],
    categories: categoriesData.categories,
    discounts: discountsData.discounts,
    mapWidth: ordersData.mapWidth ?? 100,
    mapHeight: ordersData.mapHeight ?? 100,
    receiptEmailEnabled: ordersData.receiptEmailEnabled ?? false,
    registerCacheVersion: ordersData.registerCacheVersion ?? 0,
    suggestedCardReference: ordersData.suggestedCardReference ?? null,
  };
}

export async function updateLastCardReferenceApi(reference: string) {
  const response = await fetch("/api/settings/card-reference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  if (!response.ok) throw new Error("Failed to update card reference");
  return response.json() as Promise<{
    lastCardReference: string;
    suggestedCardReference: string | null;
  }>;
}

export async function createOrderApi(type: PosOrderType, tableId?: string | null) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, tableId }),
  });
  if (!response.ok) throw new Error("Failed to create order");
  return response.json() as Promise<{ order: PosOrderDetail; created: boolean }>;
}

export async function fetchOrderDetail(orderId: string) {
  const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load order");
  const data = await response.json();
  return data.order as PosOrderDetail;
}

export async function addOrderItemApi(orderId: string, productId: string) {
  const response = await fetch(`/api/orders/${orderId}/items`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add", productId }),
  });
  if (!response.ok) throw new Error("Failed to add item");
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function addCustomOrderItemApi(
  orderId: string,
  input: { name: string; price: number; taxRate: number; reason: string },
) {
  const response = await fetch(`/api/orders/${orderId}/items`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addCustom", ...input }),
  });
  if (!response.ok) throw new Error("Failed to add custom item");
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function updateItemQtyApi(orderId: string, itemId: string, quantity: number) {
  const response = await fetch(`/api/orders/${orderId}/items`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update", itemId, quantity }),
  });
  if (!response.ok) throw new Error("Failed to update item");
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function updateItemPriceApi(
  orderId: string,
  itemId: string,
  unitPrice: number,
) {
  const response = await fetch(`/api/orders/${orderId}/items`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updatePrice", itemId, unitPrice }),
  });
  if (!response.ok) throw new Error("Failed to update price");
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function setPayableTotalApi(
  orderId: string,
  total: number,
  splitIndex?: number | null,
) {
  const response = await fetch(`/api/orders/${orderId}/total`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ total, splitIndex }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error("Failed to update total") as Error & { code?: string };
    error.code = data.error;
    throw error;
  }
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function voidOrderItemApi(orderId: string, itemId: string, voidReason: string) {
  const response = await fetch(`/api/orders/${orderId}/items`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "void", itemId, voidReason }),
  });
  if (!response.ok) throw new Error("Failed to void item");
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function applyDiscountApi(orderId: string, discountId: string) {
  const response = await fetch(`/api/orders/${orderId}/discount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discountId }),
  });
  if (!response.ok) throw new Error("Failed to apply discount");
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function configureSplitApi(
  orderId: string,
  body: {
    isSplitBill: boolean;
    splitCount?: number;
    assignments?: SplitItemAssignment[];
  },
) {
  const response = await fetch(`/api/orders/${orderId}/split`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Failed to configure split");
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function convertOrderTypeApi(
  orderId: string,
  body: { type: "DINE_IN" | "TAKEAWAY"; tableId?: string | null },
) {
  const response = await fetch(`/api/orders/${orderId}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error("Failed to convert order") as Error & { code?: string };
    error.code = data.error;
    throw error;
  }
  return response.json() as Promise<{ order: PosOrderDetail }>;
}

export async function cancelOrderApi(orderId: string) {
  const response = await fetch(`/api/orders/${orderId}/cancel`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to cancel order");
  return response.json() as Promise<{ ok: true; orderId: string }>;
}

export async function payOrderApi(
  orderId: string,
  paymentMethod: "CASH" | "CARD",
  options?: {
    cardReference?: string;
    amountTendered?: number;
    splitIndex?: number;
  },
) {
  const response = await fetch(`/api/orders/${orderId}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentMethod,
      cardReference: options?.cardReference,
      amountTendered: options?.amountTendered,
      splitIndex: options?.splitIndex,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message ?? "Payment failed") as Error & {
      code?: string;
    };
    error.code = data.error;
    throw error;
  }
  return data as {
    order: PosOrderDetail;
    splitIndex: number | null;
    orderFullyPaid: boolean;
    paidSplitTotal: number;
    suggestedCardReference?: string | null;
    settings: {
      businessName: string;
      businessAddress: string;
      businessPhone: string;
      taxId: string;
      currencySymbol: string;
      receiptHeaderEs: string;
      receiptHeaderEn: string;
      receiptFooterEs: string;
      receiptFooterEn: string;
      kitchenPrintingEnabled: boolean;
      receiptEmailEnabled: boolean;
    };
  };
}

export async function emailReceiptApi(orderId: string, email: string, locale?: string) {
  const response = await fetch(`/api/orders/${orderId}/email-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, locale }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message ?? "Email failed") as Error & { code?: string };
    error.code = data.error;
    throw error;
  }
  return data as { ok: true };
}
