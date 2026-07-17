import { formatCurrency, formatDecimal } from "@/lib/calculations";
import { calculateSplitTotal, quantityForSplit } from "@/lib/split-bill";
import { expandComboReceiptLines } from "@/lib/receipt/combo-receipt-lines";
import type { ReceiptDocumentProps, ReceiptSettings } from "@/lib/receipt/types";
import type { PosOrderDetail } from "@/lib/actions/pos-orders";

import { intlLocaleForUi } from "@/lib/ui-locale";

export function receiptIntlLocale(locale: string): string {
  return intlLocaleForUi(locale);
}

export function money(amount: number, locale: string): string {
  return formatCurrency(amount, receiptIntlLocale(locale));
}

export function formatReceiptDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(receiptIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function bilingual(es: string, en: string, locale: string): string {
  return locale === "es" ? es : `${es} / ${en}`;
}

export interface ReceiptTexts {
  header: string;
  footer: string;
  title: string;
  titleSub: string | null;
  invoiceNumber: string;
  issueDate: string;
  table: string;
  takeaway: string;
  online: string;
  taxIdLabel: string;
  phoneLabel: string;
  concept: string;
  qty: string;
  unitPrice: string;
  amount: string;
  vatSummary: string;
  vatType: string;
  vatBase: string;
  vatQuota: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  payment: string;
  cash: string;
  card: string;
  servedBy: string;
  cardRef: string;
  legalNote: string;
  vatIncluded: string;
  splitReceipt: string;
}

export function getReceiptTexts(settings: ReceiptSettings, locale: string): ReceiptTexts {
  const isEs = locale === "es";
  return {
    header: isEs ? settings.receiptHeaderEs : settings.receiptHeaderEn,
    footer: isEs ? settings.receiptFooterEs : settings.receiptFooterEn,
    title: "FACTURA SIMPLIFICADA",
    titleSub: isEs ? null : "Simplified invoice",
    invoiceNumber: bilingual("Nº factura", "Invoice no.", locale),
    issueDate: bilingual("Fecha", "Date", locale),
    table: bilingual("Mesa", "Table", locale),
    takeaway: bilingual("Para llevar", "Takeaway", locale),
    online: bilingual("Pedido online", "Online order", locale),
    taxIdLabel: bilingual("NIF/CIF", "Tax ID", locale),
    phoneLabel: bilingual("Tel.", "Phone", locale),
    concept: bilingual("Concepto", "Item", locale),
    qty: bilingual("Ud.", "Qty", locale),
    unitPrice: bilingual("P. unit.", "Unit", locale),
    amount: bilingual("Importe", "Amount", locale),
    vatSummary: bilingual("Desglose IVA", "VAT breakdown", locale),
    vatType: bilingual("Tipo", "Rate", locale),
    vatBase: bilingual("Base", "Base", locale),
    vatQuota: bilingual("Cuota", "VAT", locale),
    subtotal: bilingual("Base imponible", "Taxable base", locale),
    tax: bilingual("Total IVA", "Total VAT", locale),
    discount: bilingual("Descuento", "Discount", locale),
    total: bilingual("TOTAL", "TOTAL", locale),
    payment: bilingual("Forma de pago", "Payment", locale),
    cash: bilingual("Efectivo", "Cash", locale),
    card: bilingual("Tarjeta", "Card", locale),
    servedBy: bilingual("Atendido por", "Served by", locale),
    cardRef: bilingual("Ref. TPV", "Terminal ref.", locale),
    legalNote: isEs
      ? "Documento válido como factura simplificada."
      : "Valid simplified tax invoice (factura simplificada).",
    vatIncluded: bilingual("Precios con IVA incluido", "Prices incl. VAT", locale),
    splitReceipt: bilingual("Parte", "Split", locale),
  };
}

export interface VatBreakdownRow {
  rate: number;
  base: number;
  quota: number;
}

export function buildVatBreakdown(
  items: Array<{ taxRate: number; subtotal: number; taxAmount: number }>,
): VatBreakdownRow[] {
  const byRate = new Map<number, { base: number; quota: number }>();

  for (const item of items) {
    const rate = item.taxRate;
    const current = byRate.get(rate) ?? { base: 0, quota: 0 };
    byRate.set(rate, {
      base: formatDecimal(current.base + item.subtotal),
      quota: formatDecimal(current.quota + item.taxAmount),
    });
  }

  return [...byRate.entries()]
    .map(([rate, amounts]) => ({ rate, ...amounts }))
    .sort((a, b) => b.rate - a.rate);
}

function lineItemName(
  item: PosOrderDetail["items"][number],
  locale: string,
): { name: string; nameSecondary: string | null } {
  if (locale === "de") {
    const german = item.nameDe?.trim();
    if (german) {
      return { name: german, nameSecondary: null };
    }
  }

  const primary = item.nameEs;
  const secondary = item.nameEn;

  if (locale === "es" || primary === secondary) {
    return { name: primary, nameSecondary: null };
  }

  return { name: primary, nameSecondary: secondary };
}

function toReceiptLineItem(
  item: PosOrderDetail["items"][number],
  locale: string,
) {
  const { name, nameSecondary } = lineItemName(item, locale);
  return {
    id: item.id,
    name,
    nameSecondary,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate,
    subtotal: item.subtotal,
    taxAmount: item.taxAmount,
    total: item.total,
    customReason: item.customReason ?? null,
  };
}

function buildReceiptLineItems(
  activeItems: PosOrderDetail["items"],
  locale: string,
): { lineItems: ReturnType<typeof toReceiptLineItem>[]; usedComboTaxSplit: boolean } {
  const lineItems = [];
  let usedComboTaxSplit = false;

  for (const item of activeItems) {
    const comboLines = expandComboReceiptLines(
      {
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        comboSourceProductIds: item.comboSourceProductIds,
        comboComponents: item.comboComponents,
        customReason: item.customReason,
      },
      locale,
    );

    if (comboLines) {
      usedComboTaxSplit = true;
      lineItems.push(...comboLines);
    } else {
      lineItems.push(toReceiptLineItem(item, locale));
    }
  }

  return { lineItems, usedComboTaxSplit };
}

export function buildReceiptModel({
  order,
  settings,
  locale,
  splitIndex = null,
}: ReceiptDocumentProps) {
  const texts = getReceiptTexts(settings, locale);
  const activeItems = order.items.filter((item) => {
    if (item.isVoided) return false;
    if (splitIndex == null) return true;
    return quantityForSplit(item, splitIndex) > 0;
  });
  const paidAt = order.paidAt ?? new Date().toISOString();
  const receiptItems =
    splitIndex == null
      ? activeItems
      : activeItems.map((item) => {
          const allocQty = quantityForSplit(item, splitIndex);
          if (allocQty <= 0 || allocQty === item.quantity) return item;
          const fraction = allocQty / item.quantity;
          return {
            ...item,
            quantity: allocQty,
            subtotal: formatDecimal(item.subtotal * fraction),
            taxAmount: formatDecimal(item.taxAmount * fraction),
            total: formatDecimal(item.total * fraction),
          };
        });
  const { lineItems, usedComboTaxSplit } = buildReceiptLineItems(receiptItems, locale);
  const receiptTaxItems = lineItems.map((item) => ({
    taxRate: item.taxRate,
    subtotal: item.subtotal,
    taxAmount: item.taxAmount,
  }));
  const receiptSubtotal = formatDecimal(
    receiptTaxItems.reduce((sum, item) => sum + item.subtotal, 0),
  );
  const receiptTaxTotal = formatDecimal(
    receiptTaxItems.reduce((sum, item) => sum + item.taxAmount, 0),
  );
  const receiptGrossTotal = formatDecimal(
    lineItems.reduce((sum, item) => sum + item.total, 0),
  );

  const splitTotals =
    splitIndex != null
      ? calculateSplitTotal(order.items, splitIndex, order.discountTotal)
      : null;

  const displaySubtotal = splitTotals?.subtotal ?? order.subtotal;
  const displayTaxTotal = splitTotals?.taxTotal ?? order.taxTotal;
  const displayDiscountTotal = splitTotals?.discountTotal ?? order.discountTotal;
  const displayTotal = splitTotals?.total ?? order.total;
  const showDiscount = displayDiscountTotal > 0;

  return {
    texts,
    locale,
    activeItems,
    lineItems,
    vatBreakdown: buildVatBreakdown(receiptTaxItems),
    paidAtLabel: formatReceiptDate(paidAt, locale),
    splitLabel: splitIndex != null ? String(splitIndex + 1) : null,
    paymentLabel:
      order.paymentMethod === "CASH"
        ? texts.cash
        : order.paymentMethod === "CARD"
          ? texts.card
          : "—",
    subtotal: money(usedComboTaxSplit ? receiptSubtotal : displaySubtotal, locale),
    taxTotal: money(usedComboTaxSplit ? receiptTaxTotal : displayTaxTotal, locale),
    discountTotal: money(displayDiscountTotal, locale),
    total: money(
      splitTotals
        ? splitTotals.total
        : order.discountTotal > 0
          ? formatDecimal(Math.max(0, receiptGrossTotal - order.discountTotal))
          : usedComboTaxSplit
            ? receiptGrossTotal
            : order.total,
      locale,
    ),
    showDiscount,
  };
}

export function buildReceiptEmailSubject(
  order: PosOrderDetail,
  settings: ReceiptSettings,
  locale: string,
): string {
  const texts = getReceiptTexts(settings, locale);
  const number = order.receiptNumber ?? order.id.slice(-8).toUpperCase();
  return `${settings.businessName} — ${texts.invoiceNumber}: ${number}`;
}
