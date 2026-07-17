"use client";

import { useTranslations } from "next-intl";
import type { OrderDetail, OrderSummary } from "@/lib/actions/orders";
import { EditableCardReference } from "./editable-card-reference";

type SplitPaymentSlot = OrderSummary["splitPaymentSlots"][number];

interface EditableSplitCardReferencesProps {
  orderId: string;
  slots: SplitPaymentSlot[];
  compact?: boolean;
  onSaved: (
    orderId: string,
    update: {
      cardReference?: string | null;
      splitIndex?: number;
      splitPayments?: OrderDetail["splitPayments"];
      splitPaymentSlots?: OrderDetail["splitPaymentSlots"];
    },
  ) => void;
}

export function EditableSplitCardReferences({
  orderId,
  slots,
  compact = false,
  onSaved,
}: EditableSplitCardReferencesProps) {
  const t = useTranslations("orders");

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {slots.map((slot) => (
        <div
          key={slot.splitIndex}
          className={
            compact
              ? "flex items-center gap-2 text-sm"
              : "flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5"
          }
        >
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {t("splitPart", { number: slot.splitIndex + 1 })}
          </span>
          {slot.paymentMethod === "CASH" ? (
            <span className="text-sm text-muted-foreground">
              {t("paymentMethods.cash")}
            </span>
          ) : (
            <EditableCardReference
              orderId={orderId}
              value={slot.cardReference}
              splitIndex={slot.splitIndex}
              compact={compact}
              onSaved={(cardReference, meta) =>
                onSaved(orderId, {
                  cardReference,
                  splitIndex: slot.splitIndex,
                  splitPayments: meta?.splitPayments,
                  splitPaymentSlots: meta?.splitPaymentSlots,
                })
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
