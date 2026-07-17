"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FULL_DAY_FROM,
  FULL_DAY_TO,
} from "@/lib/timesheet-utils";

interface EmployeeOption {
  id: string;
  name: string;
}

interface TimeEntryCreateDialogProps {
  open: boolean;
  selectedDay?: Date;
  employees: EmployeeOption[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function toLocalDateTimeValue(day: Date, hour: number): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${pad(hour)}:00`;
}

export function TimeEntryCreateDialog({
  open,
  selectedDay,
  employees,
  onOpenChange,
  onSuccess,
}: TimeEntryCreateDialogProps) {
  const t = useTranslations("timeTracking");
  const tc = useTranslations("common");

  const [userId, setUserId] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [isOpenEntry, setIsOpenEntry] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const day = selectedDay ?? new Date();

  const eligibleEmployees = useMemo(
    () => employees.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [employees],
  );

  useEffect(() => {
    if (!open) return;
    setUserId(eligibleEmployees[0]?.id ?? "");
    setClockIn(toLocalDateTimeValue(day, FULL_DAY_FROM));
    setClockOut(toLocalDateTimeValue(day, FULL_DAY_TO));
    setIsOpenEntry(false);
    setNote("");
  }, [open, day, eligibleEmployees]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!userId) {
      toast.error(t("employeeRequired"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          clockIn: new Date(clockIn).toISOString(),
          clockOut: isOpenEntry ? null : new Date(clockOut).toISOString(),
          note: note.trim() || null,
        }),
      });

      const data = (await response.json()) as { error?: string; code?: string };
      if (!response.ok) {
        if (data.code === "OUT_OF_RANGE") {
          toast.error(t("timesheetOutOfRange"));
        } else {
          toast.error(data.error ?? t("createError"));
        }
        return;
      }

      toast.success(t("createSuccess"));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(t("createError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addEntry")}</DialogTitle>
          <DialogDescription>
            {format(day, "PP")} · {t("timesheetCurrentMonthOnly")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-employee">{t("employee")}</Label>
            <Select
              value={userId || "none"}
              onValueChange={(v) => setUserId(v && v !== "none" ? v : "")}
            >
              <SelectTrigger id="create-employee">
                <SelectValue placeholder={t("filterEmployee")} />
              </SelectTrigger>
              <SelectContent>
                {eligibleEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-clock-in">{t("clockIn")}</Label>
            <Input
              id="create-clock-in"
              type="datetime-local"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="create-open-entry"
              checked={isOpenEntry}
              onCheckedChange={setIsOpenEntry}
            />
            <Label htmlFor="create-open-entry">{t("openEntry")}</Label>
          </div>

          {!isOpenEntry ? (
            <div className="space-y-2">
              <Label htmlFor="create-clock-out">{t("clockOut")}</Label>
              <Input
                id="create-clock-out"
                type="datetime-local"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="create-note">{t("note")}</Label>
            <Textarea
              id="create-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={saving || eligibleEmployees.length === 0}>
              {saving ? tc("loading") : t("addEntry")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
