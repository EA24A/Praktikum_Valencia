"use client";

import { useLocale, useTranslations } from "next-intl";
import { intlLocaleForUi } from "@/lib/ui-locale";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { ExportButtons } from "@/components/admin/reports/export-buttons";
import { formatCurrency } from "@/lib/calculations";
import type { DateRangePreset } from "@/lib/actions/reports";
import type { getAllReportsData } from "@/lib/actions/reports";

type ReportsData = Awaited<ReturnType<typeof getAllReportsData>>;

interface ReportsPageClientProps {
  data: ReportsData;
  from: string;
  to: string;
  preset: DateRangePreset;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function ReportsPageClient({
  data,
  from,
  to,
  preset,
}: ReportsPageClientProps) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const locale = useLocale();
  const intlLocale = intlLocaleForUi(locale);

  const {
    salesOverview,
    bestSellers,
    peakHours,
    paymentMethods,
    categoryPerformance,
    discountUsage,
    tableTurnover,
    refundsLog,
  } = data;

  const productName = (item: { nameEs: string; nameEn: string; nameDe?: string }) =>
    localizedCatalogName(item, locale);

  const paymentLabel = (method: string | null | undefined) => {
    if (method === "CASH") return t("cash");
    if (method === "CARD") return t("card");
    return tc("empty");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <DateRangePicker from={from} to={to} preset={preset} />
      </div>

      {/* Sales Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("salesOverview")}</CardTitle>
          <ExportButtons
            title={t("salesOverview")}
            headers={[
              t("date"),
              t("revenue"),
              t("cashRevenue"),
              t("onlineRevenue"),
              t("orders"),
            ]}
            rows={salesOverview.dailySales.map((d) => [
              d.date,
              formatCurrency(d.revenue, intlLocale),
              formatCurrency(d.cashRevenue, intlLocale),
              formatCurrency(d.onlineRevenue, intlLocale),
              d.orders,
            ])}
            exportType="sales"
            from={from}
            to={to}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{t("totalRevenue")}</p>
              <p className="text-2xl font-bold">
                <CurrencyDisplay amount={salesOverview.totalRevenue} />
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{t("cashRevenue")}</p>
              <p className="text-2xl font-bold">
                <CurrencyDisplay amount={salesOverview.paymentBreakdown.cash.revenue} />
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{t("onlineRevenue")}</p>
              <p className="text-2xl font-bold">
                <CurrencyDisplay amount={salesOverview.paymentBreakdown.online.revenue} />
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{t("orders")}</p>
              <p className="text-2xl font-bold">{salesOverview.orderCount}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{t("averageTicket")}</p>
              <p className="text-2xl font-bold">
                <CurrencyDisplay amount={salesOverview.averageTicket} />
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesOverview.dailySales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value), intlLocale)
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cashRevenue"
                  name={t("cashRevenue")}
                  stackId="daily"
                  stroke="#10b981"
                  fill="#10b98180"
                />
                <Area
                  type="monotone"
                  dataKey="onlineRevenue"
                  name={t("onlineRevenue")}
                  stackId="daily"
                  stroke="#3b82f6"
                  fill="#3b82f680"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best Sellers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("bestSellers")}</CardTitle>
            <ExportButtons
              title={t("bestSellers")}
              headers={[
                t("product"),
                t("quantity"),
                t("cashRevenue"),
                t("onlineRevenue"),
                t("revenue"),
              ]}
              rows={bestSellers.map((item) => [
                productName(item),
                item.quantity,
                formatCurrency(item.cashRevenue, intlLocale),
                formatCurrency(item.onlineRevenue, intlLocale),
                formatCurrency(item.revenue, intlLocale),
              ])}
              exportType="best-sellers"
              from={from}
              to={to}
            />
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bestSellers.slice(0, 8).map((item) => ({
                    ...item,
                    chartName: productName(item),
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="chartName"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="quantity" name={t("quantity")} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">{t("cashRevenue")}</TableHead>
                  <TableHead className="text-right">{t("onlineRevenue")}</TableHead>
                  <TableHead className="text-right">{t("revenue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestSellers.slice(0, 10).map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>{productName(item)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={item.cashRevenue} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={item.onlineRevenue} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={item.revenue} />
                    </TableCell>
                  </TableRow>
                ))}
                {bestSellers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("peakHours")}</CardTitle>
            <ExportButtons
              title={t("peakHours")}
              headers={[t("hour"), t("orders"), t("revenue")]}
              rows={peakHours
                .filter((h) => h.orders > 0)
                .map((h) => [
                  h.label,
                  h.orders,
                  formatCurrency(h.revenue, intlLocale),
                ])}
              exportType="peak-hours"
              from={from}
              to={to}
            />
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours.filter((h) => h.orders > 0 || h.hour >= 8 && h.hour <= 23)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) =>
                      String(name) === t("revenue")
                        ? formatCurrency(Number(value), intlLocale)
                        : Number(value)
                    }
                  />
                  <Bar dataKey="orders" name={t("orders")} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("paymentMethods")}</CardTitle>
          <ExportButtons
            title={t("paymentMethods")}
            headers={[t("method"), t("orders"), t("revenue")]}
            rows={paymentMethods.map((p) => [
              paymentLabel(p.method),
              p.orders,
              formatCurrency(p.revenue, intlLocale),
            ])}
            exportType="payment-methods"
            from={from}
            to={to}
          />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods.map((p) => ({
                    name: paymentLabel(p.method),
                    value: p.revenue,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {paymentMethods.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value), intlLocale)
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("categoryPerformance")}</CardTitle>
            <ExportButtons
              title={t("categoryPerformance")}
              headers={[
                t("category"),
                t("quantity"),
                t("cashRevenue"),
                t("onlineRevenue"),
                t("revenue"),
              ]}
              rows={categoryPerformance.map((c) => [
                productName(c),
                c.quantity,
                formatCurrency(c.cashRevenue, intlLocale),
                formatCurrency(c.onlineRevenue, intlLocale),
                formatCurrency(c.revenue, intlLocale),
              ])}
              exportType="category-performance"
              from={from}
              to={to}
            />
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryPerformance.map((item) => ({
                    ...item,
                    chartName: productName(item),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="chartName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantity" name={t("quantity")} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">{t("cashRevenue")}</TableHead>
                  <TableHead className="text-right">{t("onlineRevenue")}</TableHead>
                  <TableHead className="text-right">{t("revenue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryPerformance.map((c) => (
                  <TableRow key={c.categoryId}>
                    <TableCell>{productName(c)}</TableCell>
                    <TableCell className="text-right">{c.quantity}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={c.cashRevenue} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={c.onlineRevenue} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={c.revenue} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Discount Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("discountUsage")}</CardTitle>
            <ExportButtons
              title={t("discountUsage")}
              headers={[t("discount"), t("uses"), t("totalSaved")]}
              rows={discountUsage.map((d) => [
                productName(d),
                d.uses,
                formatCurrency(d.totalSaved, intlLocale),
              ])}
              exportType="discount-usage"
              from={from}
              to={to}
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("discount")}</TableHead>
                  <TableHead className="text-right">{t("uses")}</TableHead>
                  <TableHead className="text-right">{t("totalSaved")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountUsage.map((d) => (
                  <TableRow key={d.discountId}>
                    <TableCell>{productName(d)}</TableCell>
                    <TableCell className="text-right">{d.uses}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={d.totalSaved} />
                    </TableCell>
                  </TableRow>
                ))}
                {discountUsage.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Table Turnover */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("tableTurnover")}</CardTitle>
          <ExportButtons
            title={t("tableTurnover")}
            headers={[
              t("table"),
              t("turns"),
              t("cashRevenue"),
              t("onlineRevenue"),
              t("revenue"),
              t("avgDuration"),
            ]}
            rows={tableTurnover.map((row) => [
              row.tableNumber,
              row.turns,
              formatCurrency(row.cashRevenue, intlLocale),
              formatCurrency(row.onlineRevenue, intlLocale),
              formatCurrency(row.totalRevenue, intlLocale),
              t("durationMinutes", { count: row.avgDurationMinutes }),
            ])}
            exportType="table-turnover"
            from={from}
            to={to}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table")}</TableHead>
                <TableHead className="text-right">{t("turns")}</TableHead>
                <TableHead className="text-right">{t("cashRevenue")}</TableHead>
                <TableHead className="text-right">{t("onlineRevenue")}</TableHead>
                <TableHead className="text-right">{t("revenue")}</TableHead>
                <TableHead className="text-right">{t("avgDuration")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableTurnover.map((row) => (
                <TableRow key={row.tableId}>
                  <TableCell>{row.tableNumber}</TableCell>
                  <TableCell className="text-right">{row.turns}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.cashRevenue} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.onlineRevenue} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.totalRevenue} />
                  </TableCell>
                  <TableCell className="text-right">
                    {t("durationMinutes", { count: row.avgDurationMinutes })}
                  </TableCell>
                </TableRow>
              ))}
              {tableTurnover.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Refunds Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("refundsLog")}</CardTitle>
          <ExportButtons
            title={t("refundsLog")}
            headers={[
              t("date"),
              t("receipt"),
              t("method"),
              t("amount"),
              t("reason"),
              t("issuedBy"),
            ]}
            rows={refundsLog.map((r) => [
              new Date(r.createdAt).toLocaleString(intlLocale),
              r.receiptNumber ?? tc("empty"),
              paymentLabel(r.paymentMethod),
              formatCurrency(r.amount, intlLocale),
              r.reason,
              r.issuedByName,
            ])}
            exportType="refunds"
            from={from}
            to={to}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("receipt")}</TableHead>
                <TableHead>{t("method")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
                <TableHead>{t("reason")}</TableHead>
                <TableHead>{t("issuedBy")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundsLog.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {new Date(r.createdAt).toLocaleString(intlLocale)}
                  </TableCell>
                  <TableCell>{r.receiptNumber ?? tc("empty")}</TableCell>
                  <TableCell>{paymentLabel(r.paymentMethod)}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={r.amount} />
                  </TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell>{r.issuedByName}</TableCell>
                </TableRow>
              ))}
              {refundsLog.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
