import { buildReceiptModel, money } from "@/lib/receipt/format-receipt";
import type { ReceiptDocumentProps } from "@/lib/receipt/types";

export function ReceiptDocument({
  order,
  settings,
  locale,
  splitIndex = null,
}: ReceiptDocumentProps) {
  const model = buildReceiptModel({ order, settings, locale, splitIndex });
  const { texts, lineItems, vatBreakdown } = model;

  return (
    <article className="receipt-document">
      <header className="receipt-header">
        <p className="receipt-business-name">{settings.businessName}</p>
        {settings.businessAddress ? (
          <p className="receipt-meta">{settings.businessAddress}</p>
        ) : null}
        <p className="receipt-meta">
          {settings.businessPhone ? (
            <>
              {texts.phoneLabel}: {settings.businessPhone}
              {settings.taxId ? " · " : null}
            </>
          ) : null}
          {settings.taxId ? (
            <>
              {texts.taxIdLabel}: {settings.taxId}
            </>
          ) : null}
        </p>
        {texts.header ? <p className="receipt-header-text">{texts.header}</p> : null}
      </header>

      <div className="receipt-rule" />

      <div className="receipt-title-block">
        <p className="receipt-title">{texts.title}</p>
        {texts.titleSub ? <p className="receipt-title-sub">{texts.titleSub}</p> : null}
      </div>

      <div className="receipt-rule receipt-rule-bold" />

      <section className="receipt-meta-block">
        {order.receiptNumber ? (
          <div className="receipt-meta-row">
            <span className="receipt-label">{texts.invoiceNumber}</span>
            <span>{order.receiptNumber}</span>
          </div>
        ) : null}
        <div className="receipt-meta-row">
          <span className="receipt-label">{texts.issueDate}</span>
          <span>{model.paidAtLabel}</span>
        </div>
        {order.table ? (
          <div className="receipt-meta-row">
            <span className="receipt-label">{texts.table}</span>
            <span>{order.table.number}</span>
          </div>
        ) : null}
        {order.type === "TAKEAWAY" ? (
          <div className="receipt-meta-row">
            <span className="receipt-label">{texts.takeaway}</span>
            <span>✓</span>
          </div>
        ) : null}
        {order.type === "ONLINE" ? (
          <div className="receipt-meta-row">
            <span className="receipt-label">{texts.online}</span>
            <span>✓</span>
          </div>
        ) : null}
        {model.splitLabel ? (
          <div className="receipt-meta-row">
            <span className="receipt-label">{texts.splitReceipt}</span>
            <span>{model.splitLabel}</span>
          </div>
        ) : null}
        {order.paidBy?.name ? (
          <div className="receipt-meta-row">
            <span className="receipt-label">{texts.servedBy}</span>
            <span>{order.paidBy.name}</span>
          </div>
        ) : null}
      </section>

      <p className="receipt-note">{texts.vatIncluded}</p>

      <div className="receipt-rule" />

      <table className="receipt-table receipt-items-table">
        <thead>
          <tr>
            <th className="receipt-col-concept">{texts.concept}</th>
            <th className="receipt-col-qty">{texts.qty}</th>
            <th className="receipt-col-amount">{texts.amount}</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.id}>
              <td className="receipt-col-concept">
                <span className="receipt-item-name">{item.name}</span>
                {item.nameSecondary ? (
                  <span className="receipt-item-name-sub">{item.nameSecondary}</span>
                ) : null}
                <span className="receipt-item-detail">
                  {item.quantity} × {money(item.unitPrice, locale)}
                  {item.taxRate > 0 ? ` · IVA ${item.taxRate}%` : null}
                </span>
                {item.customReason ? (
                  <span className="receipt-item-reason">{item.customReason}</span>
                ) : null}
              </td>
              <td className="receipt-col-qty">{item.quantity}</td>
              <td className="receipt-col-amount">{money(item.total, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-rule" />

      {vatBreakdown.length > 0 ? (
        <>
          <p className="receipt-section-title">{texts.vatSummary}</p>
          <table className="receipt-table receipt-vat-table">
            <thead>
              <tr>
                <th>{texts.vatType}</th>
                <th className="receipt-col-amount">{texts.vatBase}</th>
                <th className="receipt-col-amount">{texts.vatQuota}</th>
              </tr>
            </thead>
            <tbody>
              {vatBreakdown.map((row) => (
                <tr key={row.rate}>
                  <td>{row.rate > 0 ? `${row.rate}%` : "0%"}</td>
                  <td className="receipt-col-amount">{money(row.base, locale)}</td>
                  <td className="receipt-col-amount">{money(row.quota, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="receipt-rule" />
        </>
      ) : null}

      <table className="receipt-table receipt-totals-table">
        <tbody>
          <tr>
            <td>{texts.subtotal}</td>
            <td className="receipt-col-amount">{model.subtotal}</td>
          </tr>
          <tr>
            <td>{texts.tax}</td>
            <td className="receipt-col-amount">{model.taxTotal}</td>
          </tr>
          {model.showDiscount ? (
            <tr>
              <td>{texts.discount}</td>
              <td className="receipt-col-amount">−{model.discountTotal}</td>
            </tr>
          ) : null}
          <tr className="receipt-total-final">
            <td>{texts.total}</td>
            <td className="receipt-col-amount">{model.total}</td>
          </tr>
        </tbody>
      </table>

      <div className="receipt-rule receipt-rule-bold" />

      <p className="receipt-payment">
        {texts.payment}: <strong>{model.paymentLabel}</strong>
      </p>
      {order.cardReference ? (
        <p className="receipt-meta receipt-center">
          {texts.cardRef}: {order.cardReference}
        </p>
      ) : null}

      <p className="receipt-legal">{texts.legalNote}</p>

      {texts.footer ? <p className="receipt-footer">{texts.footer}</p> : null}
    </article>
  );
}
