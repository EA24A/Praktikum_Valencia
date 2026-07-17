import { prisma } from "@/lib/prisma";
import { isCustomPlaceholderProduct } from "@/lib/products/custom-product-placeholder";

export type CatalogSyncProduct = {
  id: string;
  categoryId: string;
  categoryNameEs: string;
  categoryNameEn: string;
  nameEs: string;
  nameEn: string;
  price: number;
  taxRate: number;
  isActive: boolean;
  posOnly: boolean;
  sortOrder: number;
};

export type CatalogSyncCategory = {
  id: string;
  nameEs: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
};

export type CatalogSyncPayload = {
  version: 1;
  syncedAt: string;
  categories: CatalogSyncCategory[];
  products: CatalogSyncProduct[];
};

export async function buildCatalogSyncPayload(): Promise<CatalogSyncPayload> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return {
    version: 1,
    syncedAt: new Date().toISOString(),
    categories: categories
      .filter(
        (category) => !isCustomPlaceholderProduct(category.nameEs, category.nameEn),
      )
      .map((category) => ({
        id: category.id,
        nameEs: category.nameEs,
        nameEn: category.nameEn,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      })),
    products: categories
      .filter(
        (category) => !isCustomPlaceholderProduct(category.nameEs, category.nameEn),
      )
      .flatMap((category) =>
        category.products
          .filter(
            (product) =>
              !isCustomPlaceholderProduct(product.nameEs, product.nameEn),
          )
          .map((product) => ({
            id: product.id,
            categoryId: category.id,
            categoryNameEs: category.nameEs,
            categoryNameEn: category.nameEn,
            nameEs: product.nameEs,
            nameEn: product.nameEn,
            price: Number(product.price),
            taxRate: Number(product.taxRate),
            isActive: product.isActive,
            posOnly: product.posOnly,
            sortOrder: product.sortOrder,
          })),
      ),
  };
}
