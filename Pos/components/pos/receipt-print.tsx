"use client";

import { useLocale } from "next-intl";
import { ReceiptDocument } from "@/components/receipt/receipt-document";
import type { PosOrderDetail } from "@/lib/actions/pos-orders";
import type { ReceiptSettings } from "@/lib/receipt/types";

interface ReceiptPrintProps {
  order: PosOrderDetail;
  settings: ReceiptSettings;
  splitIndex?: number | null;
}

export function ReceiptPrint({ order, settings, splitIndex = null }: ReceiptPrintProps) {
  const locale = useLocale();

  return (
    <div id="receipt-print" aria-hidden="true">
      <ReceiptDocument
        order={order}
        settings={settings}
        locale={locale}
        splitIndex={splitIndex}
      />
    </div>
  );
}

export type { ReceiptSettings };
