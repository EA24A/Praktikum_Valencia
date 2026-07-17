import {
  businessDateKey,
  calcTotalHours,
  dateToHour,
} from "@/lib/timesheet-utils";

export type TimesheetEntryLike = {
  clockIn: Date;
  clockOut: Date | null;
};

/** Paid hours for one closed shift, matching the employee timesheet grid. */
export function timesheetHoursForEntry(
  clockIn: Date,
  clockOut: Date | null,
): number {
  if (!clockOut) return 0;
  const fromHour = dateToHour(clockIn);
  const toHour = dateToHour(clockOut);
  return calcTotalHours(fromHour, toHour);
}

export function roundTimesheetTotal(hours: number): number {
  return Math.round(hours * 2) / 2;
}

/**
 * Sum timesheet hours for a worker in a date range.
 * Uses the same rule as the month grid: one shift per calendar day (earliest clock-in).
 */
export function sumTimesheetHoursForWorker(
  entries: TimesheetEntryLike[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const inRange = entries
    .filter((entry) => entry.clockIn >= rangeStart && entry.clockIn <= rangeEnd)
    .sort((a, b) => a.clockIn.getTime() - b.clockIn.getTime());

  const byDay = new Map<string, TimesheetEntryLike>();
  for (const entry of inRange) {
    const key = businessDateKey(entry.clockIn);
    if (!byDay.has(key)) {
      byDay.set(key, entry);
    }
  }

  const total = Array.from(byDay.values()).reduce(
    (sum, entry) => sum + timesheetHoursForEntry(entry.clockIn, entry.clockOut),
    0,
  );

  return roundTimesheetTotal(total);
}
