"use server";

import { revalidatePath } from "next/cache";
import type { DiscountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth-utils";

export interface PosDiscount {
  id: string;
  nameEs: string;
  nameEn: string;
  type: DiscountType;
  value: number;
  isCombo: boolean;
  comboProducts: string[];
  requiresCashPayment: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComboProductOption {
  id: string;
  nameEs: string;
  nameEn: string;
  price: number;
}

export type DiscountInput = {
  nameEs: string;
  nameEn: string;
  type: DiscountType;
  value: number;
  requiresCashPayment?: boolean;
  comboProducts?: string[];
};

export type DiscountActionResult =
  | { success: true; discount: PosDiscount }
  | { success: false; error: string };

function serializeDiscount(
  discount: {
    id: string;
    nameEs: string;
    nameEn: string;
    type: DiscountType;
    value: { toNumber?: () => number } | number | string;
    isCombo: boolean;
    comboProducts: string[];
    requiresCashPayment: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { orders: number };
  },
  usageCount?: number,
): PosDiscount {
  return {
    id: discount.id,
    nameEs: discount.nameEs,
    nameEn: discount.nameEn,
    type: discount.type,
    value: Number(discount.value),
    isCombo: discount.isCombo,
    comboProducts: discount.comboProducts,
    requiresCashPayment: discount.requiresCashPayment,
    isActive: discount.isActive,
    usageCount: usageCount ?? discount._count?.orders ?? 0,
    createdAt: discount.createdAt.toISOString(),
    updatedAt: discount.updatedAt.toISOString(),
  };
}

function validateDiscountInput(data: DiscountInput): string | null {
  const nameEs = data.nameEs.trim();
  const nameEn = data.nameEn.trim();

  if (!nameEs || !nameEn) {
    return "Name is required in both languages";
  }

  if (data.type === "PERCENTAGE") {
    if (data.value <= 0 || data.value > 100) {
      return "Percentage must be between 0 and 100";
    }
  } else if (data.type === "FIXED_AMOUNT") {
    if (data.value <= 0) {
      return "Fixed amount must be greater than zero";
    }
  } else if (data.type === "COMBO") {
    const products = data.comboProducts ?? [];
    if (products.length !== 2) {
      return "Combo requires exactly two products";
    }
    if (data.value <= 0) {
      return "Combo price must be greater than zero";
    }
  } else {
    return "Invalid discount type";
  }

  return null;
}

function buildDiscountData(data: DiscountInput) {
  const isCombo = data.type === "COMBO";
  return {
    nameEs: data.nameEs.trim(),
    nameEn: data.nameEn.trim(),
    type: data.type,
    value: data.value,
    isCombo,
    comboProducts: isCombo ? (data.comboProducts ?? []) : [],
    requiresCashPayment: data.requiresCashPayment ?? false,
  };
}

export async function listDiscounts(): Promise<PosDiscount[]> {
  await requireSuperadmin();

  const discounts = await prisma.discount.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { orders: true } },
    },
  });

  return discounts.map((discount) =>
    serializeDiscount(discount, discount._count.orders),
  );
}

export async function listComboProductOptions(): Promise<ComboProductOption[]> {
  await requireSuperadmin();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { nameEs: "asc" },
    select: {
      id: true,
      nameEs: true,
      nameEn: true,
      price: true,
    },
  });

  return products.map((product) => ({
    id: product.id,
    nameEs: product.nameEs,
    nameEn: product.nameEn,
    price: Number(product.price),
  }));
}

export async function createDiscount(
  data: DiscountInput,
): Promise<DiscountActionResult> {
  await requireSuperadmin();

  const validationError = validateDiscountInput(data);
  if (validationError) {
    return { success: false, error: validationError };
  }

  if (data.type === "COMBO" && data.comboProducts?.length) {
    const count = await prisma.product.count({
      where: {
        id: { in: data.comboProducts },
        isActive: true,
      },
    });
    if (count !== data.comboProducts.length) {
      return { success: false, error: "One or more selected products are invalid" };
    }
  }

  const discount = await prisma.discount.create({
    data: buildDiscountData(data),
    include: { _count: { select: { orders: true } } },
  });

  revalidatePath("/admin/discounts");
  return {
    success: true,
    discount: serializeDiscount(discount, discount._count.orders),
  };
}

export async function updateDiscount(
  id: string,
  data: Partial<DiscountInput> & { isActive?: boolean },
): Promise<DiscountActionResult> {
  await requireSuperadmin();

  const existing = await prisma.discount.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });

  if (!existing) {
    return { success: false, error: "Discount not found" };
  }

  if (data.isActive !== undefined && Object.keys(data).length === 1) {
    const discount = await prisma.discount.update({
      where: { id },
      data: { isActive: data.isActive },
      include: { _count: { select: { orders: true } } },
    });
    revalidatePath("/admin/discounts");
    return {
      success: true,
      discount: serializeDiscount(discount, discount._count.orders),
    };
  }

  const comboProducts =
    data.comboProducts ??
    (data.type === "COMBO" || existing.type === "COMBO"
      ? existing.comboProducts
      : []);

  const merged: DiscountInput = {
    nameEs: data.nameEs ?? existing.nameEs,
    nameEn: data.nameEn ?? existing.nameEn,
    type: data.type ?? existing.type,
    value: data.value ?? Number(existing.value),
    requiresCashPayment:
      data.requiresCashPayment ?? existing.requiresCashPayment,
    comboProducts,
  };

  const validationError = validateDiscountInput(merged);
  if (validationError) {
    return { success: false, error: validationError };
  }

  if (merged.type === "COMBO" && comboProducts.length) {
    const count = await prisma.product.count({
      where: {
        id: { in: comboProducts },
        isActive: true,
      },
    });
    if (count !== comboProducts.length) {
      return { success: false, error: "One or more selected products are invalid" };
    }
  }

  const discount = await prisma.discount.update({
    where: { id },
    data: {
      ...buildDiscountData(merged),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: { _count: { select: { orders: true } } },
  });

  revalidatePath("/admin/discounts");
  return {
    success: true,
    discount: serializeDiscount(discount, discount._count.orders),
  };
}

export async function toggleDiscountActive(
  id: string,
  isActive: boolean,
): Promise<DiscountActionResult> {
  return updateDiscount(id, { isActive });
}

export async function deactivateDiscount(
  id: string,
): Promise<DiscountActionResult> {
  return toggleDiscountActive(id, false);
}
