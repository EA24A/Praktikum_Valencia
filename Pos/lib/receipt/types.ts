import type { PosOrderDetail } from "@/lib/actions/pos-orders";

export interface ReceiptSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  taxId: string;
  currencySymbol: string;
  receiptHeaderEs: string;
  receiptHeaderEn: string;
  receiptFooterEs: string;
  receiptFooterEn: string;
}

export interface ReceiptDocumentProps {
  order: PosOrderDetail;
  settings: ReceiptSettings;
  locale: string;
  splitIndex?: number | null;
}

export type ReceiptOrder = PosOrderDetail;
