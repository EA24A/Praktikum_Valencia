import type { Role } from "@prisma/client";
import type { ComboComponentGroup } from "@/lib/combos/auto-combo";
import type { QueuedMutation, QueuedMutationType } from "@/lib/offline-queue";

export type { Role };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ApiError {
  error: string;
  status?: number;
}

export type { QueuedMutation, QueuedMutationType };

export interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  taxId: string;
  defaultTaxRate: number;
  currencySymbol: string;
  receiptHeaderEs: string;
  receiptHeaderEn: string;
  receiptFooterEs: string;
  receiptFooterEn: string;
  kitchenPrintingEnabled: boolean;
  receiptEmailEnabled: boolean;
  receiptFromEmail: string;
  mapWidth: number;
  mapHeight: number;
  cashRegisterBalance: number;
}

export interface PosTable {
  id: string;
  number: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: string;
  isActive: boolean;
  hasOpenOrder?: boolean;
  orderTotal?: number;
  itemCount?: number;
  openOrderId?: string;
}

export type PosOrderType = "DINE_IN" | "TAKEAWAY" | "ONLINE";

export interface PosTakeawayOrder {
  id: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface PosProduct {
  id: string;
  categoryId: string;
  nameEs: string;
  nameEn: string;
  nameDe: string;
  price: number;
  taxRate: number;
  isActive: boolean;
  posOnly: boolean;
  sortOrder: number;
  comboComponentIds: string[];
  comboComponentGroups: ComboComponentGroup[] | null;
}

export interface PosCategory {
  id: string;
  nameEs: string;
  nameEn: string;
  nameDe: string;
  sortOrder: number;
  isActive: boolean;
  products: PosProduct[];
}
