"use client";

import { useLocale } from "next-intl";
import { intlLocaleForUi } from "@/lib/ui-locale";
import { formatCurrency } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number | string;
  className?: string;
}

export function CurrencyDisplay({ amount, className }: CurrencyDisplayProps) {
  const locale = useLocale();
  const intlLocale = intlLocaleForUi(locale);

  return (
    <span className={cn("tabular-nums", className)}>
      {formatCurrency(amount, intlLocale)}
    </span>
  );
}
