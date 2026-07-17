"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDuration, intervalToDuration } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClockInStatus } from "@/hooks/use-clock-in";

function formatClockDuration(seconds: number, locale: string) {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  return formatDuration(duration, {
    locale: dateFnsLocaleForUi(locale),
  });
}

export function ClockPanel() {
  const t = useTranslations("employee");
  const locale = useLocale();
  const { isClockedIn, duration, isLoading, refresh } = useClockInStatus();

  const handleClockIn = async () => {
    const response = await fetch("/api/time-entries/clock-in", {
      method: "POST",
    });
    if (!response.ok) {
      toast.error("Clock-in failed");
      return;
    }
    toast.success(t("clockIn"));
    refresh();
  };

  const handleClockOut = async () => {
    const response = await fetch("/api/time-entries/clock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "" }),
    });
    if (!response.ok) {
      toast.error("Clock-out failed");
      return;
    }
    toast.success(t("clockOut"));
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isClockedIn ? t("clockOut") : t("clockIn")}</CardTitle>
        <CardDescription>
          {isClockedIn
            ? `${t("clockedInSince")}: ${formatClockDuration(duration, locale)}`
            : t("mustClockIn")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          size="lg"
          className="h-16 w-full text-lg"
          variant={isClockedIn ? "destructive" : "default"}
          disabled={isLoading}
          onClick={isClockedIn ? handleClockOut : handleClockIn}
        >
          {isClockedIn ? t("clockOut") : t("clockIn")}
        </Button>
        {isClockedIn && (
          <Link
            href="/employee/pos"
            className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            {t("pos")}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
