"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TodayStats {
  ordersCreated: number;
  ordersPaid: number;
  revenue: number;
  averageTicket: number;
}

export function EmployeeProfileClient() {
  const t = useTranslations("employee");
  const tc = useTranslations("common");
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-semibold">{t("profile")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("todayStats")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : stats ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>{t("ordersCreated")}</dt>
                <dd className="font-medium">{stats.ordersCreated}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("ordersPaid")}</dt>
                <dd className="font-medium">{stats.ordersPaid}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{tc("total")}</dt>
                <dd className="font-medium">
                  <CurrencyDisplay amount={stats.revenue} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("averageTicket")}</dt>
                <dd className="font-medium">
                  <CurrencyDisplay amount={stats.averageTicket} />
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground">{t("statsUnavailable")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
