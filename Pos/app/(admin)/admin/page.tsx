import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Package,
  Grid3X3,
  BarChart3,
  Percent,
} from "lucide-react";
import {
  getDashboardKpis,
  getHourlySalesToday,
  getOpenOrders,
} from "@/lib/actions/reports";
import { KpiCards } from "@/components/admin/dashboard/kpi-cards";
import { OpenOrdersList } from "@/components/admin/dashboard/open-orders-list";
import { HourlySalesChart } from "@/components/admin/dashboard/hourly-sales-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");

  const [kpis, openOrders, hourlySales] = await Promise.all([
    getDashboardKpis(),
    getOpenOrders(),
    getHourlySalesToday(),
  ]);

  const quickLinks = [
    { href: "/admin/products", label: t("products"), icon: Package },
    { href: "/admin/tables", label: t("tables"), icon: Grid3X3 },
    { href: "/admin/reports", label: t("reports"), icon: BarChart3 },
    { href: "/admin/discounts", label: t("discounts"), icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard")}</h1>
      </div>

      <KpiCards
        todaySalesCash={kpis.todaySalesCash}
        todaySalesOnline={kpis.todaySalesOnline}
        todayOrders={kpis.todayOrders}
        activeTables={kpis.activeTables}
        clockedIn={kpis.clockedIn}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <OpenOrdersList orders={openOrders} />
        <HourlySalesChart data={hourlySales} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
