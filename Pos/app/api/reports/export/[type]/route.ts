import { NextResponse } from "next/server";
import {
  getBestSellers,
  getCategoryPerformance,
  getDiscountUsage,
  getEmployeePerformance,
  getPaymentMethods,
  getPeakHours,
  getRefundsLog,
  getSalesOverview,
  getTableTurnover,
} from "@/lib/actions/reports";
import { getRangeFromRequest, requireReportsAccess } from "@/lib/api/reports-route";

const EXPORT_TYPES = {
  sales: getSalesOverview,
  "best-sellers": getBestSellers,
  "peak-hours": getPeakHours,
  "employee-performance": getEmployeePerformance,
  "payment-methods": getPaymentMethods,
  "category-performance": getCategoryPerformance,
  "discount-usage": getDiscountUsage,
  "table-turnover": getTableTurnover,
  refunds: getRefundsLog,
} as const;

type ExportType = keyof typeof EXPORT_TYPES;

function flattenForCsv(type: ExportType, data: unknown): string[][] {
  switch (type) {
    case "sales": {
      const d = data as Awaited<ReturnType<typeof getSalesOverview>>;
      return [
        ["Metric", "Value"],
        ["Total Revenue", String(d.totalRevenue)],
        ["Cash Revenue", String(d.paymentBreakdown.cash.revenue)],
        ["Online Revenue", String(d.paymentBreakdown.online.revenue)],
        ["Order Count", String(d.orderCount)],
        ["Average Ticket", String(d.averageTicket)],
        [],
        ["Date", "Revenue", "Cash Revenue", "Online Revenue", "Orders"],
        ...d.dailySales.map((row) => [
          row.date,
          String(row.revenue),
          String(row.cashRevenue),
          String(row.onlineRevenue),
          String(row.orders),
        ]),
      ];
    }
    case "best-sellers": {
      const rows = data as Awaited<ReturnType<typeof getBestSellers>>;
      return [
        ["Product (ES)", "Product (EN)", "Quantity", "Cash Revenue", "Online Revenue", "Revenue"],
        ...rows.map((r) => [
          r.nameEs,
          r.nameEn,
          String(r.quantity),
          String(r.cashRevenue),
          String(r.onlineRevenue),
          String(r.revenue),
        ]),
      ];
    }
    case "peak-hours": {
      const rows = data as Awaited<ReturnType<typeof getPeakHours>>;
      return [
        ["Hour", "Orders", "Revenue", "Cash Revenue", "Online Revenue"],
        ...rows.map((r) => [
          r.label,
          String(r.orders),
          String(r.revenue),
          String(r.cashRevenue),
          String(r.onlineRevenue),
        ]),
      ];
    }
    case "employee-performance": {
      const rows = data as Awaited<ReturnType<typeof getEmployeePerformance>>;
      return [
        ["Employee", "Orders", "Cash Revenue", "Online Revenue", "Revenue"],
        ...rows.map((r) => [
          r.name,
          String(r.orders),
          String(r.cashRevenue),
          String(r.onlineRevenue),
          String(r.revenue),
        ]),
      ];
    }
    case "payment-methods": {
      const rows = data as Awaited<ReturnType<typeof getPaymentMethods>>;
      return [
        ["Method", "Orders", "Revenue"],
        ...rows.map((r) => [
          r.method === "CASH" ? "Cash" : "Card",
          String(r.orders),
          String(r.revenue),
        ]),
      ];
    }
    case "category-performance": {
      const rows = data as Awaited<ReturnType<typeof getCategoryPerformance>>;
      return [
        ["Category (ES)", "Category (EN)", "Quantity", "Cash Revenue", "Online Revenue", "Revenue"],
        ...rows.map((r) => [
          r.nameEs,
          r.nameEn,
          String(r.quantity),
          String(r.cashRevenue),
          String(r.onlineRevenue),
          String(r.revenue),
        ]),
      ];
    }
    case "discount-usage": {
      const rows = data as Awaited<ReturnType<typeof getDiscountUsage>>;
      return [
        ["Discount (ES)", "Discount (EN)", "Type", "Uses", "Total Saved"],
        ...rows.map((r) => [
          r.nameEs,
          r.nameEn,
          r.type,
          String(r.uses),
          String(r.totalSaved),
        ]),
      ];
    }
    case "table-turnover": {
      const rows = data as Awaited<ReturnType<typeof getTableTurnover>>;
      return [
        ["Table", "Turns", "Cash Revenue", "Online Revenue", "Revenue", "Avg Duration (min)"],
        ...rows.map((r) => [
          r.tableNumber,
          String(r.turns),
          String(r.cashRevenue),
          String(r.onlineRevenue),
          String(r.totalRevenue),
          String(r.avgDurationMinutes),
        ]),
      ];
    }
    case "refunds": {
      const rows = data as Awaited<ReturnType<typeof getRefundsLog>>;
      return [
        ["Date", "Receipt", "Payment Method", "Amount", "Reason", "Issued By"],
        ...rows.map((r) => [
          r.createdAt,
          r.receiptNumber ?? "",
          r.paymentMethod === "CASH" ? "Cash" : r.paymentMethod === "CARD" ? "Card" : "",
          String(r.amount),
          r.reason,
          r.issuedByName,
        ]),
      ];
    }
    default:
      return [["No data"]];
  }
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    )
    .join("\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const access = await requireReportsAccess();
  if ("error" in access) return access.error;

  const { type } = await params;
  const exportType = type as ExportType;
  const fetcher = EXPORT_TYPES[exportType];

  if (!fetcher) {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  const range = getRangeFromRequest(request);
  const data = await fetcher(range);
  const csv = toCsv(flattenForCsv(exportType, data));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-report.csv"`,
    },
  });
}
