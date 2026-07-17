"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth-utils";
import { formatDecimal } from "@/lib/calculations";
import { notifyWebsiteCatalogSync } from "@/lib/catalog/notify-website-sync";
import { resolveCategoryImportNames } from "@/lib/catalog/category-locale-presets";
import {
  normalizeCategoryKey,
  parseProductImportWorkbook,
  type ProductImportRow,
} from "@/lib/products/parse-product-import";

function buildCategoryMetaByKey(rows: ProductImportRow[]) {
  const meta = new Map<
    string,
    ReturnType<typeof resolveCategoryImportNames>
  >();

  for (const row of rows) {
    const key = normalizeCategoryKey(row.category);
    const resolved = resolveCategoryImportNames(
      row.category,
      row.categoryEn,
      row.categoryDe,
    );
    const existing = meta.get(key);
    if (!existing) {
      meta.set(key, resolved);
      continue;
    }
    meta.set(key, {
      nameEs: existing.nameEs,
      nameEn: row.categoryEn.trim() || existing.nameEn,
      nameDe: row.categoryDe.trim() || existing.nameDe,
    });
  }

  return meta;
}

export interface ProductImportResult {
  success: true;
  created: number;
  updated: number;
  skipped: number;
  categoriesCreated: number;
  errors: { row: number; message: string }[];
}

export async function importProductsFromExcel(
  buffer: ArrayBuffer,
  options?: { updateExisting?: boolean; defaultTaxRate?: number },
): Promise<ProductImportResult | { success: false; error: string }> {
  await requireSuperadmin();

  const updateExisting = options?.updateExisting ?? true;
  const defaultTaxRate = options?.defaultTaxRate ?? 21;

  const parsed = parseProductImportWorkbook(buffer);
  if (parsed.rows.length === 0 && parsed.errors.length > 0) {
    return { success: false, error: parsed.errors[0]?.message ?? "Import failed" };
  }

  const categoryMetaByKey = buildCategoryMetaByKey(parsed.rows);

  const existingCategories = await prisma.category.findMany({
    select: { id: true, nameEs: true, nameEn: true, nameDe: true },
  });

  const categoryByKey = new Map<
    string,
    { id: string; nameEs: string; nameEn: string }
  >();
  for (const category of existingCategories) {
    categoryByKey.set(normalizeCategoryKey(category.nameEs), category);
    categoryByKey.set(normalizeCategoryKey(category.nameEn), category);
  }

  let categoriesCreated = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [...parsed.errors];

  const categoryOrder = new Map<string, number>();
  let nextCategorySort = existingCategories.length;

  for (const row of parsed.rows) {
    const key = normalizeCategoryKey(row.category);
    if (!categoryByKey.has(key)) {
      categoryOrder.set(key, nextCategorySort++);
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const [key, sortOrder] of categoryOrder) {
      const sample = parsed.rows.find(
        (row) => normalizeCategoryKey(row.category) === key,
      );
      if (!sample) continue;

      const names = categoryMetaByKey.get(key) ?? resolveCategoryImportNames(sample.category);

      const category = await tx.category.create({
        data: {
          nameEs: names.nameEs,
          nameEn: names.nameEn,
          nameDe: names.nameDe,
          sortOrder,
        },
      });
      categoryByKey.set(key, category);
      categoriesCreated++;
    }

    for (const category of existingCategories) {
      const key = normalizeCategoryKey(category.nameEs);
      const names = categoryMetaByKey.get(key);
      if (!names) continue;

      const updates: { nameEn?: string; nameDe?: string } = {};
      if (names.nameEn && names.nameEn !== category.nameEn) {
        updates.nameEn = names.nameEn;
      }
      if (names.nameDe && names.nameDe !== category.nameDe) {
        updates.nameDe = names.nameDe;
      }
      if (Object.keys(updates).length === 0) continue;

      await tx.category.update({
        where: { id: category.id },
        data: updates,
      });
    }

    const existingProducts = await tx.product.findMany({
      select: {
        id: true,
        categoryId: true,
        nameEs: true,
        nameEn: true,
      },
    });

    const productById = new Map(existingProducts.map((product) => [product.id, product]));
    const productByCategoryAndName = new Map<string, { id: string }>();
    for (const product of existingProducts) {
      productByCategoryAndName.set(
        `${product.categoryId}:${normalizeCategoryKey(product.nameEs)}`,
        { id: product.id },
      );
    }

    for (const row of parsed.rows) {
      try {
        const category = categoryByKey.get(normalizeCategoryKey(row.category));
        if (!category) {
          errors.push({
            row: row.rowNumber,
            message: `"${row.nameEs}": category not found`,
          });
          skipped++;
          continue;
        }

        const existingBySku = row.sku ? productById.get(row.sku) : undefined;
        const existing = existingBySku
          ? { id: existingBySku.id }
          : productByCategoryAndName.get(
              `${category.id}:${normalizeCategoryKey(row.nameEs)}`,
            );

        if (existing) {
          if (!updateExisting) {
            skipped++;
            continue;
          }

          await tx.product.update({
            where: { id: existing.id },
            data: {
              nameEs: row.nameEs,
              nameEn: row.nameEn,
              price: formatDecimal(row.price),
              ...(row.taxRate !== null && { taxRate: formatDecimal(row.taxRate) }),
              isActive: row.isActive,
              posOnly: row.posOnly,
              sortOrder: row.sortOrder,
            },
          });
          updated++;
          continue;
        }

        const createdProduct = await tx.product.create({
          data: {
            ...(row.sku ? { id: row.sku } : {}),
            categoryId: category.id,
            nameEs: row.nameEs,
            nameEn: row.nameEn,
            price: formatDecimal(row.price),
            taxRate: formatDecimal(row.taxRate ?? defaultTaxRate),
            isActive: row.isActive,
            posOnly: row.posOnly,
            sortOrder: row.sortOrder,
          },
        });
        productByCategoryAndName.set(
          `${category.id}:${normalizeCategoryKey(row.nameEs)}`,
          { id: createdProduct.id },
        );
        productById.set(createdProduct.id, createdProduct);
        created++;
      } catch {
        errors.push({
          row: row.rowNumber,
          message: `"${row.nameEs}": could not save`,
        });
        skipped++;
      }
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/menu-cards");
  void notifyWebsiteCatalogSync();

  return {
    success: true,
    created,
    updated,
    skipped,
    categoriesCreated,
    errors,
  };
}

export async function previewProductImport(buffer: ArrayBuffer) {
  await requireSuperadmin();
  const parsed = parseProductImportWorkbook(buffer);
  const categories = [
    ...new Set(parsed.rows.map((row) => row.category.trim())),
  ].sort();
  return {
    rowCount: parsed.rows.length,
    categories,
    errors: parsed.errors,
  };
}
