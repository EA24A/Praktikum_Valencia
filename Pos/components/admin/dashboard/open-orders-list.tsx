"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
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
import { formatElapsedMinutes } from "@/lib/i18n/format-elapsed";
import { cn } from "@/lib/utils";

interface OpenOrder {
  id: string;
  tableNumber: string | null;
  type: string;
  total: number;
  createdAt: string;
  createdByName: string;
  elapsedMinutes: number;
}

interface OpenOrdersListProps {
  orders: OpenOrder[];
}

function elapsedColor(minutes: number) {
  if (minutes < 15) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (minutes < 30) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

function formatElapsed(minutes: number, locale: string, t: ReturnType<typeof useTranslations>) {
  return formatElapsedMinutes(minutes, t, locale);
}

export function OpenOrdersList({ orders }: OpenOrdersListProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("openOrders")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("employee")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
              <TableHead className="text-right">{t("elapsed")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  {order.tableNumber ??
                    (order.type === "ONLINE"
                      ? t("online")
                      : order.type === "TAKEAWAY"
                        ? t("takeaway")
                        : tc("empty"))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {order.type === "DINE_IN"
                      ? t("dineIn")
                      : order.type === "ONLINE"
                        ? t("online")
                        : t("takeaway")}
                  </Badge>
                </TableCell>
                <TableCell>{order.createdByName}</TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={order.total} />
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      elapsedColor(order.elapsedMinutes),
                    )}
                  >
                    {formatElapsed(order.elapsedMinutes, locale, t)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("noOpenOrders")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
