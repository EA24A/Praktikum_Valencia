"use client";

import { useLocale, useTranslations } from "next-intl";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { Split, Tag, Banknote, CreditCard, Save, XCircle, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { OrderItemRow } from "@/components/pos/order-item-row";
import { SplitBillPanel } from "@/components/pos/split-bill-panel";
import { ConvertOrderTypeDialog } from "@/components/pos/convert-order-type-dialog";
import type { SplitItemAssignment } from "@/lib/split-bill";
import { calculateOrderTotals } from "@/lib/calculations";
import type { CartItem } from "@/stores/pos-store";
import type { PosDiscount } from "@/lib/actions/discounts";
import type { PosOrderType, PosTable } from "@/types";
import { useEffect, useState } from "react";

interface OrderPanelProps {
  items: CartItem[];
  discounts: PosDiscount[];
  appliedDiscountId: string | null;
  orderType: PosOrderType;
  tableNumber?: string;
  selectedOrderId?: string | null;
  tables?: PosTable[];
  isSplitBill: boolean;
  splitCount: number;
  paidSplitIndices?: number[];
  discountTotal: number;
  hasOrder: boolean;
  loading?: boolean;
  onUpdateQty: (itemId: string, quantity: number) => void;
  onUpdatePrice: (itemId: string, unitPrice: number) => void;
  onVoidItem: (itemId: string, itemName: string) => void;
  onApplyDiscount: (discountId: string) => void;
  onToggleSplit: (enabled: boolean) => void;
  onPaySplit: (
    splitIndex: number,
    splitCount: number,
    assignments: SplitItemAssignment[],
  ) => void;
  onConvertOrderType: (input: {
    type: "DINE_IN" | "TAKEAWAY";
    tableId?: string;
  }) => void;
  onSaveTicket: () => void;
  onPay: () => void;
  onConfirmOnline?: () => void;
  onCancelOrder?: () => void;
  layout?: "panel" | "modal";
}

export function OrderPanel({
  items,
  discounts,
  appliedDiscountId,
  orderType,
  tableNumber,
  selectedOrderId,
  tables = [],
  isSplitBill,
  splitCount,
  paidSplitIndices = [],
  discountTotal,
  hasOrder,
  loading,
  onUpdateQty,
  onUpdatePrice,
  onVoidItem,
  onApplyDiscount,
  onToggleSplit,
  onPaySplit,
  onConvertOrderType,
  onSaveTicket,
  onPay,
  onConfirmOnline,
  onCancelOrder,
  layout = "panel",
}: OrderPanelProps) {
  const t = useTranslations("employee");
  const tc = useTranslations("common");
  const tp = useTranslations("pos");
  const locale = useLocale();
  const [splitOpen, setSplitOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const splitPaymentsStarted = paidSplitIndices.length > 0;

  useEffect(() => {
    if (isSplitBill) {
      setSplitOpen(true);
    } else {
      setSplitOpen(false);
    }
  }, [isSplitBill]);

  const activeItems = items.filter((item) => !item.isVoided);
  const totals = calculateOrderTotals(items, discountTotal);
  const isOnlineOrder = orderType === "ONLINE";
  const title =
    orderType === "ONLINE"
      ? t("onlineOrder")
      : orderType === "TAKEAWAY"
        ? t("takeaway")
        : tableNumber
          ? `${tp("tableLabel")} ${tableNumber}`
          : t("currentOrder");

  if (!hasOrder) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-muted/20 p-8 text-center">
        <p className="text-xl font-medium text-foreground">{t("selectTable")}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{tp("selectTableHint")}</p>
      </div>
    );
  }

  const itemList =
    items.length === 0 ? (
      <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <p className="text-base font-medium">{tp("emptyOrder")}</p>
        <p className="text-sm">{tp("emptyOrderHint")}</p>
      </div>
    ) : (
      <ul className="space-y-2">
        {items.map((item) => {
          const name = localizedCatalogName(item, locale);
          return (
            <OrderItemRow
              key={item.isCustom ? item.id : `${item.productId}:${item.isCustom ? "custom" : "std"}`}
              item={item}
              name={name}
              loading={loading}
              onUpdateQty={onUpdateQty}
              onUpdatePrice={onUpdatePrice}
              onVoidItem={onVoidItem}
            />
          );
        })}
      </ul>
    );

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{title}</h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {orderType === "DINE_IN"
                ? tp("reservedTable")
                : isOnlineOrder
                  ? tp("onlineTicketBadge")
                  : tp("activeTicket")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeItems.length} {tp("items")} · {tp("autoSaved")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!isOnlineOrder && !splitPaymentsStarted ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={loading}
              onClick={() => setConvertOpen(true)}
            >
              <ArrowRightLeft className="h-4 w-4" />
              {orderType === "TAKEAWAY" ? tp("convertToTable") : tp("convertToTakeaway")}
            </Button>
          ) : null}
          {layout === "modal" && onCancelOrder && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={loading}
                  >
                    <XCircle className="h-4 w-4" />
                    {isOnlineOrder
                      ? tp("cancelOnlineOrder")
                      : orderType === "TAKEAWAY"
                        ? tp("cancelTakeaway")
                        : tp("cancelTable")}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isOnlineOrder
                      ? tp("cancelOnlineOrder")
                      : orderType === "TAKEAWAY"
                        ? tp("cancelTakeaway")
                        : tp("cancelTable")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{tp("cancelTableConfirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={loading}
                    onClick={onCancelOrder}
                  >
                    {tp("cancelTableConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={loading}
            onClick={onSaveTicket}
          >
            <Save className="h-4 w-4" />
            {layout === "modal" ? tp("closeOrder") : tp("saveTicket")}
          </Button>
        </div>
      </div>

      <div className="min-h-0 overflow-x-hidden overflow-y-scroll overscroll-y-contain p-3 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
        {itemList}
      </div>

      <div
        className={
          layout === "modal"
            ? "max-h-[min(36dvh,320px)] min-h-0 space-y-2 overflow-x-hidden overflow-y-scroll overscroll-y-contain border-t bg-muted/20 p-3 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
            : "shrink-0 space-y-3 border-t bg-muted/20 p-4"
        }
      >
        <div className="space-y-1 rounded-xl bg-background p-2.5 text-sm shadow-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc("subtotal")}</span>
            <CurrencyDisplay amount={totals.subtotal} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc("tax")}</span>
            <CurrencyDisplay amount={totals.taxTotal} />
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{tc("discount")}</span>
              <span>-<CurrencyDisplay amount={discountTotal} /></span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1.5 text-lg font-bold">
            <span>{tc("total")}</span>
            <CurrencyDisplay amount={totals.total} />
          </div>
        </div>

        {discounts.length > 0 && !isOnlineOrder && (
          <Select
            value={appliedDiscountId ?? "none"}
            onValueChange={(v) => v && v !== "none" && onApplyDiscount(v)}
          >
            <SelectTrigger className="min-h-10 bg-background">
              <Tag className="mr-2 h-4 w-4 shrink-0" />
              <SelectValue placeholder={t("applyDiscount")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("applyDiscount")}</SelectItem>
              {discounts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {locale === "es" ? d.nameEs : d.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!isOnlineOrder ? (
          <Button
            type="button"
            variant={isSplitBill ? "default" : "secondary"}
            className="min-h-11 w-full gap-2 border-2 border-primary/40 bg-primary/10 font-semibold text-foreground shadow-sm hover:bg-primary/20"
            disabled={loading || activeItems.length === 0}
            onClick={() => {
              if (isSplitBill) {
                setSplitOpen(!splitOpen);
              } else {
                onToggleSplit(true);
              }
            }}
          >
            <Split className="h-4 w-4" />
            {t("splitBill")}
          </Button>
        ) : null}

        {!isOnlineOrder && isSplitBill && splitOpen && (
          <SplitBillPanel
            open={splitOpen}
            onOpenChange={setSplitOpen}
            items={items}
            splitCount={splitCount}
            paidSplitIndices={paidSplitIndices}
            discountTotal={discountTotal}
            onPaySplit={onPaySplit}
            onCancelSplit={() => onToggleSplit(false)}
            onUpdatePrice={onUpdatePrice}
            loading={loading}
          />
        )}

        {isOnlineOrder ? (
          <Button
            type="button"
            className="min-h-11 w-full gap-2"
            disabled={loading || activeItems.length === 0}
            onClick={onConfirmOnline}
          >
            <CheckCircle2 className="h-5 w-5" />
            {tp("confirmOnlineOrder")}
          </Button>
        ) : !isSplitBill ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="min-h-11 gap-2"
              disabled={loading || activeItems.length === 0}
              onClick={onPay}
            >
              <Banknote className="h-5 w-5" />
              {t("payCash")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 gap-2 bg-background"
              disabled={loading || activeItems.length === 0}
              onClick={onPay}
            >
              <CreditCard className="h-5 w-5" />
              {t("payCard")}
            </Button>
          </div>
        ) : null}
      </div>

      {!isOnlineOrder ? (
        <ConvertOrderTypeDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          mode={orderType === "TAKEAWAY" ? "to-table" : "to-takeaway"}
          tables={tables}
          currentOrderId={selectedOrderId}
          loading={loading}
          onConfirm={(tableId) => {
            if (orderType === "TAKEAWAY") {
              if (!tableId) return;
              onConvertOrderType({ type: "DINE_IN", tableId });
            } else {
              onConvertOrderType({ type: "TAKEAWAY" });
            }
            setConvertOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
