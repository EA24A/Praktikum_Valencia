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
import { TaxRateSelect } from "@/components/admin/products/tax-rate-select";
import { bulkUpdateProductTaxRates } from "@/lib/actions/products";
import type { PosProduct } from "@/types";

interface BulkTaxRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: (products: PosProduct[]) => void;
}

export function BulkTaxRateDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkTaxRateDialogProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [taxRate, setTaxRate] = useState(21);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTaxRate(21);
    }
  }, [open]);

  const handleApply = async () => {
    if (taxRate < 0 || taxRate > 100 || Number.isNaN(taxRate)) {
      toast.error(t("bulkTaxInvalid"));
      return;
    }

    setSaving(true);
    try {
      const result = await bulkUpdateProductTaxRates(selectedIds, taxRate);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onSuccess(result.products);
      toast.success(t("bulkTaxSuccess", { count: result.count }));
      onOpenChange(false);
    } catch {
      toast.error(t("bulkTaxError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("bulkTaxTitle")}</DialogTitle>
          <DialogDescription>
            {t("bulkTaxDescription", { count: selectedIds.length })}
          </DialogDescription>
        </DialogHeader>

        <TaxRateSelect
          id="bulk-tax-rate"
          value={taxRate}
          onChange={setTaxRate}
          disabled={saving}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="button" onClick={handleApply} disabled={saving}>
            {saving ? t("bulkTaxApplying") : t("bulkTaxApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
