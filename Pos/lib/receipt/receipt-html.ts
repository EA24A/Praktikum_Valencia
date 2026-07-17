import { buildReceiptModel, money } from "@/lib/receipt/format-receipt";
import type { ReceiptDocumentProps } from "@/lib/receipt/types";

const RECEIPT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 8px; background: #fff; color: #000; font-family: "Courier New", Courier, monospace; font-size: 11px; line-height: 1.35; }
  .receipt-document { width: 72mm; max-width: 72mm; margin: 0 auto; }
  .receipt-header { text-align: center; }
  .receipt-business-name { margin: 0 0 4px; font-size: 14px; font-weight: 700; text-transform: uppercase; }
  .receipt-meta, .receipt-header-text { margin: 2px 0; font-size: 10px; text-align: center; }
  .receipt-header-text { margin-top: 6px; }
  .receipt-rule { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .receipt-rule-bold { border-top-width: 2px; border-top-style: solid; }
  .receipt-title-block { text-align: center; }
  .receipt-title { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
  .receipt-title-sub { margin: 2px 0 0; font-size: 9px; font-weight: 400; }
  .receipt-meta-block { font-size: 10px; }
  .receipt-meta-row { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
  .receipt-label { font-weight: 600; }
  .receipt-note { margin: 4px 0 0; font-size: 9px; text-align: center; color: #333; }
  .receipt-section-title { margin: 0 0 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .receipt-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  .receipt-table th { padding: 3px 0; border-bottom: 1px solid #000; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .receipt-table td { padding: 4px 0; vertical-align: top; }
  .receipt-col-qty { width: 24px; text-align: center; white-space: nowrap; }
  .receipt-col-amount { text-align: right; white-space: nowrap; width: 56px; }
  .receipt-item-name { display: block; font-weight: 600; }
  .receipt-item-name-sub { display: block; font-size: 9px; color: #333; }
  .receipt-item-detail, .receipt-item-reason { display: block; margin-top: 2px; font-size: 9px; color: #333; }
  .receipt-item-reason { font-style: italic; }
  .receipt-total-final td { padding-top: 6px; border-top: 1px solid #000; font-size: 13px; font-weight: 700; }
  .receipt-payment, .receipt-center { text-align: center; margin: 6px 0 0; font-size: 11px; }
  .receipt-legal { margin: 8px 0 0; text-align: center; font-size: 9px; color: #333; }
  .receipt-footer { margin-top: 10px; text-align: center; font-size: 10px; }
`;

export function buildReceiptHtml(props: ReceiptDocumentProps): string {
  const { order, settings, locale } = props;
  const model = buildReceiptModel(props);
  const { texts, lineItems, vatBreakdown } = model;

  const itemRows = lineItems
    .map((item) => {
      const nameSub = item.nameSecondary
        ? `<span class="receipt-item-name-sub">${escapeHtml(item.nameSecondary)}</span>`
        : "";
      const reason = item.customReason
        ? `<span class="receipt-item-reason">${escapeHtml(item.customReason)}</span>`
        : "";
      const detail = `${item.quantity} × ${money(item.unitPrice, locale)}${
        item.taxRate > 0 ? ` · IVA ${item.taxRate}%` : ""
      }`;

      return `
        <tr>
          <td class="receipt-col-concept">
            <span class="receipt-item-name">${escapeHtml(item.name)}</span>
            ${nameSub}
            <span class="receipt-item-detail">${escapeHtml(detail)}</span>
            ${reason}
          </td>
          <td class="receipt-col-qty">${item.quantity}</td>
          <td class="receipt-col-amount">${money(item.total, locale)}</td>
        </tr>`;
    })
    .join("");

  const vatSection =
    vatBreakdown.length > 0
      ? `
    <p class="receipt-section-title">${escapeHtml(texts.vatSummary)}</p>
    <table class="receipt-table receipt-vat-table">
      <thead>
        <tr>
          <th>${escapeHtml(texts.vatType)}</th>
          <th class="receipt-col-amount">${escapeHtml(texts.vatBase)}</th>
          <th class="receipt-col-amount">${escapeHtml(texts.vatQuota)}</th>
        </tr>
      </thead>
      <tbody>
        ${vatBreakdown
          .map(
            (row) => `
          <tr>
            <td>${row.rate > 0 ? `${row.rate}%` : "0%"}</td>
            <td class="receipt-col-amount">${money(row.base, locale)}</td>
            <td class="receipt-col-amount">${money(row.quota, locale)}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <hr class="receipt-rule" />`
      : "";

  const discountRow = model.showDiscount
    ? `<tr><td>${escapeHtml(texts.discount)}</td><td class="receipt-col-amount">−${model.discountTotal}</td></tr>`
    : "";

  const titleSub = texts.titleSub
    ? `<p class="receipt-title-sub">${escapeHtml(texts.titleSub)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale === "es" ? "es" : "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(settings.businessName)} — ${escapeHtml(texts.title)}</title>
  <style>${RECEIPT_CSS}</style>
</head>
<body>
  <article class="receipt-document">
    <header class="receipt-header">
      <p class="receipt-business-name">${escapeHtml(settings.businessName)}</p>
      ${settings.businessAddress ? `<p class="receipt-meta">${escapeHtml(settings.businessAddress)}</p>` : ""}
      <p class="receipt-meta">
        ${settings.businessPhone ? `${escapeHtml(texts.phoneLabel)}: ${escapeHtml(settings.businessPhone)}` : ""}
        ${settings.businessPhone && settings.taxId ? " · " : ""}
        ${settings.taxId ? `${escapeHtml(texts.taxIdLabel)}: ${escapeHtml(settings.taxId)}` : ""}
      </p>
      ${texts.header ? `<p class="receipt-header-text">${escapeHtml(texts.header)}</p>` : ""}
    </header>
    <hr class="receipt-rule" />
    <div class="receipt-title-block">
      <p class="receipt-title">${escapeHtml(texts.title)}</p>
      ${titleSub}
    </div>
    <hr class="receipt-rule receipt-rule-bold" />
    <section class="receipt-meta-block">
      ${order.receiptNumber ? `<div class="receipt-meta-row"><span class="receipt-label">${escapeHtml(texts.invoiceNumber)}</span><span>${escapeHtml(order.receiptNumber)}</span></div>` : ""}
      <div class="receipt-meta-row"><span class="receipt-label">${escapeHtml(texts.issueDate)}</span><span>${model.paidAtLabel}</span></div>
      ${order.table ? `<div class="receipt-meta-row"><span class="receipt-label">${escapeHtml(texts.table)}</span><span>${escapeHtml(order.table.number)}</span></div>` : ""}
      ${order.type === "TAKEAWAY" ? `<div class="receipt-meta-row"><span class="receipt-label">${escapeHtml(texts.takeaway)}</span><span>✓</span></div>` : ""}
      ${order.type === "ONLINE" ? `<div class="receipt-meta-row"><span class="receipt-label">${escapeHtml(texts.online)}</span><span>✓</span></div>` : ""}
      ${order.paidBy?.name ? `<div class="receipt-meta-row"><span class="receipt-label">${escapeHtml(texts.servedBy)}</span><span>${escapeHtml(order.paidBy.name)}</span></div>` : ""}
    </section>
    <p class="receipt-note">${escapeHtml(texts.vatIncluded)}</p>
    <hr class="receipt-rule" />
    <table class="receipt-table receipt-items-table">
      <thead>
        <tr>
          <th class="receipt-col-concept">${escapeHtml(texts.concept)}</th>
          <th class="receipt-col-qty">${escapeHtml(texts.qty)}</th>
          <th class="receipt-col-amount">${escapeHtml(texts.amount)}</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <hr class="receipt-rule" />
    ${vatSection}
    <table class="receipt-table receipt-totals-table">
      <tbody>
        <tr><td>${escapeHtml(texts.subtotal)}</td><td class="receipt-col-amount">${model.subtotal}</td></tr>
        <tr><td>${escapeHtml(texts.tax)}</td><td class="receipt-col-amount">${model.taxTotal}</td></tr>
        ${discountRow}
        <tr class="receipt-total-final"><td>${escapeHtml(texts.total)}</td><td class="receipt-col-amount">${model.total}</td></tr>
      </tbody>
    </table>
    <hr class="receipt-rule receipt-rule-bold" />
    <p class="receipt-payment">${escapeHtml(texts.payment)}: <strong>${escapeHtml(model.paymentLabel)}</strong></p>
    ${order.cardReference ? `<p class="receipt-meta receipt-center">${escapeHtml(texts.cardRef)}: ${escapeHtml(order.cardReference)}</p>` : ""}
    <p class="receipt-legal">${escapeHtml(texts.legalNote)}</p>
    ${texts.footer ? `<p class="receipt-footer">${escapeHtml(texts.footer)}</p>` : ""}
  </article>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
