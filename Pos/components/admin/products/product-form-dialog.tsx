"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { TaxRateSelect } from "@/components/admin/products/tax-rate-select";
import { ComboProductPicker } from "@/components/admin/discounts/combo-product-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { parseComboComponentGroups } from "@/lib/combos/auto-combo";
import type { PosCategory, PosProduct } from "@/types";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: PosProduct | null;
  categories: PosCategory[];
  allProducts: PosProduct[];
  defaultCategoryId?: string;
  onSuccess: (product: PosProduct) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  allProducts,
  defaultCategoryId,
  onSuccess,
}: ProductFormDialogProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const isEditing = Boolean(product);
  const activeCategories = categories.filter((category) => category.isActive);

  const [categoryId, setCategoryId] = useState("");
  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameDe, setNameDe] = useState("");
  const [price, setPrice] = useState("");
  const [taxRate, setTaxRate] = useState(21);
  const [posOnly, setPosOnly] = useState(false);
  const [comboGroupA, setComboGroupA] = useState<string[]>([]);
  const [comboGroupAQty, setComboGroupAQty] = useState(1);
  const [comboGroupB, setComboGroupB] = useState<string[]>([]);
  const [comboGroupBQty, setComboGroupBQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comboPickerProducts = allProducts
    .filter((item) => item.isActive && item.id !== product?.id)
    .map((item) => ({
      id: item.id,
      nameEs: item.nameEs,
      nameEn: item.nameEn,
      nameDe: item.nameDe,
      price: item.price,
    }));

  useEffect(() => {
    if (open) {
      const active = categories.filter((category) => category.isActive);
      setCategoryId(
        product?.categoryId ?? defaultCategoryId ?? active[0]?.id ?? "",
      );
      setNameEs(product?.nameEs ?? "");
      setNameEn(product?.nameEn ?? "");
      setNameDe(product?.nameDe ?? "");
      setPrice(product ? String(product.price) : "");
      setTaxRate(product?.taxRate ?? 21);
      setPosOnly(product?.posOnly ?? false);
      const parsedGroups = product
        ? parseComboComponentGroups(product.comboComponentGroups) ??
          (product.comboComponentIds?.length === 2
            ? product.comboComponentIds.map((id) => ({ productIds: [id], quantity: 1 }))
            : null)
        : null;
      setComboGroupA(parsedGroups?.[0]?.productIds ?? []);
      setComboGroupAQty(parsedGroups?.[0]?.quantity ?? 1);
      setComboGroupB(parsedGroups?.[1]?.productIds ?? []);
      setComboGroupBQty(parsedGroups?.[1]?.quantity ?? 1);
    }
  }, [open, product, defaultCategoryId, categories]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice)) {
      toast.error(t("invalidPrice"));
      return;
    }

    const hasComboSetup = comboGroupA.length > 0 || comboGroupB.length > 0;
    if (hasComboSetup && (comboGroupA.length === 0 || comboGroupB.length === 0)) {
      toast.error(t("comboGroupsIncomplete"));
      return;
    }

    const groupAQty = Math.max(1, Math.floor(comboGroupAQty));
    const groupBQty = Math.max(1, Math.floor(comboGroupBQty));

    setIsSubmitting(true);

    const payload = {
      categoryId,
      nameEs,
      nameEn,
      nameDe,
      price: parsedPrice,
      taxRate,
      posOnly,
      comboComponentGroups:
        comboGroupA.length > 0 && comboGroupB.length > 0
          ? [
              { productIds: comboGroupA, quantity: groupAQty },
              { productIds: comboGroupB, quantity: groupBQty },
            ]
          : null,
    };

    const result = isEditing && product
      ? await updateProduct({ id: product.id, ...payload })
      : await createProduct(payload);

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? t("productUpdated") : t("productCreated"));
    onSuccess(result.product);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("editProduct") : t("addProduct")}
            </DialogTitle>
            <DialogDescription>{t("productFormDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => setCategoryId(value ?? "")}
                disabled={activeCategories.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nameEs} / {category.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name-es">{t("nameEs")}</Label>
              <Input
                id="product-name-es"
                value={nameEs}
                onChange={(event) => setNameEs(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name-en">{t("nameEn")}</Label>
              <Input
                id="product-name-en"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name-de">{t("nameDe")}</Label>
              <Input
                id="product-name-de"
                value={nameDe}
                onChange={(event) => setNameDe(event.target.value)}
                placeholder={t("nameDePlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("nameDeHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">{t("price")}</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </div>

            <TaxRateSelect
              id="product-tax-rate"
              value={taxRate}
              onChange={setTaxRate}
            />

            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id="product-pos-only"
                checked={posOnly}
                onCheckedChange={(checked) => setPosOnly(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="product-pos-only">{t("posOnly")}</Label>
                <p className="text-xs text-muted-foreground">{t("posOnlyDescription")}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-1">
                <Label>{t("comboComponents")}</Label>
                <p className="text-xs text-muted-foreground">{t("comboComponentsHint")}</p>
              </div>
              <ComboProductPicker
                products={comboPickerProducts}
                selectedIds={comboGroupA}
                onChange={setComboGroupA}
                disabled={isSubmitting}
                label={t("comboGroupDrink")}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="combo-group-a-qty" className="shrink-0 text-sm">
                  {t("comboGroupQuantity")}
                </Label>
                <Input
                  id="combo-group-a-qty"
                  type="number"
                  min={1}
                  step={1}
                  className="w-24"
                  value={comboGroupAQty}
                  onChange={(event) =>
                    setComboGroupAQty(Math.max(1, Number(event.target.value) || 1))
                  }
                  disabled={isSubmitting || comboGroupA.length === 0}
                />
              </div>
              <ComboProductPicker
                products={comboPickerProducts}
                selectedIds={comboGroupB}
                onChange={setComboGroupB}
                disabled={isSubmitting}
                label={t("comboGroupSecond")}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="combo-group-b-qty" className="shrink-0 text-sm">
                  {t("comboGroupQuantity")}
                </Label>
                <Input
                  id="combo-group-b-qty"
                  type="number"
                  min={1}
                  step={1}
                  className="w-24"
                  value={comboGroupBQty}
                  onChange={(event) =>
                    setComboGroupBQty(Math.max(1, Number(event.target.value) || 1))
                  }
                  disabled={isSubmitting || comboGroupB.length === 0}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || activeCategories.length === 0}
            >
              {isSubmitting ? tCommon("loading") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
