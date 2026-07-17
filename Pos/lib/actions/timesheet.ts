"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  businessDateKey,
  businessDayEndUtc,
  businessDayStartUtc,
  calcTotalHours,
  calendarDateKey,
  dateToHour,
  getMonthDays,
  hourToDate,
  parseShiftRange,
} from "@/lib/timesheet-utils";
import { roundTimesheetTotal, timesheetHoursForEntry } from "@/lib/timesheet-hours";
import { getTimesheetEligibleEmployeeWhere } from "@/lib/timesheet-workers";

async function requireTimesheetAccess() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "UNAUTHORIZED" as const };
  }
  if (session.user.role !== "EMPLOYEE" && session.user.role !== "SUPERADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  return { ok: true as const, session };
}

function getTimesheetWorkersWhere() {
  return getTimesheetEligibleEmployeeWhere();
}

export interface TimesheetWorker {
  id: string;
  name: string;
}

export interface TimesheetCell {
  entryId: string | null;
  fromHour: number | null;
  toHour: number | null;
  totalHours: number;
}

export interface TimesheetDayRow {
  date: string;
  cells: Record<string, TimesheetCell>;
}

export interface MonthTimesheet {
  year: number;
  month: number;
  workers: TimesheetWorker[];
  days: TimesheetDayRow[];
  workerTotals: Record<string, number>;
}

function dayKeyFromDate(day: Date, year: number, month: number): string {
  return calendarDateKey(year, month, day.getDate());
}

export async function getMonthTimesheet(
  year: number,
  month: number,
): Promise<MonthTimesheet | null> {
  const access = await requireTimesheetAccess();
  if (!access.ok) return null;

  const workers = await prisma.user.findMany({
    where: getTimesheetWorkersWhere(),
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const daysInMonth = getMonthDays(year, month);
  if (daysInMonth.length === 0) {
    return { year, month, workers, days: [], workerTotals: {} };
  }

  const rangeStart = businessDayStartUtc(
    calendarDateKey(year, month, 1),
  );
  const rangeEnd = businessDayEndUtc(
    calendarDateKey(year, month, daysInMonth[daysInMonth.length - 1]!.getDate()),
  );

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: { in: workers.map((w) => w.id) },
      clockIn: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { clockIn: "asc" },
  });

  const byUserDate = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = `${entry.userId}:${businessDateKey(entry.clockIn)}`;
    const list = byUserDate.get(key) ?? [];
    list.push(entry);
    byUserDate.set(key, list);
  }

  const workerTotals: Record<string, number> = {};
  for (const w of workers) {
    workerTotals[w.id] = 0;
  }

  const days: TimesheetDayRow[] = daysInMonth.map((day) => {
    const key = dayKeyFromDate(day, year, month);
    const cells: Record<string, TimesheetCell> = {};

    for (const worker of workers) {
      const dayEntries = byUserDate.get(`${worker.id}:${key}`) ?? [];
      const entry = dayEntries[0];

      if (!entry) {
        cells[worker.id] = {
          entryId: null,
          fromHour: null,
          toHour: null,
          totalHours: 0,
        };
        continue;
      }

      const fromHour = dateToHour(entry.clockIn);
      const toHour = entry.clockOut ? dateToHour(entry.clockOut) : null;
      const totalHours = timesheetHoursForEntry(entry.clockIn, entry.clockOut);

      workerTotals[worker.id] += totalHours;

      cells[worker.id] = {
        entryId: entry.id,
        fromHour,
        toHour,
        totalHours,
      };
    }

    return { date: key, cells };
  });

  for (const w of workers) {
    workerTotals[w.id] = roundTimesheetTotal(workerTotals[w.id]);
  }

  return { year, month, workers, days, workerTotals };
}

export async function upsertTimesheetCell(input: {
  userId: string;
  date: string;
  fromHour: number | null;
  toHour: number | null;
}) {
  const access = await requireTimesheetAccess();
  if (!access.ok) {
    return { success: false as const, error: access.error };
  }

  const user = await prisma.user.findFirst({
    where: { id: input.userId, ...getTimesheetWorkersWhere() },
  });
  if (!user) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const [y, m, d] = input.date.split("-").map(Number);
  if (!y || !m || !d) {
    return { success: false as const, error: "INVALID_DATE" as const };
  }

  const dayStart = businessDayStartUtc(input.date);
  const dayEnd = businessDayEndUtc(input.date);

  const fromHour = input.fromHour;
  const toHour = input.toHour;
  const bothEmpty = fromHour == null && toHour == null;
  const shift = parseShiftRange(fromHour, toHour);

  if (!bothEmpty && !shift) {
    return {
      success: true as const,
      data: {
        entryId: null,
        fromHour,
        toHour,
        totalHours: 0,
      },
    };
  }

  await prisma.timeEntry.deleteMany({
    where: {
      userId: input.userId,
      clockIn: { gte: dayStart, lte: dayEnd },
    },
  });

  if (!shift) {
    return {
      success: true as const,
      data: {
        entryId: null,
        fromHour: null,
        toHour: null,
        totalHours: 0,
      },
    };
  }

  const clockIn = hourToDate(input.date, shift.fromHour);
  const clockOut = hourToDate(input.date, shift.toHour);

  const entry = await prisma.timeEntry.create({
    data: {
      userId: input.userId,
      clockIn,
      clockOut,
    },
  });

  const totalHours = calcTotalHours(shift.fromHour, shift.toHour);

  return {
    success: true as const,
    data: {
      entryId: entry.id,
      fromHour: shift.fromHour,
      toHour: shift.toHour,
      totalHours,
    },
  };
}
