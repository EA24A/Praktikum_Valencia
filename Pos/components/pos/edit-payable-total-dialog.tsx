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

interface EditPayableTotalDialogProps {
  open: boolean;
  currentTotal: number;
  splitNumber?: number | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (total: number) => void;
}

export function EditPayableTotalDialog({
  open,
  currentTotal,
  splitNumber,
  loading,
  onOpenChange,
  onConfirm,
}: EditPayableTotalDialogProps) {
  const tp = useTranslations("pos");
  const tc = useTranslations("common");
  const [total, setTotal] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTotal(currentTotal.toFixed(2));
      setError(null);
    }
  }, [open, currentTotal]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number.parseFloat(total.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0.01) {
      setError(tp("changeTotalInvalid"));
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
          <DialogTitle>{tp("changeTotalTitle")}</DialogTitle>
          <DialogDescription>
            {splitNumber != null
              ? tp("changeTotalDescriptionSplit", { number: splitNumber })
              : tp("changeTotalDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-payable-total">{tc("total")}</Label>
            <Input
              id="edit-payable-total"
              type="text"
              inputMode="decimal"
              autoFocus
              value={total}
              disabled={loading}
              placeholder="0.00"
              onChange={(event) => {
                setTotal(event.target.value);
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
              {tp("changeTotalConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
