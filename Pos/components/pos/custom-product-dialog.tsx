"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { Textarea } from "@/components/ui/textarea";
import { TaxRateSelect } from "@/components/admin/products/tax-rate-select";

export interface CustomProductInput {
  name: string;
  price: number;
  taxRate: number;
  reason: string;
}

interface CustomProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CustomProductInput) => void;
  loading?: boolean;
  defaultTaxRate?: number;
}

export function CustomProductDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  defaultTaxRate = 21,
}: CustomProductDialogProps) {
  const tp = useTranslations("pos");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [taxRate, setTaxRate] = useState(defaultTaxRate);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setPrice("");
      setTaxRate(defaultTaxRate);
      setReason("");
      setError(null);
    }
  }, [open, defaultTaxRate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedReason = reason.trim();
    const parsedPrice = Number.parseFloat(price.replace(",", "."));

    if (!trimmedName) {
      setError(tp("customProductNameRequired"));
      return;
    }
    if (!trimmedReason) {
      setError(tp("customProductReasonRequired"));
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError(tp("customProductPriceInvalid"));
      return;
    }
    if (taxRate < 0 || taxRate > 100 || Number.isNaN(taxRate)) {
      setError(tp("customProductTaxInvalid"));
      return;
    }

    setError(null);
    onSubmit({
      name: trimmedName,
      price: parsedPrice,
      taxRate,
      reason: trimmedReason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{tp("customProductTitle")}</DialogTitle>
            <DialogDescription>{tp("customProductDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-product-name">{tp("customProductName")}</Label>
              <Input
                id="custom-product-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={tp("customProductNamePlaceholder")}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-product-price">{tp("customProductPrice")}</Label>
              <Input
                id="custom-product-price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder={tc("pricePlaceholder")}
                disabled={loading}
              />
            </div>

            <TaxRateSelect
              id="custom-product-tax"
              value={taxRate}
              onChange={setTaxRate}
              disabled={loading}
            />

            <div className="space-y-2">
              <Label htmlFor="custom-product-reason">{tp("customProductReason")}</Label>
              <Textarea
                id="custom-product-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={tp("customProductReasonPlaceholder")}
                disabled={loading}
                rows={3}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tp("customProductAdding") : tp("customProductAdd")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
