"use client";

import { format } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { useLocale, useTranslations } from "next-intl";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderDetail } from "@/lib/actions/orders";
import { OrderStatusBadge } from "./order-status-badge";
import { EditableCardReference } from "./editable-card-reference";
import { EditableSplitCardReferences } from "./editable-split-card-references";

interface OrderDetailModalProps {
  order: OrderDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueRefund: () => void;
  onCardReferenceUpdated: (
    orderId: string,
    update: {
      cardReference?: string | null;
      splitIndex?: number;
      splitPayments?: OrderDetail["splitPayments"];
      splitPaymentSlots?: OrderDetail["splitPaymentSlots"];
    },
  ) => void;
  isLoading?: boolean;
}

export function OrderDetailModal({
  order,
  open,
  onOpenChange,
  onIssueRefund,
  onCardReferenceUpdated,
  isLoading,
}: OrderDetailModalProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const td = useTranslations("discounts");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);

  const productName = (nameEs: string, nameEn: string, nameDe?: string) =>
    localizedCatalogName({ nameEs, nameEn, nameDe }, locale);

  const discountName = (nameEs: string, nameEn: string) =>
    locale === "es" ? nameEs : nameEn;

  const discountTypeLabel = (type: string) => {
    switch (type) {
      case "PERCENTAGE":
        return td("typePercentage");
      case "FIXED_AMOUNT":
        return td("typeFixedAmount");
      case "COMBO":
        return td("typeCombo");
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("orderDetail")}</DialogTitle>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="py-8 text-center text-muted-foreground">{t("loading")}</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{t("receiptNumber")}</p>
                <p className="font-medium">{order.receiptNumber ?? tCommon("empty")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("cardReference")}</p>
                {order.isSplitBill && order.splitCount && order.splitPaymentSlots.length > 0 ? (
                  <EditableSplitCardReferences
                    orderId={order.id}
                    slots={order.splitPaymentSlots}
                    onSaved={onCardReferenceUpdated}
                  />
                ) : (
                  <EditableCardReference
                    orderId={order.id}
                    value={order.cardReference}
                    onSaved={(cardReference) =>
                      onCardReferenceUpdated(order.id, { cardReference })
                    }
                  />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("status")}</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("createdAt")}</p>
                <p>{format(new Date(order.createdAt), "PPp", { locale: dateLocale })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("paidAt")}</p>
                <p>
                  {order.paidAt
                    ? format(new Date(order.paidAt), "PPp", { locale: dateLocale })
                    : tCommon("empty")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("table")}</p>
                <p>
                  {order.table?.number ??
                    (order.type === "TAKEAWAY"
                      ? t("takeaway")
                      : order.type === "ONLINE"
                        ? t("online")
                        : tCommon("empty"))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("createdBy")}</p>
                <p>{order.createdBy.name}</p>
              </div>
              {order.paidBy && (
                <div>
                  <p className="text-xs text-muted-foreground">{t("paidBy")}</p>
                  <p>{order.paidBy.name}</p>
                </div>
              )}
              {order.isSplitBill && order.splitCount ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">{t("splitBill")}</p>
                  <Badge variant="outline">
                    {t("splitBillBadge", { count: order.splitCount })}
                  </Badge>
                </div>
              ) : null}
            </div>

            {order.isSplitBill && order.splitBreakdown.length > 0 ? (
              <section className="space-y-3">
                <h3 className="font-medium">{t("splitBreakdown")}</h3>
                {order.splitBreakdown.map((split) => {
                  const paymentSlot = order.splitPaymentSlots.find(
                    (slot) => slot.splitIndex === split.splitIndex,
                  );
                  return (
                    <div
                      key={split.splitIndex}
                      className="rounded-lg border bg-muted/20 p-3 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {t("splitPart", { number: split.splitIndex + 1 })}
                          </p>
                          {paymentSlot?.paymentMethod ? (
                            <p className="text-xs text-muted-foreground">
                              {t("paymentMethod")}:{" "}
                              {t(
                                `paymentMethods.${paymentSlot.paymentMethod.toLowerCase()}`,
                              )}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-lg font-semibold">
                          <CurrencyDisplay amount={split.total} />
                        </p>
                      </div>
                      <div className="rounded-md border bg-background">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("product")}</TableHead>
                              <TableHead>{t("quantity")}</TableHead>
                              <TableHead className="text-right">
                                {tCommon("total")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {split.lines.map((line, index) => (
                              <TableRow key={`${split.splitIndex}-${index}`}>
                                <TableCell>
                                  {productName(line.nameEs, line.nameEn, line.nameDe)}
                                </TableCell>
                                <TableCell>{line.quantity}</TableCell>
                                <TableCell className="text-right">
                                  <CurrencyDisplay amount={line.total} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {split.discountTotal > 0 ? (
                        <div className="flex justify-between text-sm text-green-700">
                          <span>{tCommon("discount")}</span>
                          <span>
                            -<CurrencyDisplay amount={split.discountTotal} />
                          </span>
                        </div>
                      ) : null}
                      {paymentSlot?.paymentMethod !== "CASH" ? (
                        <div className="space-y-1 border-t pt-2">
                          <p className="text-xs text-muted-foreground">
                            {t("cardReference")}
                          </p>
                          <EditableCardReference
                            orderId={order.id}
                            value={paymentSlot.cardReference}
                            splitIndex={split.splitIndex}
                            onSaved={(cardReference, meta) =>
                              onCardReferenceUpdated(order.id, {
                                cardReference,
                                splitIndex: split.splitIndex,
                                splitPayments: meta?.splitPayments,
                                splitPaymentSlots: meta?.splitPaymentSlots,
                              })
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </section>
            ) : (
              <section className="space-y-2">
                <h3 className="font-medium">{t("items")}</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("product")}</TableHead>
                        <TableHead>{t("quantity")}</TableHead>
                        <TableHead className="text-right">{tCommon("subtotal")}</TableHead>
                        <TableHead className="text-right">{tCommon("total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow
                          key={item.id}
                          className={item.isVoided ? "opacity-60 line-through" : undefined}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <span>
                                {productName(
                                  item.nameEs ?? item.product.nameEs,
                                  item.nameEn ?? item.product.nameEn,
                                  item.nameDe ?? item.product.nameDe,
                                )}
                              </span>
                              {item.isCustom && item.customReason ? (
                                <p className="text-xs text-muted-foreground no-underline">
                                  {item.customReason}
                                </p>
                              ) : null}
                              {item.isVoided && (
                                <div className="flex flex-wrap items-center gap-2 no-underline">
                                  <Badge variant="destructive">{t("voided")}</Badge>
                                  {item.voidReason && (
                                    <span className="text-xs text-muted-foreground no-underline">
                                      {item.voidReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            <CurrencyDisplay amount={item.subtotal} />
                          </TableCell>
                          <TableCell className="text-right">
                            <CurrencyDisplay amount={item.total} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {order.discounts.length > 0 && (
              <section className="space-y-2">
                <h3 className="font-medium">{t("discounts")}</h3>
                <ul className="space-y-2 rounded-lg border p-3">
                  {order.discounts.map((discount) => (
                    <li key={discount.id} className="flex items-center justify-between text-sm">
                      <span>
                        {discountName(discount.nameEs, discount.nameEn)}
                      </span>
                      <Badge variant="outline">{discountTypeLabel(discount.type)}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="font-medium">{t("payment")}</h3>
              <div className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <span>{tCommon("subtotal")}</span>
                  <CurrencyDisplay amount={order.subtotal} />
                </div>
                <div className="flex justify-between">
                  <span>{tCommon("tax")}</span>
                  <CurrencyDisplay amount={order.taxTotal} />
                </div>
                <div className="flex justify-between">
                  <span>{tCommon("discount")}</span>
                  <CurrencyDisplay amount={order.discountTotal} />
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>{tCommon("total")}</span>
                  <CurrencyDisplay amount={order.total} />
                </div>
                {order.paymentMethod && !order.isSplitBill && (
                  <div className="mt-2 flex justify-between text-muted-foreground">
                    <span>{t("paymentMethod")}</span>
                    <span>{t(`paymentMethods.${order.paymentMethod.toLowerCase()}`)}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">{t("refunds")}</h3>
              {order.refunds.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRefunds")}</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("createdAt")}</TableHead>
                        <TableHead>{t("refundReason")}</TableHead>
                        <TableHead>{t("issuedBy")}</TableHead>
                        <TableHead className="text-right">{t("refundAmount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.refunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>
                            {format(new Date(refund.createdAt), "PPp", {
                              locale: dateLocale,
                            })}
                          </TableCell>
                          <TableCell>{refund.reason}</TableCell>
                          <TableCell>{refund.issuedBy.name}</TableCell>
                          <TableCell className="text-right text-destructive">
                            <CurrencyDisplay amount={refund.amount} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {order.refundedTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t("refundedTotal")}</span>
                  <CurrencyDisplay amount={order.refundedTotal} className="text-destructive" />
                </div>
              )}
              {order.remainingRefundable > 0 && order.status === "PAID" && (
                <div className="flex justify-between text-sm font-medium">
                  <span>{t("remainingRefundable")}</span>
                  <CurrencyDisplay amount={order.remainingRefundable} />
                </div>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          {order?.status === "PAID" && order.remainingRefundable > 0 && (
            <Button onClick={onIssueRefund}>{t("issueRefund")}</Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
