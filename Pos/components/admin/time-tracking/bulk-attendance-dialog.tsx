"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { toast } from "sonner";
import { Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimesheetHourSelect } from "@/components/shared/timesheet-hour-select";
import {
  FULL_DAY_FROM,
  FULL_DAY_TO,
  draftTotalHours,
  fromHourOptions,
  getCurrentMonthParts,
  isValidShiftRange,
  isShiftHour,
  toHourOptions,
  type TimesheetCellDraft,
} from "@/lib/timesheet-utils";

interface EmployeeOption {
  id: string;
  name: string;
}

interface BulkAttendanceDialogProps {
  open: boolean;
  employees: EmployeeOption[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function todayDateInput(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function monthBoundsInput(): { min: string; max: string } {
  const { year, month } = getCurrentMonthParts();
  const lastDay = new Date(year, month, 0).getDate();
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    min: `${year}-${pad(month)}-01`,
    max: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export function BulkAttendanceDialog({
  open,
  employees,
  onOpenChange,
  onSuccess,
}: BulkAttendanceDialogProps) {
  const t = useTranslations("timeTracking");
  const te = useTranslations("employee");
  const tc = useTranslations("common");

  const bounds = monthBoundsInput();
  const sortedEmployees = useMemo(
    () => employees.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [employees],
  );

  const [date, setDate] = useState(todayDateInput());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<TimesheetCellDraft>({
    fromHour: String(FULL_DAY_FROM),
    toHour: String(FULL_DAY_TO),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(todayDateInput());
    setSelectedIds(sortedEmployees.map((employee) => employee.id));
    setDraft({
      fromHour: String(FULL_DAY_FROM),
      toHour: String(FULL_DAY_TO),
    });
  }, [open, sortedEmployees]);

  const totalHours = draftTotalHours(draft);
  const allSelected =
    sortedEmployees.length > 0 &&
    selectedIds.length === sortedEmployees.length;

  function toggleEmployee(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((entry) => entry !== id),
    );
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? sortedEmployees.map((employee) => employee.id) : []);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (selectedIds.length === 0) {
      toast.error(t("bulkAttendanceNoEmployees"));
      return;
    }

    const fromHour = draft.fromHour === "" ? null : Number(draft.fromHour);
    const toHour = draft.toHour === "" ? null : Number(draft.toHour);

    if (
      fromHour == null ||
      toHour == null ||
      !isShiftHour(fromHour) ||
      !isShiftHour(toHour) ||
      !isValidShiftRange(fromHour, toHour)
    ) {
      toast.error(te("timesheetInvalidRange"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/time-entries/timesheet/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedIds,
          date,
          fromHour,
          toHour,
        }),
      });

      const data = (await res.json()) as { error?: string; applied?: number };
      if (!res.ok) {
        if (data.error === "OUT_OF_RANGE") {
          toast.error(t("timesheetOutOfRange"));
        } else {
          toast.error(t("bulkAttendanceError"));
        }
        return;
      }

      toast.success(
        t("bulkAttendanceSuccess", { count: data.applied ?? selectedIds.length }),
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(t("bulkAttendanceError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,720px)] flex-col gap-0 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("bulkAttendanceTitle")}</DialogTitle>
          <DialogDescription>{t("bulkAttendanceDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-date">{t("bulkAttendanceDate")}</Label>
              <Input
                id="bulk-date"
                type="date"
                min={bounds.min}
                max={bounds.max}
                value={date}
                disabled={saving}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TimesheetHourSelect
                label={te("timesheetFrom")}
                value={draft.fromHour}
                disabled={saving}
                emptyLabel={tc("noneSelected")}
                hours={fromHourOptions(draft)}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, fromHour: value }))
                }
              />
              <TimesheetHourSelect
                label={te("timesheetTo")}
                value={draft.toHour}
                disabled={saving}
                emptyLabel={tc("noneSelected")}
                hours={toHourOptions(draft)}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, toHour: value }))
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-dashed"
                disabled={saving}
                onClick={() =>
                  setDraft({
                    fromHour: String(FULL_DAY_FROM),
                    toHour: String(FULL_DAY_TO),
                  })
                }
              >
                <Sun className="h-3.5 w-3.5" />
                {te("timesheetFullDay")}
              </Button>
              {totalHours > 0 ? (
                <span className="text-sm text-muted-foreground">
                  {te("timesheetHoursWorked", {
                    hours: totalHours.toFixed(1).replace(/\.0$/, ""),
                  })}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("bulkAttendanceEmployees")}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  disabled={saving || sortedEmployees.length === 0}
                  onClick={() => toggleAll(!allSelected)}
                >
                  {allSelected ? t("bulkAttendanceClearAll") : t("bulkAttendanceSelectAll")}
                </Button>
              </div>

              <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border p-3">
                {sortedEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("timesheetNoWorkers")}
                  </p>
                ) : (
                  sortedEmployees.map((employee) => {
                    const checked = selectedIds.includes(employee.id);
                    return (
                      <label
                        key={employee.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={saving}
                          onCheckedChange={(value) =>
                            toggleEmployee(employee.id, value === true)
                          }
                        />
                        <span className="text-sm font-medium">{employee.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("bulkAttendanceSelectedCount", { count: selectedIds.length })}
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving || selectedIds.length === 0 || sortedEmployees.length === 0}
            >
              {saving ? tc("loading") : t("bulkAttendanceSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
