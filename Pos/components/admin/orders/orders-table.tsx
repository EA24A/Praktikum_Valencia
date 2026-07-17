"use client";

import { format } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { useLocale, useTranslations } from "next-intl";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderSummary } from "@/lib/actions/orders";
import { OrderStatusBadge } from "./order-status-badge";
import { EditableCardReference } from "./editable-card-reference";
import { EditableSplitCardReferences } from "./editable-split-card-references";

interface OrdersTableProps {
  orders: OrderSummary[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onViewOrder: (orderId: string) => void;
  onCardReferenceUpdated: (
    orderId: string,
    update: {
      cardReference?: string | null;
      splitIndex?: number;
      splitPayments?: OrderSummary["splitPayments"];
      splitPaymentSlots?: OrderSummary["splitPaymentSlots"];
    },
  ) => void;
  isLoading?: boolean;
}

function isDeletable(order: OrderSummary) {
  return order.status !== "OPEN";
}

export function OrdersTable({
  orders,
  selectedIds,
  onSelectedIdsChange,
  onViewOrder,
  onCardReferenceUpdated,
  isLoading,
}: OrdersTableProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);

  const deletableOrders = orders.filter(isDeletable);
  const selectedDeletableCount = deletableOrders.filter((order) =>
    selectedIds.includes(order.id),
  ).length;
  const allDeletableSelected =
    deletableOrders.length > 0 &&
    selectedDeletableCount === deletableOrders.length;
  const someDeletableSelected =
    selectedDeletableCount > 0 &&
    selectedDeletableCount < deletableOrders.length;

  const toggleOrder = (orderId: string, checked: boolean) => {
    onSelectedIdsChange(
      checked
        ? selectedIds.includes(orderId)
          ? selectedIds
          : [...selectedIds, orderId]
        : selectedIds.filter((id) => id !== orderId),
    );
  };

  const toggleAllDeletable = (checked: boolean) => {
    if (!checked) {
      const deletableIds = new Set(deletableOrders.map((order) => order.id));
      onSelectedIdsChange(selectedIds.filter((id) => !deletableIds.has(id)));
      return;
    }
    onSelectedIdsChange([
      ...new Set([
        ...selectedIds,
        ...deletableOrders.map((order) => order.id),
      ]),
    ]);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background p-8 text-center text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-8 text-center text-muted-foreground">
        {t("noOrders")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allDeletableSelected}
                indeterminate={someDeletableSelected}
                disabled={deletableOrders.length === 0}
                onCheckedChange={(checked) =>
                  toggleAllDeletable(checked === true)
                }
                aria-label={t("selectAll")}
              />
            </TableHead>
            <TableHead>{t("receiptNumber")}</TableHead>
            <TableHead>{t("cardReference")}</TableHead>
            <TableHead>{t("createdAt")}</TableHead>
            <TableHead>{t("table")}</TableHead>
            <TableHead>{t("employee")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("paymentMethod")}</TableHead>
            <TableHead className="text-right">{t("total")}</TableHead>
            <TableHead className="text-right">{t("refunded")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const deletable = isDeletable(order);

            return (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(order.id)}
                    disabled={!deletable}
                    onCheckedChange={(checked) =>
                      toggleOrder(order.id, checked === true)
                    }
                    aria-label={t("selectOrder")}
                    title={deletable ? undefined : t("bulkDeleteOpenHint")}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {order.receiptNumber ?? tc("empty")}
                </TableCell>
                <TableCell>
                  {order.isSplitBill && order.splitCount && order.splitPaymentSlots.length > 0 ? (
                    <EditableSplitCardReferences
                      orderId={order.id}
                      slots={order.splitPaymentSlots}
                      compact
                      onSaved={onCardReferenceUpdated}
                    />
                  ) : (
                    <EditableCardReference
                      orderId={order.id}
                      value={order.cardReference}
                      compact
                      onSaved={(cardReference) =>
                        onCardReferenceUpdated(order.id, { cardReference })
                      }
                    />
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(order.createdAt), "PPp", {
                    locale: dateLocale,
                  })}
                </TableCell>
                <TableCell>
                  {order.table?.number ??
                    (order.type === "TAKEAWAY"
                      ? t("takeaway")
                      : order.type === "ONLINE"
                        ? t("online")
                        : tc("empty"))}
                </TableCell>
                <TableCell>{order.createdBy.name}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {order.isSplitBill && order.splitCount ? (
                    <Badge variant="outline">
                      {t("splitBillBadge", { count: order.splitCount })}
                    </Badge>
                  ) : order.paymentMethod ? (
                    t(`paymentMethods.${order.paymentMethod.toLowerCase()}`)
                  ) : (
                    tc("empty")
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={order.total} />
                </TableCell>
                <TableCell className="text-right">
                  {order.refundedTotal > 0 ? (
                    <CurrencyDisplay
                      amount={order.refundedTotal}
                      className="text-destructive"
                    />
                  ) : (
                    tc("empty")
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewOrder(order.id)}
                  >
                    {t("viewDetails")}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
