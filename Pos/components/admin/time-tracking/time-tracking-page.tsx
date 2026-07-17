"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { useLocale } from "next-intl";
import { Download, CalendarDays, Table2, CalendarRange, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TimeTrackingFilters } from "@/components/admin/time-tracking/time-tracking-filters";
import { TimeEntriesTable } from "@/components/admin/time-tracking/time-entries-table";
import { TimeEntryEditDialog } from "@/components/admin/time-tracking/time-entry-edit-dialog";
import { TimeEntryCreateDialog } from "@/components/admin/time-tracking/time-entry-create-dialog";
import { WeeklySummary } from "@/components/admin/time-tracking/weekly-summary";
import { BulkAttendanceDialog } from "@/components/admin/time-tracking/bulk-attendance-dialog";
import { AdminTimesheetTab } from "@/components/admin/time-tracking/admin-timesheet-tab";
import type {
  TimeEntryListItem,
  WeeklySummaryItem,
} from "@/lib/actions/time-entries";
import type { UserListItem } from "@/lib/actions/users";

function formatDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

async function fetchEmployees(): Promise<UserListItem[]> {
  const response = await fetch("/api/users?includeInactive=false");
  if (!response.ok) throw new Error("Failed to load employees");
  const data = (await response.json()) as { users: UserListItem[] };
  return data.users;
}

async function fetchTimeEntries(params: {
  userId?: string;
  dateFrom: string;
  dateTo: string;
}): Promise<{ entries: TimeEntryListItem[]; weeklySummary: WeeklySummaryItem[] }> {
  const search = new URLSearchParams({
    dateFrom: new Date(`${params.dateFrom}T00:00:00`).toISOString(),
    dateTo: new Date(`${params.dateTo}T23:59:59.999`).toISOString(),
  });
  if (params.userId && params.userId !== "all") {
    search.set("userId", params.userId);
  }

  const response = await fetch(`/api/time-entries?${search.toString()}`);
  if (!response.ok) throw new Error("Failed to load time entries");
  return response.json() as Promise<{
    entries: TimeEntryListItem[];
    weeklySummary: WeeklySummaryItem[];
  }>;
}

function exportCsv(
  entries: TimeEntryListItem[],
  filename: string,
  headers: Record<string, string>,
) {
  const rows = [
    [
      headers.employee,
      headers.clockIn,
      headers.clockOut,
      headers.duration,
      headers.note,
      headers.status,
    ],
    ...entries.map((entry) => [
      entry.userName,
      entry.clockIn,
      entry.clockOut ?? "",
      entry.durationHours.toFixed(2),
      entry.note ?? "",
      entry.isOpen ? headers.open : headers.closed,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function TimeTrackingPage() {
  const t = useTranslations("timeTracking");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const [userId, setUserId] = useState("all");
  const [dateFrom, setDateFrom] = useState(formatDateInput(monthStart));
  const [dateTo, setDateTo] = useState(formatDateInput(monthEnd));
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [sheetReloadKey, setSheetReloadKey] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryListItem | null>(
    null,
  );

  const { data: employees = [] } = useQuery({
    queryKey: ["admin-users-active"],
    queryFn: fetchEmployees,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-time-entries", userId, dateFrom, dateTo],
    queryFn: () => fetchTimeEntries({ userId, dateFrom, dateTo }),
  });

  const entries = data?.entries ?? [];
  const weeklySummary = data?.weeklySummary ?? [];

  const timesheetEmployees = useMemo(
    () =>
      employees
        .filter(
          (employee) =>
            employee.role === "EMPLOYEE" &&
            employee.isActive &&
            !employee.isOwner,
        )
        .map((employee) => ({ id: employee.id, name: employee.name })),
    [employees],
  );

  const calendarEntries = useMemo(() => {
    if (!selectedDay) return entries;
    return entries.filter((entry) =>
      isSameDay(parseISO(entry.clockIn), selectedDay),
    );
  }, [entries, selectedDay]);

  const daysWithEntries = useMemo(() => {
    const days = new Set<string>();
    for (const entry of entries) {
      days.add(format(parseISO(entry.clockIn), "yyyy-MM-dd"));
    }
    return days;
  }, [entries]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["admin-time-entries"] });
    void refetch();
  }, [queryClient, refetch]);

  function handleEdit(entry: TimeEntryListItem) {
    setSelectedEntry(entry);
    setEditOpen(true);
  }

  function handleAttendanceSaved() {
    refresh();
    setSheetReloadKey((key) => key + 1);
  }

  function handleCalendarMonthChange(month: Date) {
    setDateFrom(formatDateInput(startOfMonth(month)));
    setDateTo(formatDateInput(endOfMonth(month)));
  }

  function handleExport() {
    exportCsv(entries, `time-entries-${dateFrom}-${dateTo}.csv`, {
      employee: t("employee"),
      clockIn: t("clockIn"),
      clockOut: t("clockOut"),
      duration: t("duration"),
      note: t("note"),
      status: tc("status"),
      open: t("openEntry"),
      closed: t("closedEntry"),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Users className="h-4 w-4" />
            {t("bulkAttendanceTitle")}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!entries.length}>
            <Download className="h-4 w-4" />
            {tc("exportCsv")}
          </Button>
        </div>
      </div>

      <TimeTrackingFilters
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        userId={userId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onUserIdChange={setUserId}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <WeeklySummary summary={weeklySummary} />

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="timesheet">
            <CalendarRange className="h-4 w-4" />
            {t("timesheetTab")}
          </TabsTrigger>
          <TabsTrigger value="table">
            <Table2 className="h-4 w-4" />
            {t("tableView")}
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4" />
            {t("calendarView")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timesheet" className="mt-4">
          <AdminTimesheetTab reloadKey={sheetReloadKey} />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          {isLoading ? (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              {tc("loading")}
            </div>
          ) : (
            <TimeEntriesTable entries={entries} onEdit={handleEdit} />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("selectDay")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  onMonthChange={handleCalendarMonthChange}
                  locale={dateLocale}
                  modifiers={{
                    hasEntries: (date) =>
                      daysWithEntries.has(format(date, "yyyy-MM-dd")),
                  }}
                  modifiersClassNames={{
                    hasEntries: "bg-primary/15 font-semibold",
                  }}
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="min-w-0 flex-1 text-sm font-medium">
                  {selectedDay
                    ? format(selectedDay, "PPPP", { locale: dateLocale })
                    : t("selectDay")}
                </h3>
                <Badge variant="outline">{calendarEntries.length}</Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  disabled={!selectedDay}
                  onClick={() => setCreateOpen(true)}
                  aria-label={t("addEntry")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {isLoading ? (
                <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                  {tc("loading")}
                </div>
              ) : (
                <TimeEntriesTable
                  entries={calendarEntries}
                  onEdit={handleEdit}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TimeEntryEditDialog
        entry={selectedEntry}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleAttendanceSaved}
      />

      <TimeEntryCreateDialog
        open={createOpen}
        selectedDay={selectedDay}
        employees={timesheetEmployees}
        onOpenChange={setCreateOpen}
        onSuccess={handleAttendanceSaved}
      />

      <BulkAttendanceDialog
        open={bulkOpen}
        employees={timesheetEmployees}
        onOpenChange={setBulkOpen}
        onSuccess={handleAttendanceSaved}
      />
    </div>
  );
}
