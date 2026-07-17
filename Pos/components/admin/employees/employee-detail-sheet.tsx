"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserListItem, UserPerformanceStats } from "@/lib/actions/users";
import { formatTotalHours } from "@/lib/timesheet-utils";
import { CurrencyDisplay } from "@/components/shared/currency-display";

interface EmployeeDetailSheetProps {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailSheet({
  user,
  open,
  onOpenChange,
}: EmployeeDetailSheetProps) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const [stats, setStats] = useState<UserPerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) {
      setStats(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/users/${user.id}/stats`)
      .then((res) => res.json())
      .then((data: { stats?: UserPerformanceStats }) => {
        if (!cancelled) {
          setStats(data.stats ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{user.name}</SheetTitle>
          <SheetDescription>{user.email}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={user.isActive ? "default" : "destructive"}>
            {user.isActive ? tc("active") : tc("inactive")}
          </Badge>
          <Badge variant="outline">
            {user.role === "SUPERADMIN" ? t("roleSuperadmin") : t("roleEmployee")}
          </Badge>
          {user.isClockedIn && (
            <Badge variant="secondary">{t("clockedIn")}</Badge>
          )}
          {user.isOwner && (
            <Badge variant="outline">{t("ownerBadge")}</Badge>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium">{t("performanceStats")}</h3>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats ? (
            <dl className="grid gap-3">
              <StatRow
                label={t("monthHours")}
                value={t("hoursShort", {
                  hours: formatTotalHours(stats.totalHours) || "0",
                })}
              />
              <StatRow label={t("timeEntries")} value={String(stats.entriesCount)} />
              <StatRow label={t("ordersCreated")} value={String(stats.ordersCreated)} />
              <StatRow label={t("ordersPaid")} value={String(stats.ordersPaid)} />
              <StatRow
                label={t("totalRevenue")}
                value={<CurrencyDisplay amount={stats.totalRevenue} />}
              />
              <StatRow
                label={t("cashRevenue")}
                value={<CurrencyDisplay amount={stats.cashRevenue} />}
              />
              <StatRow
                label={t("onlineRevenue")}
                value={<CurrencyDisplay amount={stats.onlineRevenue} />}
              />
              <StatRow
                label={t("averageTicket")}
                value={<CurrencyDisplay amount={stats.averageTicket} />}
              />
              <StatRow
                label={t("openShift")}
                value={stats.openShift ? tc("yes") : tc("no")}
              />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{t("statsUnavailable")}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
