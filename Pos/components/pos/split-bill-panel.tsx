"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard, Euro, Minus, Plus } from "lucide-react";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EditItemPriceDialog } from "@/components/pos/edit-item-price-dialog";
import {
  buildDefaultItemAllocations,
  calculateSplitBillSummaries,
  type SplitAllocation,
  type SplitItemAssignment,
} from "@/lib/split-bill";
import type { CartItem } from "@/stores/pos-store";

interface SplitBillPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  splitCount: number;
  paidSplitIndices?: number[];
  discountTotal?: number;
  onPaySplit: (
    splitIndex: number,
    splitCount: number,
    assignments: SplitItemAssignment[],
  ) => void;
  onCancelSplit: () => void;
  onUpdatePrice: (itemId: string, unitPrice: number) => void;
  loading?: boolean;
}

function assignedTotal(allocations: SplitAllocation[]) {
  return allocations.reduce((sum, entry) => sum + entry.quantity, 0);
}

function setSplitQuantity(
  allocations: SplitAllocation[],
  splitIndex: number,
  quantity: number,
  maxTotal: number,
): SplitAllocation[] {
  return allocations.map((entry) => {
    if (entry.splitIndex !== splitIndex) return entry;
    const otherQty = allocations
      .filter((other) => other.splitIndex !== splitIndex)
      .reduce((sum, other) => sum + other.quantity, 0);
    const clamped = Math.max(0, Math.min(quantity, maxTotal - otherQty));
    return { ...entry, quantity: clamped };
  });
}

export function SplitBillPanel({
  open,
  onOpenChange,
  items,
  splitCount: initialSplitCount,
  paidSplitIndices = [],
  discountTotal = 0,
  onPaySplit,
  onCancelSplit,
  onUpdatePrice,
  loading,
}: SplitBillPanelProps) {
  const t = useTranslations("employee");
  const tp = useTranslations("pos");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [splitCount, setSplitCount] = useState(initialSplitCount);
  const [allocationsByItem, setAllocationsByItem] = useState<
    Record<string, SplitAllocation[]>
  >({});
  const [priceTarget, setPriceTarget] = useState<CartItem | null>(null);

  const splitLocked = paidSplitIndices.length > 0;

  const activeItems = useMemo(
    () => items.filter((item) => !item.isVoided),
    [items],
  );

  const activeItemKey = useMemo(
    () =>
      activeItems
        .map(
          (item) =>
            `${item.id}:${item.quantity}:${JSON.stringify(item.splitAllocations ?? item.splitIndex ?? 0)}`,
        )
        .join("|"),
    [activeItems],
  );

  useEffect(() => {
    if (!open) return;
    setSplitCount(initialSplitCount);
    const initial: Record<string, SplitAllocation[]> = {};
    activeItems.forEach((item) => {
      initial[item.id] = buildDefaultItemAllocations(item, initialSplitCount);
    });
    setAllocationsByItem(initial);
  }, [open, initialSplitCount, activeItemKey, activeItems]);

  useEffect(() => {
    setAllocationsByItem((prev) => {
      const next: Record<string, SplitAllocation[]> = {};
      for (const item of activeItems) {
        const current = prev[item.id] ?? buildDefaultItemAllocations(item, splitCount);
        const bySplit = new Map<number, number>();
        for (const entry of current) {
          if (entry.splitIndex < splitCount && entry.quantity > 0) {
            bySplit.set(entry.splitIndex, entry.quantity);
          }
        }
        const totalQty = item.quantity ?? 1;
        let assigned = [...bySplit.values()].reduce((sum, qty) => sum + qty, 0);
        const allocations = Array.from({ length: splitCount }, (_, splitIndex) => ({
          splitIndex,
          quantity: bySplit.get(splitIndex) ?? 0,
        }));
        if (assigned < totalQty) {
          allocations[0] = {
            splitIndex: 0,
            quantity: allocations[0]!.quantity + (totalQty - assigned),
          };
          assigned = totalQty;
        }
        next[item.id] = allocations;
      }
      return next;
    });
  }, [splitCount, activeItems]);

  const previewItems = useMemo(
    () =>
      activeItems.map((item) => ({
        ...item,
        splitAllocations: allocationsByItem[item.id] ?? [],
      })),
    [activeItems, allocationsByItem],
  );

  const splitSummaries = calculateSplitBillSummaries(
    previewItems,
    splitCount,
    discountTotal,
  );

  const allAssigned = activeItems.every((item) => {
    const allocations = allocationsByItem[item.id] ?? [];
    return assignedTotal(allocations) === item.quantity;
  });

  const nextUnpaidSplitIndex = splitSummaries.find(
    (summary) => !paidSplitIndices.includes(summary.splitIndex),
  )?.splitIndex;

  const buildAssignments = (): SplitItemAssignment[] =>
    activeItems.map((item) => ({
      itemId: item.id,
      allocations: (allocationsByItem[item.id] ?? []).filter(
        (entry) => entry.quantity > 0,
      ),
    }));

  if (!open) return null;

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{t("splitBill")}</Label>
        {!splitLocked ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-9"
            onClick={() => onOpenChange(false)}
          >
            {tp("splitCollapse")}
          </Button>
        ) : null}
      </div>

      <Select
        value={String(splitCount)}
        disabled={splitLocked || loading}
        onValueChange={(value) => {
          if (value != null) setSplitCount(Number(value));
        }}
      >
        <SelectTrigger className="min-h-11 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {tp("splitCount", { count: n })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!splitLocked ? (
        <div className="max-h-64 space-y-3 overflow-auto">
          <div
            className="grid items-center gap-2 text-xs font-medium text-muted-foreground"
            style={{
              gridTemplateColumns: `minmax(0,1fr) auto repeat(${splitCount}, minmax(3.5rem, 1fr))`,
            }}
          >
            <span>{tp("splitItemColumn")}</span>
            <span className="text-center">{tp("splitPriceColumn")}</span>
            {Array.from({ length: splitCount }, (_, index) => (
              <span key={index} className="text-center">
                {tp("splitNumber", { number: index + 1 })}
              </span>
            ))}
          </div>

          {activeItems.map((item) => {
            const name = localizedCatalogName(item, locale);
            const allocations =
              allocationsByItem[item.id] ??
              buildDefaultItemAllocations(item, splitCount);
            const assigned = assignedTotal(allocations);
            const complete = assigned === item.quantity;

            return (
              <div
                key={item.id}
                className="rounded-lg border bg-background p-2 space-y-2"
              >
                <div
                  className="grid items-center gap-2"
                  style={{
                    gridTemplateColumns: `minmax(0,1fr) auto repeat(${splitCount}, minmax(3.5rem, 1fr))`,
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tp("splitQtyTotal", { count: item.quantity })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={loading}
                    onClick={() => setPriceTarget(item)}
                    aria-label={tp("changePriceTitle")}
                  >
                    <Euro className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: splitCount }, (_, splitIndex) => {
                    const qty =
                      allocations.find((entry) => entry.splitIndex === splitIndex)
                        ?.quantity ?? 0;
                    return (
                      <div
                        key={splitIndex}
                        className="flex items-center justify-center gap-0.5"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={loading || qty <= 0}
                          onClick={() =>
                            setAllocationsByItem((prev) => ({
                              ...prev,
                              [item.id]: setSplitQuantity(
                                allocations,
                                splitIndex,
                                qty - 1,
                                item.quantity,
                              ),
                            }))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-sm font-semibold tabular-nums">
                          {qty}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={loading || assigned >= item.quantity}
                          onClick={() =>
                            setAllocationsByItem((prev) => ({
                              ...prev,
                              [item.id]: setSplitQuantity(
                                allocations,
                                splitIndex,
                                qty + 1,
                                item.quantity,
                              ),
                            }))
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {!complete ? (
                  <p className="text-xs text-destructive">
                    {tp("splitAssignRemaining", {
                      count: item.quantity - assigned,
                    })}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {splitLocked ? tp("splitPayRemaining") : tp("splitPayEach")}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {splitSummaries.map((summary) => {
            const isPaid = paidSplitIndices.includes(summary.splitIndex);
            const isNext = summary.splitIndex === nextUnpaidSplitIndex;
            return (
              <div
                key={summary.splitIndex}
                className={`rounded-lg border bg-background p-2 space-y-2 ${
                  isNext ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {tp("splitNumber", { number: summary.splitIndex + 1 })}
                  </span>
                  {isPaid ? (
                    <Badge variant="secondary">{tp("splitPaidBadge")}</Badge>
                  ) : isNext ? (
                    <Badge>{tp("splitPayNextBadge")}</Badge>
                  ) : null}
                </div>
                <div className="text-lg font-semibold">
                  <CurrencyDisplay amount={summary.total} />
                </div>
                {!isPaid ? (
                  <Button
                    type="button"
                    className="min-h-10 w-full gap-2"
                    disabled={loading || !allAssigned}
                    onClick={() =>
                      onPaySplit(summary.splitIndex, splitCount, buildAssignments())
                    }
                  >
                    <CreditCard className="h-4 w-4" />
                    {tp("splitPayButton", { number: summary.splitIndex + 1 })}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {!splitLocked ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="min-h-10 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={loading}
              >
                {tp("splitCancel")}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tp("splitCancelTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {tp("splitCancelDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={loading}
                onClick={onCancelSplit}
              >
                {tp("splitCancelConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <EditItemPriceDialog
        open={priceTarget != null}
        itemName={
          priceTarget ? localizedCatalogName(priceTarget, locale) : ""
        }
        currentPrice={priceTarget?.unitPrice ?? 0}
        loading={loading}
        onOpenChange={(next) => {
          if (!next) setPriceTarget(null);
        }}
        onConfirm={(unitPrice) => {
          if (priceTarget) {
            onUpdatePrice(priceTarget.id, unitPrice);
          }
          setPriceTarget(null);
        }}
      />
    </div>
  );
}
