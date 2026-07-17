"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { DiscountType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDiscount,
  updateDiscount,
  type ComboProductOption,
  type PosDiscount,
} from "@/lib/actions/discounts";
import { ComboProductPicker } from "./combo-product-picker";

interface DiscountFormProps {
  products: ComboProductOption[];
  editingDiscount?: PosDiscount | null;
  onSuccess: (discount: PosDiscount) => void;
  onCancelEdit?: () => void;
}

const DISCOUNT_TYPES: DiscountType[] = [
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "COMBO",
];

export function DiscountForm({
  products,
  editingDiscount,
  onSuccess,
  onCancelEdit,
}: DiscountFormProps) {
  const t = useTranslations("discounts");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [nameEs, setNameEs] = useState(editingDiscount?.nameEs ?? "");
  const [nameEn, setNameEn] = useState(editingDiscount?.nameEn ?? "");
  const [type, setType] = useState<DiscountType>(
    editingDiscount?.type ?? "PERCENTAGE",
  );
  const [value, setValue] = useState(
    editingDiscount ? String(editingDiscount.value) : "",
  );
  const [requiresCashPayment, setRequiresCashPayment] = useState(
    editingDiscount?.requiresCashPayment ?? false,
  );
  const [comboProducts, setComboProducts] = useState<string[]>(
    editingDiscount?.comboProducts ?? [],
  );

  const isEditing = Boolean(editingDiscount);

  function resetForm() {
    setNameEs("");
    setNameEn("");
    setType("PERCENTAGE");
    setValue("");
    setRequiresCashPayment(false);
    setComboProducts([]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedValue = parseFloat(value);
    if (Number.isNaN(parsedValue)) {
      toast.error(t("invalidValue"));
      return;
    }

    startTransition(async () => {
      const payload = {
        nameEs,
        nameEn,
        type,
        value: parsedValue,
        requiresCashPayment,
        comboProducts: type === "COMBO" ? comboProducts : [],
      };

      const result = isEditing
        ? await updateDiscount(editingDiscount!.id, payload)
        : await createDiscount(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? t("updatedSuccess") : t("createdSuccess"));
      onSuccess(result.discount);
      if (isEditing) {
        onCancelEdit?.();
      } else {
        resetForm();
      }
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

  const valueLabel =
    type === "COMBO"
      ? t("comboPrice")
      : type === "PERCENTAGE"
        ? t("valuePercent")
        : t("valueFixed");

  const valueHint =
    type === "COMBO"
      ? t("comboPriceHint")
      : type === "PERCENTAGE"
        ? t("valuePercentHint")
        : t("valueFixedHint");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? t("editDiscount") : t("addDiscount")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameEs">{t("nameEs")}</Label>
              <Input
                id="nameEs"
                value={nameEs}
                onChange={(e) => setNameEs(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameEn">{t("nameEn")}</Label>
              <Input
                id="nameEn"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("type")}</Label>
              <Select
                value={type}
                onValueChange={(next) => setType(next as DiscountType)}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) =>
                      value
                        ? typeLabel(value as DiscountType)
                        : t("selectType")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((discountType) => (
                    <SelectItem key={discountType} value={discountType}>
                      {typeLabel(discountType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">{valueLabel}</Label>
              <Input
                id="value"
                type="number"
                min={type === "PERCENTAGE" ? 0.01 : 0.01}
                max={type === "PERCENTAGE" ? 100 : undefined}
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">{valueHint}</p>
            </div>
          </div>

          {type === "COMBO" && (
            <ComboProductPicker
              products={products}
              selectedIds={comboProducts}
              onChange={setComboProducts}
              disabled={isPending}
              maxSelected={2}
            />
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="requiresCashPayment">{t("requiresCashPayment")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("requiresCashPaymentHint")}
              </p>
            </div>
            <Switch
              id="requiresCashPayment"
              checked={requiresCashPayment}
              onCheckedChange={setRequiresCashPayment}
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? tCommon("loading")
                : isEditing
                  ? tCommon("save")
                  : t("createDiscount")}
            </Button>
            {isEditing && onCancelEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEdit}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
