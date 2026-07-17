"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDecimal } from "@/lib/calculations";
import { incrementCardReference, isValidCardReference } from "@/lib/card-reference";
import { calculateSplitBillSummaries } from "@/lib/split-bill";
import type { CartItem } from "@/stores/pos-store";
import { Banknote, CreditCard, Mail, Pencil } from "lucide-react";
import { EditPayableTotalDialog } from "@/components/pos/edit-payable-total-dialog";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  isSplitBill?: boolean;
  splitCount?: number;
  paidSplitIndices?: number[];
  initialSplitIndex?: number | null;
  items?: CartItem[];
  discountTotal?: number;
  receiptEmailEnabled?: boolean;
  suggestedCardReference?: string | null;
  onManualCardReferenceChange?: (reference: string) => void;
  onAdjustTotal?: (total: number, splitIndex?: number | null) => Promise<void>;
  onPay: (
    method: "CASH" | "CARD",
    options?: {
      cardReference?: string;
      customerEmail?: string;
      amountTendered?: number;
      splitIndex?: number;
    },
  ) => void;
  loading?: boolean;
}

function parseMoneyInput(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  isSplitBill = false,
  splitCount = 2,
  paidSplitIndices = [],
  initialSplitIndex = null,
  items = [],
  discountTotal = 0,
  receiptEmailEnabled,
  suggestedCardReference = null,
  onManualCardReferenceChange,
  onAdjustTotal,
  onPay,
  loading,
}: PaymentDialogProps) {
  const t = useTranslations("employee");
  const tp = useTranslations("pos");
  const tc = useTranslations("common");
  const [showCardForm, setShowCardForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [editTotalOpen, setEditTotalOpen] = useState(false);
  const [cardReference, setCardReference] = useState("");
  const [cardReferenceEdited, setCardReferenceEdited] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [selectedSplitIndex, setSelectedSplitIndex] = useState(0);

  const splitSummaries = useMemo(() => {
    if (!isSplitBill) return [];
    return calculateSplitBillSummaries(items, splitCount, discountTotal);
  }, [isSplitBill, items, splitCount, discountTotal]);

  const unpaidSplits = useMemo(
    () => splitSummaries.filter((summary) => !paidSplitIndices.includes(summary.splitIndex)),
    [splitSummaries, paidSplitIndices],
  );

  const activeSplitIndex = isSplitBill
    ? (unpaidSplits.some((summary) => summary.splitIndex === selectedSplitIndex)
        ? selectedSplitIndex
        : (unpaidSplits[0]?.splitIndex ?? 0))
    : null;

  const payableTotal = isSplitBill
    ? (splitSummaries.find((summary) => summary.splitIndex === activeSplitIndex)?.total ?? 0)
    : total;

  useEffect(() => {
    if (!open) {
      setShowCardForm(false);
      setShowCashForm(false);
      setCardReference("");
      setCardReferenceEdited(false);
      setCustomerEmail("");
      setAmountReceived("");
      setSelectedSplitIndex(0);
      setEditTotalOpen(false);
      return;
    }
    if (isSplitBill && initialSplitIndex != null) {
      setSelectedSplitIndex(initialSplitIndex);
    }
  }, [open, isSplitBill, initialSplitIndex]);

  useEffect(() => {
    if (!open || !isSplitBill) return;
    if (unpaidSplits.length === 0) return;
    if (!unpaidSplits.some((summary) => summary.splitIndex === selectedSplitIndex)) {
      setSelectedSplitIndex(unpaidSplits[0]!.splitIndex);
    }
  }, [open, isSplitBill, unpaidSplits, selectedSplitIndex]);

  useEffect(() => {
    if (showCashForm) {
      setAmountReceived(payableTotal.toFixed(2));
    }
  }, [showCashForm, payableTotal]);

  const tendered = parseMoneyInput(amountReceived);
  const changeDue = useMemo(() => {
    if (tendered == null) return null;
    return formatDecimal(Math.max(0, tendered - payableTotal));
  }, [tendered, payableTotal]);

  const canConfirmCash =
    tendered != null && tendered >= payableTotal && !loading && payableTotal > 0;

  const handleClose = (value: boolean) => {
    onOpenChange(value);
  };

  const payOptions = (amountTendered?: number) => ({
    cardReference: cardReference.trim() || undefined,
    customerEmail:
      receiptEmailEnabled && customerEmail.trim() ? customerEmail.trim() : undefined,
    amountTendered,
    splitIndex: isSplitBill ? activeSplitIndex ?? undefined : undefined,
  });

  const commitManualCardReference = () => {
    const trimmed = cardReference.trim();
    if (!trimmed || !cardReferenceEdited || !onManualCardReferenceChange) return;
    if (!isValidCardReference(trimmed)) return;
    if (trimmed === suggestedCardReference) return;
    onManualCardReferenceChange(trimmed);
  };

  const handleCardReferenceBlur = () => {
    commitManualCardReference();
  };

  const handleCardPay = () => {
    if (!showCardForm) {
      setShowCashForm(false);
      setShowCardForm(true);
      if (!cardReferenceEdited && suggestedCardReference) {
        setCardReference(suggestedCardReference);
      }
      return;
    }
    commitManualCardReference();
    onPay("CARD", payOptions());
  };

  const handleCashStart = () => {
    setShowCardForm(false);
    setShowCashForm(true);
    setAmountReceived(payableTotal.toFixed(2));
  };

  const handleCashConfirm = () => {
    if (!canConfirmCash || tendered == null) return;
    onPay("CASH", payOptions(tendered));
  };

  const handleAdjustTotal = async (nextTotal: number) => {
    if (!onAdjustTotal) return;
    await onAdjustTotal(nextTotal, isSplitBill ? activeSplitIndex : null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSplitBill ? tp("paySplitTitle") : tc("total")}
          </DialogTitle>
        </DialogHeader>

        {isSplitBill ? (
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-muted-foreground">
              {tp("splitNumber", { number: (activeSplitIndex ?? 0) + 1 })}
            </p>
            {unpaidSplits.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tp("allSplitsPaid")}</p>
            ) : null}
          </div>
        ) : null}

        <p className="text-center text-3xl font-bold">
          <CurrencyDisplay amount={payableTotal} />
        </p>

        {onAdjustTotal && payableTotal > 0 ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={loading || showCashForm || showCardForm}
              onClick={() => setEditTotalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              {tp("editTotal")}
            </Button>
          </div>
        ) : null}

        <EditPayableTotalDialog
          open={editTotalOpen}
          currentTotal={payableTotal}
          splitNumber={isSplitBill ? (activeSplitIndex ?? 0) + 1 : null}
          loading={loading}
          onOpenChange={setEditTotalOpen}
          onConfirm={handleAdjustTotal}
        />

        {receiptEmailEnabled && !isSplitBill ? (
          <div className="space-y-2">
            <Label htmlFor="receipt-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("receiptEmailOptional")}
            </Label>
            <Input
              id="receipt-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder={t("receiptEmailPlaceholder")}
              className="min-h-11"
              autoComplete="email"
            />
          </div>
        ) : null}

        {showCashForm ? (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-2">
              <Label htmlFor="cash-received">{t("amountReceived")}</Label>
              <Input
                id="cash-received"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="min-h-11 text-lg"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAmountReceived(payableTotal.toFixed(2))}
              >
                {t("exactAmount")}
              </Button>
              {[5, 10, 20, 50].map((note) => (
                <Button
                  key={note}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmountReceived(note.toFixed(2))}
                >
                  {note} €
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("changeDue")}</span>
              <span className="text-lg font-semibold">
                {changeDue != null ? (
                  <CurrencyDisplay amount={changeDue} />
                ) : (
                  tc("empty")
                )}
              </span>
            </div>
            {tendered != null && tendered < payableTotal ? (
              <p className="text-sm text-destructive">{t("insufficientCash")}</p>
            ) : null}
          </div>
        ) : null}

        {showCardForm ? (
          <div className="space-y-2">
            <Label htmlFor="card-ref">{t("cardReference")}</Label>
            <Input
              id="card-ref"
              value={cardReference}
              onChange={(e) => {
                setCardReferenceEdited(true);
                setCardReference(e.target.value);
              }}
              onBlur={handleCardReferenceBlur}
              placeholder={suggestedCardReference ?? t("cardReferencePlaceholder")}
              className="min-h-11"
              autoFocus
            />
            {cardReferenceEdited &&
            cardReference.trim() &&
            isValidCardReference(cardReference) ? (
              <p className="text-xs text-muted-foreground">
                {tp("cardReferenceNextHint", {
                  number:
                    incrementCardReference(cardReference.trim()) ??
                    cardReference.trim(),
                })}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {showCashForm ? (
            <>
              <Button
                type="button"
                className="min-h-11 w-full gap-2"
                disabled={!canConfirmCash}
                onClick={handleCashConfirm}
              >
                <Banknote className="h-5 w-5" />
                {t("confirmCashPayment")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 w-full"
                disabled={loading}
                onClick={() => setShowCashForm(false)}
              >
                {tc("back")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                className="min-h-11 w-full gap-2"
                disabled={loading || payableTotal <= 0}
                onClick={handleCashStart}
              >
                <Banknote className="h-5 w-5" />
                {t("payCash")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full gap-2"
                disabled={loading || payableTotal <= 0}
                onClick={handleCardPay}
              >
                <CreditCard className="h-5 w-5" />
                {showCardForm ? tc("confirm") : t("payCard")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
