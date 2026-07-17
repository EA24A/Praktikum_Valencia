"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, isAfter, startOfDay } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { toast } from "sonner";
import { CalendarDays, ChevronDown, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TimesheetHourSelect } from "@/components/shared/timesheet-hour-select";
import {
  FULL_DAY_FROM,
  FULL_DAY_TO,
  cellToDraft,
  draftTotalHours,
  formatSheetDate,
  formatTotalHours,
  fromHourOptions,
  isValidShiftRange,
  isShiftHour,
  toHourOptions,
  type TimesheetCellDraft,
} from "@/lib/timesheet-utils";
import type { MonthTimesheet, TimesheetCell } from "@/lib/actions/timesheet";

export function AdminTimesheetTab({ reloadKey = 0 }: { reloadKey?: number }) {
  const t = useTranslations("timeTracking");
  const te = useTranslations("employee");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);

  const now = new Date();
  const [sheet, setSheet] = useState<MonthTimesheet | null>(null);
  const [drafts, setDrafts] = useState<Record<string, TimesheetCellDraft>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  const monthLabel = useMemo(
    () =>
      format(new Date(now.getFullYear(), now.getMonth(), 1), "MMMM yyyy", {
        locale: dateLocale,
      }),
    [now, dateLocale],
  );

  const loadSheet = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/time-entries/timesheet/admin", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as MonthTimesheet;
      setSheet(data);

      const nextDrafts: Record<string, TimesheetCellDraft> = {};
      for (const day of data.days) {
        for (const worker of data.workers) {
          const key = `${day.date}:${worker.id}`;
          nextDrafts[key] = cellToDraft(day.cells[worker.id]);
        }
      }
      setDrafts(nextDrafts);
    } catch {
      setSheet(null);
      setLoadError(true);
      toast.error(t("timesheetLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSheet();
  }, [loadSheet, reloadKey]);

  const saveCell = async (
    date: string,
    userId: string,
    patch?: Partial<TimesheetCellDraft>,
  ) => {
    const key = `${date}:${userId}`;
    const draft = { ...(drafts[key] ?? { fromHour: "", toHour: "" }), ...patch };

    const fromRaw = draft.fromHour.trim();
    const toRaw = draft.toHour.trim();
    const fromHour = fromRaw === "" ? null : Number(fromRaw);
    const toHour = toRaw === "" ? null : Number(toRaw);

    if (
      (fromHour != null && !isShiftHour(fromHour)) ||
      (toHour != null && !isShiftHour(toHour))
    ) {
      toast.error(te("timesheetInvalidHours"));
      return;
    }

    if (fromHour != null && toHour != null && !isValidShiftRange(fromHour, toHour)) {
      toast.error(te("timesheetInvalidRange"));
      return;
    }

    const bothEmpty = fromHour == null && toHour == null;
    const bothSet = fromHour != null && toHour != null;
    if (!bothEmpty && !bothSet) return;

    const revertDraft = sheet?.days.find((d) => d.date === date)?.cells[userId];
    const draftOnError = revertDraft
      ? cellToDraft(revertDraft)
      : { fromHour: "", toHour: "" };

    setSavingKey(key);
    try {
      const res = await fetch("/api/time-entries/timesheet/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date, fromHour, toHour }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        if (err.error === "OUT_OF_RANGE") {
          toast.error(t("timesheetOutOfRange"));
          return;
        }
        throw new Error(err.error ?? "save failed");
      }
      const cell = (await res.json()) as TimesheetCell;

      setSheet((prev) => {
        if (!prev) return prev;
        const days = prev.days.map((day) => {
          if (day.date !== date) return day;
          return {
            ...day,
            cells: { ...day.cells, [userId]: cell },
          };
        });
        const workerTotals = { ...prev.workerTotals };
        workerTotals[userId] =
          Math.round(
            days.reduce(
              (sum, day) => sum + (day.cells[userId]?.totalHours ?? 0),
              0,
            ) * 2,
          ) / 2;
        return { ...prev, days, workerTotals };
      });

      setDrafts((prev) => ({ ...prev, [key]: cellToDraft(cell) }));
    } catch {
      toast.error(t("timesheetSaveError"));
      setDrafts((prev) => ({ ...prev, [key]: draftOnError }));
    } finally {
      setSavingKey(null);
    }
  };

  const handleHourChange = (
    date: string,
    userId: string,
    field: "fromHour" | "toHour",
    value: string,
  ) => {
    const key = `${date}:${userId}`;
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { fromHour: "", toHour: "" }), [field]: value },
    }));
    void saveCell(date, userId, { [field]: value });
  };

  const handleFullDay = (date: string, userId: string) => {
    setDrafts((prev) => ({
      ...prev,
      [`${date}:${userId}`]: {
        fromHour: String(FULL_DAY_FROM),
        toHour: String(FULL_DAY_TO),
      },
    }));
    void saveCell(date, userId, {
      fromHour: String(FULL_DAY_FROM),
      toHour: String(FULL_DAY_TO),
    });
  };

  const workers = sheet?.workers ?? [];
  const monthDays = sheet?.days ?? [];
  const todayStart = startOfDay(now);

  if (loading && !sheet) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        {tc("loading")}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("timesheetLoadError")}</p>
        <Button type="button" variant="outline" onClick={() => void loadSheet()}>
          {te("retry")}
        </Button>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        {t("timesheetNoWorkers")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3">
        <div>
          <p className="font-semibold capitalize">{monthLabel}</p>
          <p className="text-sm text-muted-foreground">{t("timesheetTabHint")}</p>
        </div>
        <Badge variant="secondary">{t("timesheetCurrentMonthOnly")}</Badge>
      </div>

      <div className="space-y-3">
        {workers.map((worker) => {
          const monthTotal = sheet?.workerTotals[worker.id] ?? 0;
          const isExpanded = expandedWorkerId === worker.id;
          const workedDayCount = monthDays.filter(
            (day) => (day.cells[worker.id]?.totalHours ?? 0) > 0,
          ).length;

          return (
            <div
              key={worker.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/20"
                onClick={() =>
                  setExpandedWorkerId(isExpanded ? null : worker.id)
                }
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{worker.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {workedDayCount === 0
                      ? te("timesheetNoDays")
                      : te("timesheetDaysWorked", { count: workedDayCount })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums">
                    {formatTotalHours(monthTotal) || "0"}
                    <span className="ml-0.5 text-sm font-medium text-muted-foreground">
                      h
                    </span>
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {te("timesheetMonthTotal")}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>

              {isExpanded ? (
                <div className="border-t bg-muted/10 px-3 py-3">
                  <p className="mb-3 px-1 text-xs text-muted-foreground">
                    {t("timesheetTabEditHint")}
                  </p>
                  <ul className="max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1">
                    {monthDays.map((day) => {
                      const key = `${day.date}:${worker.id}`;
                      const draft = drafts[key] ?? { fromHour: "", toHour: "" };
                      const total = draftTotalHours(draft);
                      const isSaving = savingKey === key;
                      const dayDate = new Date(`${day.date}T12:00:00`);
                      const isFuture = isAfter(dayDate, todayStart);
                      const hasEntry = total > 0;

                      return (
                        <li
                          key={day.date}
                          className={cn(
                            "rounded-xl border px-3 py-3",
                            hasEntry
                              ? "border-border bg-background"
                              : "border-border/40 bg-background/60",
                          )}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold tabular-nums">
                                {formatSheetDate(dayDate, locale)}
                              </span>
                              {isFuture ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {t("timesheetScheduled")}
                                </Badge>
                              ) : null}
                            </div>
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                total > 0
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {total > 0
                                ? `${formatTotalHours(total)}h`
                                : te("timesheetNoHoursYet")}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <TimesheetHourSelect
                              compact
                              label={te("timesheetFrom")}
                              value={draft.fromHour}
                              disabled={isSaving}
                              emptyLabel={tc("noneSelected")}
                              hours={fromHourOptions(draft)}
                              onChange={(value) =>
                                handleHourChange(
                                  day.date,
                                  worker.id,
                                  "fromHour",
                                  value,
                                )
                              }
                            />
                            <TimesheetHourSelect
                              compact
                              label={te("timesheetTo")}
                              value={draft.toHour}
                              disabled={isSaving}
                              emptyLabel={tc("noneSelected")}
                              hours={toHourOptions(draft)}
                              onChange={(value) =>
                                handleHourChange(
                                  day.date,
                                  worker.id,
                                  "toHour",
                                  value,
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 shrink-0 gap-1.5 border-dashed"
                              disabled={isSaving}
                              onClick={() => handleFullDay(day.date, worker.id)}
                            >
                              <Sun className="h-3.5 w-3.5" />
                              {te("timesheetFullDay")}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {te("timesheetBreakHint")}
      </p>
    </div>
  );
}
