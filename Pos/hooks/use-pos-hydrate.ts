"use client";

import type { PosOrderDetail } from "@/lib/actions/pos-orders";
import { usePosStore } from "@/stores/pos-store";
import { orderDetailToCartItems } from "@/lib/pos-client";

export function hydrateOrderFromDetail(order: PosOrderDetail) {
  const store = usePosStore.getState();
  store.setSelectedOrder(order.id);
  store.setOrderType(order.type);
  store.setSelectedTable(order.tableId);
  store.setItems(orderDetailToCartItems(order));
  store.setDiscountTotal(order.discountTotal);
  store.setSplitBill(order.isSplitBill, order.splitCount ?? 2);
  store.setPaidSplitIndices(order.paidSplitIndices ?? []);
}

export function usePosHydrate() {
  return { hydrateOrderFromDetail };
}
