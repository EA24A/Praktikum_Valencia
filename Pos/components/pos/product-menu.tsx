"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { matchesCatalogSearch } from "@/lib/catalog/catalog-search";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { PenLine, Search, X } from "lucide-react";
import { ProductCard } from "@/components/pos/product-card";
import {
  CustomProductDialog,
  type CustomProductInput,
} from "@/components/pos/custom-product-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PosCategory, PosProduct } from "@/types";

interface ProductMenuProps {
  categories: PosCategory[];
  onAddProduct: (product: PosProduct) => void;
  onAddCustomProduct: (input: CustomProductInput) => void | Promise<void>;
  disabled?: boolean;
}

export function ProductMenu({
  categories,
  onAddProduct,
  onAddCustomProduct,
  disabled,
}: ProductMenuProps) {
  const t = useTranslations("employee");
  const tp = useTranslations("pos");
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customSubmitting, setCustomSubmitting] = useState(false);

  const currentId = activeCategory || categories[0]?.id || "";
  const searchQueryTrimmed = searchQuery.trim();
  const isSearching = searchQueryTrimmed.length > 0;

  const visibleProducts = useMemo(() => {
    if (categories.length === 0) return [];

    if (isSearching) {
      const results: PosProduct[] = [];
      for (const category of categories) {
        for (const product of category.products) {
          if (matchesCatalogSearch(product, searchQueryTrimmed)) {
            results.push(product);
          }
        }
      }
      return results;
    }

    return (
      categories.find((category) => category.id === currentId)?.products ??
      categories[0]?.products ??
      []
    );
  }, [categories, currentId, isSearching, searchQueryTrimmed]);

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t("menu")}
      </div>
    );
  }

  const handleCustomSubmit = async (input: CustomProductInput) => {
    setCustomSubmitting(true);
    try {
      await onAddCustomProduct(input);
      setCustomOpen(false);
    } finally {
      setCustomSubmitting(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
  };

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden bg-muted/20">
        <div className="border-b bg-background p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={tp("searchDishes")}
              className="min-h-11 pl-9 pr-10"
              disabled={disabled}
              aria-label={tp("searchDishes")}
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={tp("clearSearch")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="border-b bg-background p-2">
          <div className="flex flex-wrap gap-2" key={locale}>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategorySelect(category.id)}
                className={cn(
                  "min-h-11 max-w-full rounded-lg px-3 py-2 text-sm font-medium leading-snug transition-colors",
                  "[overflow-wrap:anywhere]",
                  !isSearching && currentId === category.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {localizedCatalogName(category, locale)}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-x-hidden overflow-y-scroll overscroll-y-contain p-3 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
          <div className="mb-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full gap-2 border-dashed"
              disabled={disabled}
              onClick={() => setCustomOpen(true)}
            >
              <PenLine className="h-4 w-4" />
              {tp("customProduct")}
            </Button>
          </div>

          {isSearching && (
            <p className="mb-3 text-sm text-muted-foreground">
              {tp("searchResults", { count: visibleProducts.length })}
            </p>
          )}

          {visibleProducts.length === 0 ? (
            <div className="flex min-h-[8rem] flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <p className="text-base font-medium">{tp("noSearchResults")}</p>
              <p className="text-sm">{tp("noSearchResultsHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={onAddProduct}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CustomProductDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        onSubmit={handleCustomSubmit}
        loading={customSubmitting || disabled}
      />
    </>
  );
}
