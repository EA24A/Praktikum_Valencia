"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";

interface KpiCardsProps {
  todaySalesCash: number;
  todaySalesOnline: number;
  todayOrders: number;
  activeTables: number;
  clockedIn: number;
}

export function KpiCards({
  todaySalesCash,
  todaySalesOnline,
  todayOrders,
  activeTables,
  clockedIn,
}: KpiCardsProps) {
  const t = useTranslations("admin");

  const items = [
    {
      label: t("cashSalesToday"),
      value: (
        <CurrencyDisplay amount={todaySalesCash} className="text-2xl font-bold" />
      ),
    },
    {
      label: t("onlineSalesToday"),
      value: (
        <CurrencyDisplay amount={todaySalesOnline} className="text-2xl font-bold" />
      ),
    },
    {
      label: t("todayOrders"),
      value: <p className="text-2xl font-bold">{todayOrders}</p>,
    },
    {
      label: t("activeTables"),
      value: <p className="text-2xl font-bold">{activeTables}</p>,
    },
    {
      label: t("clockedIn"),
      value: <p className="text-2xl font-bold">{clockedIn}</p>,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map(({ label, value }) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>{value}</CardContent>
        </Card>
      ))}
    </div>
  );
}
