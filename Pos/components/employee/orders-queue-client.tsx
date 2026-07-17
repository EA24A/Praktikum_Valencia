"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Check, ChefHat, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatElapsedMinutes } from "@/lib/i18n/format-elapsed";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import type { KitchenOrder, KitchenOrdersSummary } from "@/lib/actions/kitchen-orders";

async function fetchKitchenOrders(): Promise<KitchenOrdersSummary> {
  const response = await fetch("/api/kitchen-orders", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load orders");
  }
  return response.json();
}

async function updateKitchenOrder(orderId: string, completed: boolean): Promise<KitchenOrder> {
  const response = await fetch(`/api/kitchen-orders/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  if (!response.ok) {
    throw new Error("Failed to update order");
  }
  return response.json();
}

async function markAllKitchenOrdersDone(): Promise<number> {
  const response = await fetch("/api/kitchen-orders/complete-all", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to mark all orders done");
  }
  const data = (await response.json()) as { count: number };
  return data.count;
}

function itemName(item: KitchenOrder["items"][number], locale: string) {
  if (locale === "de") return item.nameDe || item.nameEn;
  if (locale === "es") return item.nameEs;
  return item.nameEn;
}

function orderLabel(order: KitchenOrder, t: ReturnType<typeof useTranslations>) {
  if (order.type === "ONLINE") return t("online");
  if (order.type === "TAKEAWAY") return t("takeaway");
  return order.tableNumber ? t("tableNumber", { number: order.tableNumber }) : t("dineIn");
}

function elapsedColor(minutes: number) {
  if (minutes < 15) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (minutes < 30) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

function OrderCard({
  order,
  completed,
  updating,
  onToggle,
}: {
  order: KitchenOrder;
  completed: boolean;
  updating: boolean;
  onToggle: (completed: boolean) => void;
}) {
  const t = useTranslations("employeeOrders");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);
  const createdAt = parseISO(order.createdAt);
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / 60_000),
  );

  return (
    <Card className={cn(completed && "opacity-75")}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <ChefHat className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span>{orderLabel(order, t)}</span>
            <Badge variant="outline">
              {order.type === "DINE_IN"
                ? t("dineIn")
                : order.type === "ONLINE"
                  ? t("online")
                  : t("takeaway")}
            </Badge>
            {order.status === "PAID" ? (
              <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
                {t("paid")}
              </Badge>
            ) : null}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{format(createdAt, "HH:mm", { locale: dateLocale })}</span>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                elapsedColor(elapsedMinutes),
              )}
            >
              {formatElapsedMinutes(elapsedMinutes, t, locale)}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant={completed ? "outline" : "default"}
          size="lg"
          className="shrink-0 gap-2"
          disabled={updating}
          onClick={() => onToggle(!completed)}
        >
          {updating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Check className="h-5 w-5" />
          )}
          {completed ? t("markPending") : t("markDone")}
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                completed && "line-through opacity-70",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Checkbox checked={completed} disabled className="pointer-events-none" />
                <span className="truncate font-medium">{itemName(item, locale)}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">×{item.quantity}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function OrdersQueueClient() {
  const t = useTranslations("employeeOrders");
  const [data, setData] = useState<KitchenOrdersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const summary = await fetchKitchenOrders();
      setData(summary);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const handleToggle = async (orderId: string, completed: boolean) => {
    setUpdatingId(orderId);
    try {
      await updateKitchenOrder(orderId, completed);
      await refresh();
      toast.success(completed ? t("markedDone") : t("markedPending"));
    } catch {
      toast.error(t("updateError"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAllDone = async () => {
    setMarkingAll(true);
    try {
      const count = await markAllKitchenOrdersDone();
      await refresh();
      toast.success(t("markAllDoneSuccess", { count }));
    } catch {
      toast.error(t("markAllDoneError"));
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6">
        <p className="text-muted-foreground">{t("loadError")}</p>
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const pending = data?.pending ?? [];
  const completed = data?.completed ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t("pendingSection", { count: pending.length })}
          </h2>
          {pending.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={markingAll || updatingId != null}
              onClick={() => void handleMarkAllDone()}
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {t("markAllDone")}
            </Button>
          ) : null}
        </div>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("noPendingOrders")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                completed={false}
                updating={updatingId === order.id}
                onToggle={(done) => void handleToggle(order.id, done)}
              />
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t("completedSection", { count: completed.length })}
          </h2>
          <div className="space-y-4">
            {completed.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                completed
                updating={updatingId === order.id}
                onToggle={(done) => void handleToggle(order.id, done)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
