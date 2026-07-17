"use client";

import { create } from "zustand";
import { calculateLineItemTax } from "@/lib/calculations";
import type { PosCategory, PosOrderType, PosTable } from "@/types";

export interface CartItem {
  id: string;
  productId: string;
  nameEs: string;
  nameEn: string;
  nameDe: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  customReason?: string | null;
  isCustom?: boolean;
  splitIndex?: number | null;
  splitAllocations?: Array<{ splitIndex: number; quantity: number }> | null;
  isVoided?: boolean;
}

interface PosState {
  selectedTableId: string | null;
  selectedOrderId: string | null;
  orderType: PosOrderType;
  items: CartItem[];
  categories: PosCategory[];
  tables: PosTable[];
  discountTotal: number;
  isSplitBill: boolean;
  splitCount: number;
  paidSplitIndices: number[];
  setSelectedTable: (tableId: string | null) => void;
  setSelectedOrder: (orderId: string | null) => void;
  setOrderType: (type: PosOrderType) => void;
  setCategories: (categories: PosCategory[]) => void;
  setTables: (tables: PosTable[]) => void;
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  addOrIncrementProduct: (item: CartItem) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemUnitPrice: (id: string, unitPrice: number) => void;
  voidItem: (id: string) => void;
  clearOrder: () => void;
  setDiscountTotal: (amount: number) => void;
  setSplitBill: (enabled: boolean, count?: number) => void;
  setPaidSplitIndices: (indices: number[]) => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  selectedTableId: null,
  selectedOrderId: null,
  orderType: "DINE_IN",
  items: [],
  categories: [],
  tables: [],
  discountTotal: 0,
  isSplitBill: false,
  splitCount: 2,
  paidSplitIndices: [],
  setSelectedTable: (tableId) => set({ selectedTableId: tableId }),
  setSelectedOrder: (orderId) => set({ selectedOrderId: orderId }),
  setOrderType: (orderType) => set({ orderType }),
  setCategories: (categories) => set({ categories }),
  setTables: (tables) => set({ tables }),
  setItems: (items) => set({ items }),
  addItem: (item) => set({ items: [...get().items, item] }),
  addOrIncrementProduct: (item) => {
    const items = get().items;
    const existing = items.find(
      (entry) =>
        entry.productId === item.productId &&
        !entry.isVoided &&
        !entry.isCustom &&
        !item.isCustom,
    );

    if (existing) {
      const quantity = existing.quantity + 1;
      const line = calculateLineItemTax({
        unitPrice: existing.unitPrice,
        quantity,
        taxRate: existing.taxRate,
      });
      set({
        items: items.map((entry) =>
          entry.id === existing.id
            ? { ...entry, quantity, ...line }
            : entry,
        ),
      });
      return;
    }

    set({ items: [...items, item] });
  },
  updateItemQuantity: (id, quantity) =>
    set({
      items: get().items.map((item) => {
        if (item.id !== id) return item;
        const qty = Math.max(1, quantity);
        const line = calculateLineItemTax({
          unitPrice: item.unitPrice,
          quantity: qty,
          taxRate: item.taxRate,
        });
        return { ...item, quantity: qty, ...line };
      }),
    }),
  updateItemUnitPrice: (id, unitPrice) =>
    set({
      items: get().items.map((item) => {
        if (item.id !== id) return item;
        const price = Math.max(0.01, Math.round(unitPrice * 100) / 100);
        const line = calculateLineItemTax({
          unitPrice: price,
          quantity: item.quantity,
          taxRate: item.taxRate,
        });
        return { ...item, unitPrice: price, ...line };
      }),
    }),
  voidItem: (id) =>
    set({
      items: get().items.map((item) =>
        item.id === id ? { ...item, isVoided: true } : item,
      ),
    }),
  clearOrder: () =>
    set({
      selectedOrderId: null,
      selectedTableId: null,
      items: [],
      discountTotal: 0,
      isSplitBill: false,
      splitCount: 2,
      paidSplitIndices: [],
      orderType: "DINE_IN",
    }),
  setDiscountTotal: (discountTotal) => set({ discountTotal }),
  setSplitBill: (isSplitBill, count = 2) =>
    set({ isSplitBill, splitCount: count }),
  setPaidSplitIndices: (paidSplitIndices) => set({ paidSplitIndices }),
}));
