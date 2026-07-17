"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CurrencyDisplay } from "@/components/shared/currency-display";
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
import type { OrderDetail } from "@/lib/actions/orders";

interface RefundDialogProps {
  order: OrderDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RefundDialog({ order, open, onOpenChange, onSuccess }: RefundDialogProps) {
  const t = useTranslations("orders");
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("full");
      setAmount("");
      setReason("");
    }
  }, [open, order?.id]);

  if (!order) {
    return null;
  }

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error(t("errors.reason_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const body =
        mode === "full"
          ? { full: true, reason: reason.trim() }
          : { amount: Number.parseFloat(amount), reason: reason.trim() };

      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        toast.error(t(`errors.${payload.error?.toLowerCase() ?? "generic"}`));
        return;
      }

      toast.success(t("refundSuccess"));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("issueRefund")}</DialogTitle>
          <DialogDescription>
            {t("remainingRefundable")}:{" "}
            <CurrencyDisplay amount={order.remainingRefundable} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "full" ? "default" : "outline"}
              onClick={() => setMode("full")}
            >
              {t("fullRefund")}
            </Button>
            <Button
              type="button"
              variant={mode === "partial" ? "default" : "outline"}
              onClick={() => setMode("partial")}
            >
              {t("partialRefund")}
            </Button>
          </div>

          {mode === "partial" && (
            <div className="space-y-2">
              <Label htmlFor="refundAmount">{t("refundAmount")}</Label>
              <Input
                id="refundAmount"
                type="number"
                min="0.01"
                max={order.remainingRefundable}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={t("refundAmountPlaceholder")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="refundReason">{t("refundReason")}</Label>
            <Textarea
              id="refundReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("refundReasonPlaceholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || order.remainingRefundable <= 0}>
            {t("confirmRefund")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
