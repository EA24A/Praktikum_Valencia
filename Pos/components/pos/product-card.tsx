"use client";

import { useLocale } from "next-intl";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { Plus } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import type { PosProduct } from "@/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: PosProduct;
  onAdd: (product: PosProduct) => void;
  disabled?: boolean;
}

export function ProductCard({ product, onAdd, disabled }: ProductCardProps) {
  const locale = useLocale();
  const name = localizedCatalogName(product, locale);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(product)}
      className={cn(
        "group relative flex min-h-[96px] flex-col items-start justify-between rounded-xl border-2 border-transparent bg-card p-3 text-left shadow-sm transition-all",
        "hover:border-primary hover:bg-primary/5 hover:shadow-md active:scale-[0.97]",
        "disabled:pointer-events-none disabled:opacity-40",
        "touch-manipulation",
      )}
    >
      <span className="line-clamp-2 pr-6 text-sm font-semibold leading-snug">{name}</span>
      <CurrencyDisplay amount={product.price} className="text-lg font-bold text-primary" />
      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-0">
        <Plus className="h-4 w-4" />
      </span>
    </button>
  );
}
