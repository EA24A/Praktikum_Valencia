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
import { bulkUpdateProductPrices } from "@/lib/actions/products";
import type { PosProduct } from "@/types";

interface BulkPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: (products: PosProduct[]) => void;
}

export function BulkPriceDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkPriceDialogProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPrice("");
    }
  }, [open]);

  const handleApply = async () => {
    const parsed = Number.parseFloat(price.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error(t("bulkPriceInvalid"));
      return;
    }

    setSaving(true);
    try {
      const result = await bulkUpdateProductPrices(selectedIds, parsed);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onSuccess(result.products);
      toast.success(t("bulkPriceSuccess", { count: result.count }));
      onOpenChange(false);
    } catch {
      toast.error(t("bulkPriceError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("bulkPriceTitle")}</DialogTitle>
          <DialogDescription>
            {t("bulkPriceDescription", { count: selectedIds.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="bulk-product-price">{t("price")}</Label>
          <Input
            id="bulk-product-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            disabled={saving}
            placeholder={t("pricePlaceholder")}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {tc("cancel")}
          </Button>
          <Button type="button" onClick={handleApply} disabled={saving}>
            {saving ? t("bulkPriceApplying") : t("bulkPriceApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
