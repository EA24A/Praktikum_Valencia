"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { format } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  calcTotalHours,
  FULL_DAY_FROM,
  FULL_DAY_TO,
  formatHourLabel,
  formatSheetDate,
  formatTotalHours,
  isShiftHour,
  isValidShiftRange,
  SHIFT_MAX_HOUR,
  SHIFT_MIN_HOUR,
} from "@/lib/timesheet-utils";
import type { MonthTimesheet, TimesheetCell } from "@/lib/actions/timesheet";

type ViewMode = "today" | "month";
type CellDraft = { fromHour: string; toHour: string };

function shiftHourOptions(
  hours: number[],
  currentValue: string,
): number[] {
  if (currentValue === "") return hours;
  const current = Number(currentValue);
  if (Number.isNaN(current) || hours.includes(current)) return hours;
  return [...hours, current].sort((a, b) => a - b);
}

function fromHourOptions(draft: CellDraft): number[] {
  const base = Array.from(
    { length: SHIFT_MAX_HOUR - SHIFT_MIN_HOUR },
    (_, index) => SHIFT_MIN_HOUR + index,
  );
  const toNum = draft.toHour === "" ? null : Number(draft.toHour);
  const filtered =
    toNum != null && !Number.isNaN(toNum)
      ? base.filter((hour) => hour < toNum)
      : base;
  return shiftHourOptions(filtered, draft.fromHour);
}

function toHourOptions(draft: CellDraft): number[] {
  const base = Array.from(
    { length: SHIFT_MAX_HOUR - SHIFT_MIN_HOUR },
    (_, index) => SHIFT_MIN_HOUR + 1 + index,
  );
  const fromNum = draft.fromHour === "" ? null : Number(draft.fromHour);
  const filtered =
    fromNum != null && !Number.isNaN(fromNum)
      ? base.filter((hour) => hour > fromNum)
      : base;
  return shiftHourOptions(filtered, draft.toHour);
}

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function cellToDraft(cell: TimesheetCell): CellDraft {
  return {
    fromHour: cell.fromHour != null ? String(cell.fromHour) : "",
    toHour: cell.toHour != null ? String(cell.toHour) : "",
  };
}

function draftTotal(draft: CellDraft): number {
  const fromNum = draft.fromHour === "" ? null : Number(draft.fromHour);
  const toNum = draft.toHour === "" ? null : Number(draft.toHour);
  if (
    fromNum == null ||
    toNum == null ||
    Number.isNaN(fromNum) ||
    Number.isNaN(toNum)
  ) {
    return 0;
  }
  return calcTotalHours(fromNum, toNum);
}

function TimesheetHourSelect({
  value,
  disabled,
  onChange,
  emptyLabel,
  label,
  compact,
  hours,
}: {
  value: string;
  disabled?: boolean;
  onChange: (hour: string) => void;
  emptyLabel: string;
  label: string;
  compact?: boolean;
  hours: number[];
}) {
  return (
    <div className={cn("space-y-1", compact && "min-w-0 flex-1")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select
        value={value === "" ? "none" : value}
        onValueChange={(v) => onChange(!v || v === "none" ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "w-full border-border/60 bg-background/50 backdrop-blur-sm",
            compact ? "h-9" : "h-10",
          )}
        >
          <SelectValue placeholder={emptyLabel} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="max-h-60">
          <SelectItem value="none">{emptyLabel}</SelectItem>
          {hours.map((hour) => (
            <SelectItem
              key={hour}
              value={String(hour)}
              disabled={!isShiftHour(hour)}
            >
              {formatHourLabel(hour)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-background/55 p-4 shadow-sm backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TimesheetGrid() {
  const t = useTranslations("employee");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);

  const now = new Date();
  const [view, setView] = useState<ViewMode>("today");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sheet, setSheet] = useState<MonthTimesheet | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CellDraft>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  const monthLabel = useMemo(
    () =>
      format(new Date(year, month - 1, 1), "MMMM yyyy", {
        locale: dateLocale,
      }),
    [year, month, dateLocale],
  );

  const todayKey = todayDateKey();
  const todayLabel = useMemo(
    () =>
      format(new Date(todayKey + "T12:00:00"), "EEEE, d MMMM", {
        locale: dateLocale,
      }),
    [todayKey, dateLocale],
  );

  const loadSheet = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(
        `/api/time-entries/timesheet?year=${year}&month=${month}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "load failed");
      }
      const data = (await res.json()) as MonthTimesheet;
      setSheet(data);

      const nextDrafts: Record<string, CellDraft> = {};
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
  }, [year, month, t]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const goToCurrentMonth = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  const saveCell = async (
    date: string,
    userId: string,
    patch?: Partial<CellDraft>,
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
      toast.error(t("timesheetInvalidHours"));
      return;
    }

    if (fromHour != null && toHour != null && !isValidShiftRange(fromHour, toHour)) {
      toast.error(t("timesheetInvalidRange"));
      return;
    }

    const bothEmpty = fromHour == null && toHour == null;
    const bothSet = fromHour != null && toHour != null;

    if (!bothEmpty && !bothSet) {
      return;
    }

    const revertDraft = sheet?.days.find((d) => d.date === date)?.cells[userId];
    const draftOnError = revertDraft
      ? cellToDraft(revertDraft)
      : { fromHour: "", toHour: "" };

    setSavingKey(key);
    try {
      const res = await fetch("/api/time-entries/timesheet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date, fromHour, toHour }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
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
    const key = `${date}:${userId}`;
    setDrafts((prev) => ({
      ...prev,
      [key]: { fromHour: String(FULL_DAY_FROM), toHour: String(FULL_DAY_TO) },
    }));
    void saveCell(date, userId, {
      fromHour: String(FULL_DAY_FROM),
      toHour: String(FULL_DAY_TO),
    });
  };

  const workers = sheet?.workers ?? [];
  const isViewingCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  if (loading && !sheet) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">{t("loadingRoster")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-muted/30 to-background max-md:h-[calc(100vh-7rem)]">
      <div className="shrink-0 border-b border-border/50 bg-background/70 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {t("timeTracking")}
            </h1>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t("timesheetDescShort")}
            </p>
          </div>
          <Link
            href="/employee/pos"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 text-sm font-medium backdrop-blur-sm hover:bg-muted/60"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("pos")}
          </Link>
        </div>

        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-border/60 bg-background/50 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                setView("today");
                goToCurrentMonth();
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                view === "today"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("timesheetTodayTab")}
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                view === "month"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("timesheetMonthTab")}
            </button>
          </div>

          {view === "month" ? (
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-border/60 bg-background/50 backdrop-blur-sm"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[9rem] text-center text-sm font-semibold capitalize">
                {monthLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-border/60 bg-background/50 backdrop-blur-sm"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="ml-auto text-sm font-medium capitalize text-muted-foreground">
              {todayLabel}
            </p>
          )}
        </div>
      </div>

      {loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-muted-foreground">{t("timesheetLoadError")}</p>
          <Button type="button" variant="outline" onClick={() => loadSheet()}>
            {t("retry")}
          </Button>
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
          {t("noEmployees")}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <div className="mx-auto max-w-3xl space-y-3">
            {view === "today" ? (
              <>
                {!isViewingCurrentMonth ? (
                  <GlassCard className="border-dashed text-sm text-muted-foreground">
                    {t("timesheetTodayReloading")}
                  </GlassCard>
                ) : null}

                {workers.map((worker) => {
                  const key = `${todayKey}:${worker.id}`;
                  const draft = drafts[key] ?? { fromHour: "", toHour: "" };
                  const total = draftTotal(draft);
                  const isSaving = savingKey === key;

                  return (
                    <GlassCard key={worker.id}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">{worker.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("timesheetTodayHint")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-primary/5 px-3 py-1.5">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold tabular-nums">
                            {total > 0
                              ? t("timesheetHoursWorked", {
                                  hours: formatTotalHours(total),
                                })
                              : t("timesheetNoHoursYet")}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <TimesheetHourSelect
                          label={t("timesheetFrom")}
                          value={draft.fromHour}
                          disabled={isSaving || !isViewingCurrentMonth}
                          emptyLabel={tc("noneSelected")}
                          hours={fromHourOptions(draft)}
                          onChange={(value) =>
                            handleHourChange(
                              todayKey,
                              worker.id,
                              "fromHour",
                              value,
                            )
                          }
                        />
                        <TimesheetHourSelect
                          label={t("timesheetTo")}
                          value={draft.toHour}
                          disabled={isSaving || !isViewingCurrentMonth}
                          emptyLabel={tc("noneSelected")}
                          hours={toHourOptions(draft)}
                          onChange={(value) =>
                            handleHourChange(
                              todayKey,
                              worker.id,
                              "toHour",
                              value,
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full gap-2 border-dashed"
                        disabled={isSaving || !isViewingCurrentMonth}
                        onClick={() => handleFullDay(todayKey, worker.id)}
                      >
                        <Sun className="h-4 w-4" />
                        {t("timesheetFullDay")}
                      </Button>
                    </GlassCard>
                  );
                })}

                <p className="px-1 text-center text-xs text-muted-foreground">
                  {t("timesheetBreakHint")}
                </p>
              </>
            ) : (
              workers.map((worker) => {
                const monthTotal = sheet?.workerTotals[worker.id] ?? 0;
                const isExpanded = expandedWorkerId === worker.id;
                const monthDays = sheet?.days ?? [];
                const workedDayCount = monthDays.filter(
                  (day) => (day.cells[worker.id]?.totalHours ?? 0) > 0,
                ).length;

                return (
                  <GlassCard key={worker.id} className="overflow-hidden p-0">
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
                            ? t("timesheetNoDays")
                            : t("timesheetDaysWorked", {
                                count: workedDayCount,
                              })}
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
                          {t("timesheetMonthTotal")}
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
                      <div className="border-t border-border/40 bg-muted/10 px-3 py-3">
                        <p className="mb-3 px-1 text-xs text-muted-foreground">
                          {t("timesheetMonthEditHint")}
                        </p>
                        <ul className="max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1">
                          {monthDays.map((day) => {
                            const key = `${day.date}:${worker.id}`;
                            const draft = drafts[key] ?? {
                              fromHour: "",
                              toHour: "",
                            };
                            const total = draftTotal(draft);
                            const isSaving = savingKey === key;
                            const dayDate = new Date(day.date + "T12:00:00");
                            const hasEntry = total > 0;

                            return (
                              <li
                                key={day.date}
                                className={cn(
                                  "rounded-xl border px-3 py-3 backdrop-blur-sm",
                                  hasEntry
                                    ? "border-border/50 bg-background/50"
                                    : "border-border/30 bg-background/30",
                                )}
                              >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold tabular-nums">
                                    {formatSheetDate(dayDate, locale)}
                                  </span>
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
                                      : t("timesheetNoHoursYet")}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                  <TimesheetHourSelect
                                    compact
                                    label={t("timesheetFrom")}
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
                                    label={t("timesheetTo")}
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
                                    className="h-9 shrink-0 gap-1.5 border-dashed sm:mb-0"
                                    disabled={isSaving}
                                    onClick={() =>
                                      handleFullDay(day.date, worker.id)
                                    }
                                  >
                                    <Sun className="h-3.5 w-3.5" />
                                    {t("timesheetFullDay")}
                                  </Button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
