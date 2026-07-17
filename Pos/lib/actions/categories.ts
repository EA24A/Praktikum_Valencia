"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth-utils";
import { notifyWebsiteCatalogSync } from "@/lib/catalog/notify-website-sync";
import { normalizeComboGroups } from "@/lib/combos/auto-combo";
import type { PosCategory, PosProduct } from "@/types";

function revalidateCatalogAdminPages() {
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
    comboComponentGroups: normalizeComboGroups(
      product.comboComponentGroups,
      product.comboComponentIds ?? [],
    ),
  };
}

function serializeCategory(
  category: {
    id: string;
    nameEs: string;
    nameEn: string;
    nameDe: string;
    sortOrder: number;
    isActive: boolean;
    products?: Array<Parameters<typeof serializeProduct>[0]>;
  },
  includeProducts: boolean,
): PosCategory {
  return {
    id: category.id,
    nameEs: category.nameEs,
    nameEn: category.nameEn,
    nameDe: category.nameDe,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    products: includeProducts
      ? (category.products ?? []).map(serializeProduct)
      : [],
  };
}

export type CategoryActionResult =
  | { success: true; category: PosCategory }
  | { success: false; error: string };

export type CategoriesListResult = PosCategory[];

export async function listCategories(options?: {
  includeInactive?: boolean;
  includeProducts?: boolean;
}): Promise<CategoriesListResult> {
  await requireSuperadmin();

  const includeInactive = options?.includeInactive ?? false;
  const includeProducts = options?.includeProducts ?? true;

  const categories = await prisma.category.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: includeProducts
      ? {
          products: {
            where: includeInactive ? undefined : { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        }
      : undefined,
  });

  return categories.map((category) =>
    serializeCategory(category, includeProducts),
  );
}

export async function createCategory(data: {
  nameEs: string;
  nameEn: string;
  nameDe?: string;
}): Promise<CategoryActionResult> {
  await requireSuperadmin();

  const nameEs = data.nameEs.trim();
  const nameEn = data.nameEn.trim();
  const nameDe = data.nameDe?.trim() ?? "";

  if (!nameEs || !nameEn) {
    return { success: false, error: "Name is required in both languages" };
  }

  const maxSort = await prisma.category.aggregate({
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      nameEs,
      nameEn,
      nameDe,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    include: { products: true },
  });

  revalidateCatalogAdminPages();
  void notifyWebsiteCatalogSync();
  return { success: true, category: serializeCategory(category, true) };
}

export async function updateCategory(data: {
  id: string;
  nameEs?: string;
  nameEn?: string;
  nameDe?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<CategoryActionResult> {
  await requireSuperadmin();

  const existing = await prisma.category.findUnique({
    where: { id: data.id },
  });

  if (!existing) {
    return { success: false, error: "Category not found" };
  }

  if (data.nameEs !== undefined && !data.nameEs.trim()) {
    return { success: false, error: "Name is required in both languages" };
  }

  if (data.nameEn !== undefined && !data.nameEn.trim()) {
    return { success: false, error: "Name is required in both languages" };
  }

  const category = await prisma.category.update({
    where: { id: data.id },
    data: {
      ...(data.nameEs !== undefined && { nameEs: data.nameEs.trim() }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn.trim() }),
      ...(data.nameDe !== undefined && { nameDe: data.nameDe.trim() }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: { products: true },
  });

  revalidateCatalogAdminPages();
  void notifyWebsiteCatalogSync();
  return { success: true, category: serializeCategory(category, true) };
}

export async function reorderCategories(
  orderedIds: string[],
): Promise<{ success: true } | { success: false; error: string }> {
  await requireSuperadmin();

  if (orderedIds.length === 0) {
    return { success: false, error: "No categories to reorder" };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidateCatalogAdminPages();
  void notifyWebsiteCatalogSync();
  return { success: true };
}

export async function deactivateCategory(
  id: string,
): Promise<CategoryActionResult> {
  return updateCategory({ id, isActive: false });
}
