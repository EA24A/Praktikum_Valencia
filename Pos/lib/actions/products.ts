"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth-utils";
import { formatDecimal } from "@/lib/calculations";
import { notifyWebsiteCatalogSync } from "@/lib/catalog/notify-website-sync";
import { normalizeComboGroups } from "@/lib/combos/auto-combo";
import type { ComboComponentGroup } from "@/lib/combos/auto-combo";
import type { PosProduct } from "@/types";

function revalidateProductAdminPages() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/menu-cards");
}

function serializeProduct(product: {
  id: string;
  categoryId: string;
  nameEs: string;
  nameEn: string;
  nameDe: string;
  price: { toNumber?: () => number } | number | string;
  taxRate: { toNumber?: () => number } | number | string;
  isActive: boolean;
  posOnly: boolean;
  sortOrder: number;
  comboComponentIds?: string[];
  comboComponentGroups?: unknown;
}): PosProduct {
  const groups = normalizeComboGroups(
    product.comboComponentGroups,
    product.comboComponentIds ?? [],
  );
  return {
    id: product.id,
    categoryId: product.categoryId,
    nameEs: product.nameEs,
    nameEn: product.nameEn,
    nameDe: product.nameDe,
    price: Number(product.price),
    taxRate: Number(product.taxRate),
    isActive: product.isActive,
    posOnly: product.posOnly,
    sortOrder: product.sortOrder,
    comboComponentIds: product.comboComponentIds ?? [],
    comboComponentGroups: groups,
  };
}

export type ProductActionResult =
  | { success: true; product: PosProduct }
  | { success: false; error: string };

export type ProductsListResult = PosProduct[];

export async function listProducts(options?: {
  categoryId?: string;
  search?: string;
  includeInactive?: boolean;
}): Promise<ProductsListResult> {
  await requireSuperadmin();

  const includeInactive = options?.includeInactive ?? false;
  const search = options?.search?.trim().toLowerCase();

  const products = await prisma.product.findMany({
    where: {
      ...(options?.categoryId && { categoryId: options.categoryId }),
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              { nameEs: { contains: search, mode: "insensitive" } },
              { nameEn: { contains: search, mode: "insensitive" } },
              { nameDe: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return products.map(serializeProduct);
}

export async function createProduct(data: {
  categoryId: string;
  nameEs: string;
  nameEn: string;
  nameDe?: string;
  price: number;
  taxRate: number;
  sortOrder?: number;
  posOnly?: boolean;
  comboComponentIds?: string[];
  comboComponentGroups?: ComboComponentGroup[] | null;
}): Promise<ProductActionResult> {
  await requireSuperadmin();

  const nameEs = data.nameEs.trim();
  const nameEn = data.nameEn.trim();
  const nameDe = data.nameDe?.trim() ?? "";

  if (!nameEs || !nameEn) {
    return { success: false, error: "Name is required in both languages" };
  }

  if (data.price < 0) {
    return { success: false, error: "Price must be non-negative" };
  }

  if (data.taxRate < 0 || data.taxRate > 100) {
    return { success: false, error: "Tax rate must be between 0 and 100" };
  }

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    return { success: false, error: "Category not found" };
  }

  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    const maxSort = await prisma.product.aggregate({
      where: { categoryId: data.categoryId },
      _max: { sortOrder: true },
    });
    sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  }

  const product = await prisma.product.create({
    data: {
      categoryId: data.categoryId,
      nameEs,
      nameEn,
      nameDe,
      price: formatDecimal(data.price),
      taxRate: formatDecimal(data.taxRate),
      sortOrder,
      posOnly: data.posOnly ?? false,
      comboComponentIds: [],
      comboComponentGroups:
        data.comboComponentGroups === undefined
          ? undefined
          : data.comboComponentGroups === null
            ? Prisma.DbNull
            : (data.comboComponentGroups as Prisma.InputJsonValue),
    },
  });

  revalidateProductAdminPages();
  void notifyWebsiteCatalogSync();
  return { success: true, product: serializeProduct(product) };
}

export async function updateProduct(data: {
  id: string;
  categoryId?: string;
  nameEs?: string;
  nameEn?: string;
  nameDe?: string;
  price?: number;
  taxRate?: number;
  sortOrder?: number;
  isActive?: boolean;
  posOnly?: boolean;
  comboComponentIds?: string[];
  comboComponentGroups?: ComboComponentGroup[] | null;
}): Promise<ProductActionResult> {
  await requireSuperadmin();

  const existing = await prisma.product.findUnique({
    where: { id: data.id },
  });

  if (!existing) {
    return { success: false, error: "Product not found" };
  }

  if (data.price !== undefined && data.price < 0) {
    return { success: false, error: "Price must be non-negative" };
  }

  if (
    data.taxRate !== undefined &&
    (data.taxRate < 0 || data.taxRate > 100)
  ) {
    return { success: false, error: "Tax rate must be between 0 and 100" };
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      return { success: false, error: "Category not found" };
    }
  }

  if (data.nameEs !== undefined) {
    const nameEs = data.nameEs.trim();
    if (!nameEs) {
      return { success: false, error: "Name is required in both languages" };
    }
  }

  if (data.nameEn !== undefined) {
    const nameEn = data.nameEn.trim();
    if (!nameEn) {
      return { success: false, error: "Name is required in both languages" };
    }
  }

  const product = await prisma.product.update({
    where: { id: data.id },
    data: {
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.nameEs !== undefined && { nameEs: data.nameEs.trim() }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn.trim() }),
      ...(data.nameDe !== undefined && { nameDe: data.nameDe.trim() }),
      ...(data.price !== undefined && { price: formatDecimal(data.price) }),
      ...(data.taxRate !== undefined && {
        taxRate: formatDecimal(data.taxRate),
      }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.posOnly !== undefined && { posOnly: data.posOnly }),
      ...(data.comboComponentGroups !== undefined && {
        comboComponentGroups:
          data.comboComponentGroups === null
            ? Prisma.DbNull
            : (data.comboComponentGroups as Prisma.InputJsonValue),
        comboComponentIds: [],
      }),
    },
  });

  revalidateProductAdminPages();
  void notifyWebsiteCatalogSync();
  return { success: true, product: serializeProduct(product) };
}

export async function deactivateProduct(
  id: string,
): Promise<ProductActionResult> {
  return updateProduct({ id, isActive: false });
}

export async function deleteProduct(
  id: string,
): Promise<
  | { success: true }
  | { success: false; error: string; code?: "HAS_HISTORY" | "HAS_COMBO_REF" }
> {
  await requireSuperadmin();

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Product not found" };
  }

  const orderItemCount = await prisma.orderItem.count({
    where: { productId: id },
  });
  if (orderItemCount > 0) {
    return {
      success: false,
      error:
        "Cannot delete a product that appears on orders. Deactivate it instead.",
      code: "HAS_HISTORY",
    };
  }

  const comboProducts = await prisma.product.findMany({
    where: {
      id: { not: id },
      OR: [
        { comboComponentIds: { has: id } },
        { comboComponentGroups: { not: Prisma.DbNull } },
      ],
    },
    select: {
      comboComponentIds: true,
      comboComponentGroups: true,
    },
  });

  const usedInCombo = comboProducts.some((product) => {
    if (product.comboComponentIds.includes(id)) {
      return true;
    }
    const groups = normalizeComboGroups(
      product.comboComponentGroups,
      product.comboComponentIds,
    );
    return groups?.some((group) => group.productIds.includes(id)) ?? false;
  });

  if (usedInCombo) {
    return {
      success: false,
      error:
        "This product is used in a combo. Remove it from combos or deactivate instead.",
      code: "HAS_COMBO_REF",
    };
  }

  await prisma.product.delete({ where: { id } });

  revalidateProductAdminPages();
  void notifyWebsiteCatalogSync();
  return { success: true };
}

export async function bulkDeactivateProducts(
  ids: string[],
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  await requireSuperadmin();

  if (ids.length === 0) {
    return { success: false, error: "No products selected" };
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  });

  revalidateProductAdminPages();
  void notifyWebsiteCatalogSync();
  return { success: true, count: result.count };
}

export async function bulkUpdateProductTaxRates(
  ids: string[],
  taxRate: number,
): Promise<
  | { success: true; count: number; products: PosProduct[] }
  | { success: false; error: string }
> {
  await requireSuperadmin();

  if (ids.length === 0) {
    return { success: false, error: "No products selected" };
  }

  if (taxRate < 0 || taxRate > 100) {
    return { success: false, error: "Tax rate must be between 0 and 100" };
  }

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { taxRate: formatDecimal(taxRate) },
  });

  const updated = await prisma.product.findMany({
    where: { id: { in: ids } },
  });

  revalidateProductAdminPages();
  void notifyWebsiteCatalogSync();
  return {
    success: true,
    count: updated.length,
    products: updated.map(serializeProduct),
  };
}

export async function bulkUpdateProductPrices(
  ids: string[],
  price: number,
): Promise<
  | { success: true; count: number; products: PosProduct[] }
  | { success: false; error: string }
> {
  await requireSuperadmin();

  if (ids.length === 0) {
    return { success: false, error: "No products selected" };
  }

  if (price < 0 || Number.isNaN(price)) {
    return { success: false, error: "Price must be zero or greater" };
  }

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { price: formatDecimal(price) },
  });

  const updated = await prisma.product.findMany({
    where: { id: { in: ids } },
  });

  revalidateProductAdminPages();
  void notifyWebsiteCatalogSync();
  return {
    success: true,
    count: updated.length,
    products: updated.map(serializeProduct),
  };
}
