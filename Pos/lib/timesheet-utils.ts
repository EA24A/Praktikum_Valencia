import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { BUSINESS_TIMEZONE } from "@/lib/business-timezone";

/** Earliest / latest whole hour staff may log on the timesheet (09:00–22:00). */
export const SHIFT_MIN_HOUR = 9;
export const SHIFT_MAX_HOUR = 22;

/** Full shift preset: open to close (09:00–22:00). */
export const FULL_DAY_FROM = SHIFT_MIN_HOUR;
export const FULL_DAY_TO = SHIFT_MAX_HOUR;

/** Selectable whole hours on the shift clock (9 → 09:00, 22 → 22:00). */
export const SHIFT_SELECTABLE_HOURS = Array.from(
  { length: SHIFT_MAX_HOUR - SHIFT_MIN_HOUR + 1 },
  (_, index) => SHIFT_MIN_HOUR + index,
);

/** @deprecated Use SHIFT_SELECTABLE_HOURS for employee entry UI. */
export const TIMESHEET_HOURS = SHIFT_SELECTABLE_HOURS;

export function isShiftHour(hour: number): boolean {
  return (
    Number.isInteger(hour) &&
    hour >= SHIFT_MIN_HOUR &&
    hour <= SHIFT_MAX_HOUR
  );
}

export function parseShiftRange(
  fromHour: number | null,
  toHour: number | null,
): { fromHour: number; toHour: number } | null {
  if (
    fromHour == null ||
    toHour == null ||
    !isShiftHour(fromHour) ||
    !isShiftHour(toHour) ||
    toHour <= fromHour
  ) {
    return null;
  }
  return { fromHour, toHour };
}

export function isValidShiftRange(
  fromHour: number | null,
  toHour: number | null,
): boolean {
  return parseShiftRange(fromHour, toHour) != null;
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function dateTimePartsInTimeZone(
  instant: Date,
  timeZone: string,
): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
}

/** Convert wall-clock Y-M-D H:M in business TZ to a UTC instant. */
export function wallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0,
  timeZone = BUSINESS_TIMEZONE,
): Date {
  let utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let attempt = 0; attempt < 5; attempt++) {
    const parts = dateTimePartsInTimeZone(new Date(utcGuess), timeZone);
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const diff = asUtc - utcGuess;
    utcGuess -= diff;
    if (diff === 0) break;
  }

  return new Date(utcGuess);
}

/** Calendar date (yyyy-MM-dd) for an instant in the business timezone. */
export function businessDateKey(instant: Date, timeZone = BUSINESS_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const year = parts.find((part) => part.type === "year")!.value;
  const month = parts.find((part) => part.type === "month")!.value;
  const day = parts.find((part) => part.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

export function calendarDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function businessDayStartUtc(
  calendarDateKeyValue: string,
  timeZone = BUSINESS_TIMEZONE,
): Date {
  const [y, m, d] = calendarDateKeyValue.split("-").map(Number);
  return wallClockToUtc(y, m, d, 0, 0, 0, timeZone);
}

export function businessDayEndUtc(
  calendarDateKeyValue: string,
  timeZone = BUSINESS_TIMEZONE,
): Date {
  const start = businessDayStartUtc(calendarDateKeyValue, timeZone);
  const nextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const nextKey = businessDateKey(nextDay, timeZone);
  return new Date(businessDayStartUtc(nextKey, timeZone).getTime() - 1);
}

export function hourToDate(calendarDateKeyValue: string, hour: number): Date {
  const [y, m, d] = calendarDateKeyValue.split("-").map(Number);
  return wallClockToUtc(y, m, d, hour, 0, 0);
}

/** Whole hour (business TZ) for a stored UTC instant. */
export function dateToHour(instant: Date | string): number {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")!.value);
}

export function calcGrossHours(fromHour: number | null, toHour: number | null): number {
  if (fromHour == null || toHour == null) return 0;
  if (toHour <= fromHour) return 0;
  return toHour - fromHour;
}

/** Paid hours after mandatory break deductions per shift length. */
export function deductBreakHours(grossHours: number): number {
  if (grossHours <= 0) return 0;
  if (grossHours >= 14) return grossHours - 1;
  if (grossHours > 7) return grossHours - 0.5;
  return grossHours;
}

export function calcTotalHours(fromHour: number | null, toHour: number | null): number {
  return deductBreakHours(calcGrossHours(fromHour, toHour));
}

export function formatTotalHours(hours: number): string {
  if (hours <= 0) return "";
  const rounded = Math.round(hours * 2) / 2;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1);
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

export function formatSheetDate(date: Date, locale: string): string {
  if (locale === "es") {
    return format(date, "d.M.yyyy");
  }
  return format(date, "d.M.yyyy");
}

export function parseMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export type TimesheetCellDraft = { fromHour: string; toHour: string };

export function cellToDraft(cell: {
  fromHour: number | null;
  toHour: number | null;
}): TimesheetCellDraft {
  return {
    fromHour: cell.fromHour != null ? String(cell.fromHour) : "",
    toHour: cell.toHour != null ? String(cell.toHour) : "",
  };
}

export function draftTotalHours(draft: TimesheetCellDraft): number {
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

function shiftHourOptions(hours: number[], currentValue: string): number[] {
  if (currentValue === "") return hours;
  const current = Number(currentValue);
  if (Number.isNaN(current) || hours.includes(current)) return hours;
  return [...hours, current].sort((a, b) => a - b);
}

export function fromHourOptions(draft: TimesheetCellDraft): number[] {
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

export function toHourOptions(draft: TimesheetCellDraft): number[] {
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

export function getCurrentMonthParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")!.value);
  const month = Number(parts.find((part) => part.type === "month")!.value);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    year,
    month,
    start: businessDayStartUtc(calendarDateKey(year, month, 1)),
    end: businessDayEndUtc(calendarDateKey(year, month, lastDay)),
  };
}

export function isDateInMonth(dateStr: string, year: number, month: number): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return date >= start && date <= end;
}
