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

interface EditItemPriceDialogProps {
  open: boolean;
  itemName: string;
  currentPrice: number;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (unitPrice: number) => void;
}

export function EditItemPriceDialog({
  open,
  itemName,
  currentPrice,
  loading,
  onOpenChange,
  onConfirm,
}: EditItemPriceDialogProps) {
  const tp = useTranslations("pos");
  const tc = useTranslations("common");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPrice(currentPrice.toFixed(2));
      setError(null);
    }
  }, [open, currentPrice]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number.parseFloat(price.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0.01) {
      setError(tp("changePriceInvalid"));
      return;
    }
    const rounded = Math.round(parsed * 100) / 100;
    onConfirm(rounded);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tp("changePriceTitle")}</DialogTitle>
          <DialogDescription>{tp("changePriceDescription", { name: itemName })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-item-price">{tp("unitPrice")}</Label>
            <Input
              id="edit-item-price"
              type="text"
              inputMode="decimal"
              autoFocus
              value={price}
              disabled={loading}
              placeholder="0.00"
              onChange={(event) => {
                setPrice(event.target.value);
                setError(null);
              }}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {tp("changePriceConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
