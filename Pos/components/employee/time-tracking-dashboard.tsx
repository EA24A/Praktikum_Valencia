"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RosterItem {
  id: string;
  name: string;
  isClockedIn: boolean;
  clockIn: string | null;
}

interface TodayEntry {
  id: string;
  userId: string;
  userName: string;
  clockIn: string;
  clockOut: string | null;
  note: string | null;
}

function toLocalDatetimeValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimeTrackingDashboard() {
  const t = useTranslations("employee");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);

  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [entries, setEntries] = useState<TodayEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [manualClockIn, setManualClockIn] = useState(toLocalDatetimeValue());
  const [manualClockOut, setManualClockOut] = useState("");
  const [note, setNote] = useState("");

  const selected = roster.find((e) => e.id === selectedId);

  const refresh = useCallback(async () => {
    const [rosterRes, entriesRes] = await Promise.all([
      fetch("/api/time-entries/roster"),
      fetch("/api/time-entries/today"),
    ]);
    if (rosterRes.ok) {
      const data = await rosterRes.json();
      setRoster(data.roster ?? []);
    }
    if (entriesRes.ok) {
      const data = await entriesRes.json();
      setEntries(data.entries ?? []);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const postAction = async (payload: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/time-entries/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? t("timeLogError"));
        return;
      }
      toast.success(t("timeLogSaved"));
      setNote("");
      setManualClockOut("");
      setManualClockIn(toLocalDatetimeValue());
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (iso: string) =>
    format(new Date(iso), "PPp", { locale: dateLocale });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">{t("loadingRoster")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("timeTracking")}</h1>
          <p className="text-muted-foreground">{t("timeTrackingDesc")}</p>
        </div>
        <Link
          href="/employee/pos"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("pos")}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("selectEmployee")}</CardTitle>
            <CardDescription>{t("selectEmployeeDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noEmployees")}</p>
            ) : (
              roster.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => setSelectedId(employee.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                    selectedId === employee.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50",
                  )}
                >
                  <span className="font-medium">{employee.name}</span>
                  <Badge variant={employee.isClockedIn ? "default" : "secondary"}>
                    {employee.isClockedIn ? t("onShift") : t("offShift")}
                  </Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selected ? selected.name : t("logTime")}
            </CardTitle>
            <CardDescription>{t("logTimeDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">{t("pickEmployeeFirst")}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="min-h-12 gap-2"
                    disabled={submitting || selected.isClockedIn}
                    onClick={() =>
                      postAction({ action: "clock-in", userId: selected.id })
                    }
                  >
                    <LogIn className="h-4 w-4" />
                    {t("arrivalNow")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="min-h-12 gap-2"
                    disabled={submitting || !selected.isClockedIn}
                    onClick={() =>
                      postAction({ action: "clock-out", userId: selected.id, note })
                    }
                  >
                    <LogOut className="h-4 w-4" />
                    {t("departureNow")}
                  </Button>
                </div>

                {selected.isClockedIn && selected.clockIn && (
                  <p className="text-sm text-muted-foreground">
                    {t("clockedInSince")}: {formatTime(selected.clockIn)}
                  </p>
                )}

                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">{t("manualEntry")}</p>
                  <div className="space-y-2">
                    <Label htmlFor="clock-in">{t("arrivalTime")}</Label>
                    <Input
                      id="clock-in"
                      type="datetime-local"
                      value={manualClockIn}
                      onChange={(e) => setManualClockIn(e.target.value)}
                      className="min-h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clock-out">{t("departureTime")}</Label>
                    <Input
                      id="clock-out"
                      type="datetime-local"
                      value={manualClockOut}
                      onChange={(e) => setManualClockOut(e.target.value)}
                      className="min-h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">{t("clockOutNote")}</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button
                    className="w-full min-h-11"
                    variant="secondary"
                    disabled={submitting}
                    onClick={() =>
                      postAction({
                        action: "log",
                        userId: selected.id,
                        clockIn: new Date(manualClockIn).toISOString(),
                        clockOut: manualClockOut
                          ? new Date(manualClockOut).toISOString()
                          : undefined,
                        note,
                      })
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {t("saveTimeEntry")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("todayEntries")}</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noEntriesToday")}</p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <div>
                    <span className="font-medium">{entry.userName}</span>
                    {entry.note && (
                      <span className="ml-2 text-muted-foreground">— {entry.note}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {formatTime(entry.clockIn)}
                    {" → "}
                    {entry.clockOut ? formatTime(entry.clockOut) : t("stillWorking")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
