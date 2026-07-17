"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatHourLabel,
  isShiftHour,
  type TimesheetCellDraft,
} from "@/lib/timesheet-utils";

export function TimesheetHourSelect({
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
            "w-full border-border/60 bg-background/50",
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

export type { TimesheetCellDraft };
