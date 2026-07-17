"use client";

import { useLocale, useTranslations } from "next-intl";
import { intlLocaleForUi } from "@/lib/ui-locale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
import { formatCurrency } from "@/lib/calculations";

interface HourlySalesChartProps {
  data: Array<{
    hour: number;
    label: string;
    orders: number;
    revenue: number;
    cashRevenue: number;
    onlineRevenue: number;
  }>;
}

export function HourlySalesChart({ data }: HourlySalesChartProps) {
  const t = useTranslations("admin");
  const tr = useTranslations("reports");
  const locale = useLocale();
  const intlLocale = intlLocaleForUi(locale);

  const chartData = data.filter((h) => h.hour >= 6 && h.hour <= 23);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("hourlySales")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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
                name={tr("cashRevenue")}
                stackId="sales"
                stroke="#10b981"
                fill="#10b98180"
              />
              <Area
                type="monotone"
                dataKey="onlineRevenue"
                name={tr("onlineRevenue")}
                stackId="sales"
                stroke="#3b82f6"
                fill="#3b82f680"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
