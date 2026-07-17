"use client";

import { useLocale, useTranslations } from "next-intl";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import type { ComboProductOption } from "@/lib/actions/discounts";
import { cn } from "@/lib/utils";

interface ComboProductPickerProps {
  products: ComboProductOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  maxSelected?: number;
  label?: string;
}

export function ComboProductPicker({
  products,
  selectedIds,
  onChange,
  disabled,
  maxSelected,
  label,
}: ComboProductPickerProps) {
  const t = useTranslations("discounts");
  const locale = useLocale();

  function toggleProduct(productId: string) {
    if (disabled) return;
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter((id) => id !== productId));
    } else if (maxSelected != null && selectedIds.length >= maxSelected) {
      return;
    } else {
      onChange([...selectedIds, productId]);
    }
  }

  function productName(product: ComboProductOption) {
    return localizedCatalogName(product, locale);
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noProductsAvailable")}</p>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label ?? t("comboProducts")}</Label>
      <ScrollArea className="h-48 rounded-lg border">
        <div className="space-y-1 p-2">
          {products.map((product) => {
            const checked = selectedIds.includes(product.id);
            return (
              <label
                key={product.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleProduct(product.id)}
                  disabled={
                    disabled ||
                    (!checked &&
                      maxSelected != null &&
                      selectedIds.length >= maxSelected)
                  }
                />
                <span className="flex-1 text-sm">{productName(product)}</span>
                <CurrencyDisplay
                  amount={product.price}
                  className="text-xs text-muted-foreground"
                />
              </label>
            );
          })}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">
        {t("selectedCount", { count: selectedIds.length })}
      </p>
    </div>
  );
}
