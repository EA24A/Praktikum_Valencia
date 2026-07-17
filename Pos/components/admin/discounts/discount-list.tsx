"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { DiscountType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { intlLocaleForUi } from "@/lib/ui-locale";
import {
  toggleDiscountActive,
  type PosDiscount,
} from "@/lib/actions/discounts";

interface DiscountListProps {
  discounts: PosDiscount[];
  onEdit: (discount: PosDiscount) => void;
  onToggle: (discount: PosDiscount) => void;
}

function formatValue(type: DiscountType, value: number, locale: string) {
  if (type === "PERCENTAGE") {
    return `${value}%`;
  }
  return new Intl.NumberFormat(intlLocaleForUi(locale), {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function DiscountList({
  discounts,
  onEdit,
  onToggle,
}: DiscountListProps) {
  const t = useTranslations("discounts");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleToggle(discount: PosDiscount, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleDiscountActive(discount.id, isActive);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        isActive ? t("activatedSuccess") : t("deactivatedSuccess"),
      );
      onToggle(result.discount);
    });
  }

  const typeLabel = (discountType: DiscountType) => {
    switch (discountType) {
      case "PERCENTAGE":
        return t("typePercentage");
      case "FIXED_AMOUNT":
        return t("typeFixedAmount");
      case "COMBO":
        return t("typeCombo");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("discountList")}</CardTitle>
      </CardHeader>
      <CardContent>
        {discounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noDiscounts")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("nameEs")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("value")}</TableHead>
                <TableHead>{t("usageCount")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => {
                const displayName =
                  locale === "es" ? discount.nameEs : discount.nameEn;

                return (
                  <TableRow
                    key={discount.id}
                    className={!discount.isActive ? "opacity-60" : undefined}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {locale === "es" ? discount.nameEn : discount.nameEs}
                        </p>
                        {discount.requiresCashPayment && (
                          <Badge variant="outline" className="text-xs">
                            {t("cashOnly")}
                          </Badge>
                        )}
                        {discount.isCombo && (
                          <Badge variant="secondary" className="text-xs">
                            {t("comboBadge", {
                              count: discount.comboProducts.length,
                            })}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{typeLabel(discount.type)}</TableCell>
                    <TableCell>
                      {discount.type === "COMBO" ? (
                        <CurrencyDisplay amount={discount.value} />
                      ) : (
                        formatValue(discount.type, discount.value, locale)
                      )}
                    </TableCell>
                    <TableCell>
                      {t("timesUsed", { count: discount.usageCount })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={discount.isActive}
                          onCheckedChange={(checked) =>
                            handleToggle(discount, checked)
                          }
                          disabled={isPending}
                          aria-label={
                            discount.isActive
                              ? tCommon("active")
                              : tCommon("inactive")
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {discount.isActive
                            ? tCommon("active")
                            : tCommon("inactive")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(discount)}
                        disabled={isPending}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">{tCommon("edit")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
