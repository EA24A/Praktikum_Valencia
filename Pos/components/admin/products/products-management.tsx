"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CategoryPanel } from "@/components/admin/products/category-panel";
import { ProductPanel } from "@/components/admin/products/product-panel";
import type { PosCategory, PosProduct } from "@/types";

interface ProductsManagementProps {
  initialCategories: PosCategory[];
  initialProducts: PosProduct[];
}

export function ProductsManagement({
  initialCategories,
  initialProducts,
}: ProductsManagementProps) {
  const t = useTranslations("products");
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const categoriesWithProducts = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        products: products.filter(
          (product) => product.categoryId === category.id,
        ),
      })),
    [categories, products],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <CategoryPanel
          categories={categoriesWithProducts}
          selectedCategoryId={selectedCategoryId}
          onCategoriesChange={setCategories}
          onSelectCategory={setSelectedCategoryId}
        />
        <ProductPanel
          categories={categories}
          products={products}
          selectedCategoryId={selectedCategoryId}
          onProductsChange={setProducts}
        />
      </div>
    </div>
  );
}
