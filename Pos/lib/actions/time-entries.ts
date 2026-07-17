import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/actions/users";
import { getTimesheetEligibleEmployeeWhere } from "@/lib/timesheet-workers";
import {
  businessDateKey,
  getCurrentMonthParts,
  isDateInMonth,
} from "@/lib/timesheet-utils";
import {
  sumTimesheetHoursForWorker,
  timesheetHoursForEntry,
} from "@/lib/timesheet-hours";

async function assertSuperadmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new ActionError("Forbidden", "FORBIDDEN");
  }
  return session;
}


export interface TimeEntryListItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  clockIn: string;
  clockOut: string | null;
  note: string | null;
  durationHours: number;
  isOpen: boolean;
  createdAt: string;
}

export interface ListTimeEntriesFilters {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

export interface WeeklySummaryItem {
  userId: string;
  userName: string;
  totalHours: number;
  entriesCount: number;
  openEntries: number;
}

export async function listTimeEntries(
  filters: ListTimeEntriesFilters = {},
): Promise<{ entries: TimeEntryListItem[]; weeklySummary: WeeklySummaryItem[] }> {
  await assertSuperadmin();

  const now = new Date();
  const { start: monthStart, end: monthEnd } = getCurrentMonthParts(now);
  const dateFrom = filters.dateFrom ?? monthStart;
  const dateTo = filters.dateTo ?? monthEnd;

  const where = {
    ...(filters.userId ? { userId: filters.userId } : {}),
    clockIn: { gte: dateFrom, lte: dateTo },
  };

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { clockIn: "desc" },
    take: filters.limit ?? 500,
  });

  const mapped: TimeEntryListItem[] = entries.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    userName: entry.user.name,
    userEmail: entry.user.email,
    clockIn: entry.clockIn.toISOString(),
    clockOut: entry.clockOut?.toISOString() ?? null,
    note: entry.note,
    durationHours: timesheetHoursForEntry(entry.clockIn, entry.clockOut),
    isOpen: entry.clockOut === null,
    createdAt: entry.createdAt.toISOString(),
  }));

  const summaryMap = new Map<string, WeeklySummaryItem>();

  const entriesByUser = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = entriesByUser.get(entry.userId) ?? [];
    list.push(entry);
    entriesByUser.set(entry.userId, list);
  }

  for (const entry of entries) {
    if (!summaryMap.has(entry.userId)) {
      const userEntries = entriesByUser.get(entry.userId) ?? [];
      summaryMap.set(entry.userId, {
        userId: entry.userId,
        userName: entry.user.name,
        totalHours: sumTimesheetHoursForWorker(userEntries, dateFrom, dateTo),
        entriesCount: userEntries.length,
        openEntries: userEntries.filter((item) => !item.clockOut).length,
      });
    }
  }

  const weeklySummary = Array.from(summaryMap.values()).sort((a, b) =>
    a.userName.localeCompare(b.userName),
  );

  return { entries: mapped, weeklySummary };
}

export interface UpdateTimeEntryInput {
  clockIn?: string;
  clockOut?: string | null;
  note?: string | null;
}

export async function updateTimeEntry(
  id: string,
  input: UpdateTimeEntryInput,
): Promise<TimeEntryListItem> {
  await assertSuperadmin();

  const existing = await prisma.timeEntry.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!existing) {
    throw new ActionError("Time entry not found", "NOT_FOUND");
  }

  const clockIn = input.clockIn ? new Date(input.clockIn) : existing.clockIn;
  let clockOut: Date | null =
    input.clockOut === undefined
      ? existing.clockOut
      : input.clockOut
        ? new Date(input.clockOut)
        : null;

  if (Number.isNaN(clockIn.getTime())) {
    throw new ActionError("Invalid clock-in time", "VALIDATION");
  }

  if (clockOut && Number.isNaN(clockOut.getTime())) {
    throw new ActionError("Invalid clock-out time", "VALIDATION");
  }

  if (clockOut && clockOut <= clockIn) {
    throw new ActionError("Clock-out must be after clock-in", "VALIDATION");
  }

  if (clockOut === null) {
    const otherOpen = await prisma.timeEntry.findFirst({
      where: {
        userId: existing.userId,
        clockOut: null,
        id: { not: id },
      },
    });
    if (otherOpen) {
      throw new ActionError(
        "Employee already has an open time entry",
        "OPEN_ENTRY_EXISTS",
      );
    }
  }

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: {
      clockIn,
      clockOut,
      note:
        input.note === undefined
          ? existing.note
          : input.note?.trim()
            ? input.note.trim()
            : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    userName: updated.user.name,
    userEmail: updated.user.email,
    clockIn: updated.clockIn.toISOString(),
    clockOut: updated.clockOut?.toISOString() ?? null,
    note: updated.note,
    durationHours: timesheetHoursForEntry(updated.clockIn, updated.clockOut),
    isOpen: updated.clockOut === null,
    createdAt: updated.createdAt.toISOString(),
  };
}

export interface CreateTimeEntryInput {
  userId: string;
  clockIn: string;
  clockOut?: string | null;
  note?: string | null;
}

function localDateKey(date: Date): string {
  return businessDateKey(date);
}

export async function createTimeEntry(
  input: CreateTimeEntryInput,
): Promise<TimeEntryListItem> {
  await assertSuperadmin();

  const user = await prisma.user.findFirst({
    where: { id: input.userId, ...getTimesheetEligibleEmployeeWhere() },
  });
  if (!user) {
    throw new ActionError("Employee not found", "NOT_FOUND");
  }

  const clockIn = new Date(input.clockIn);
  const clockOut =
    input.clockOut === undefined || input.clockOut === null
      ? null
      : new Date(input.clockOut);

  if (Number.isNaN(clockIn.getTime())) {
    throw new ActionError("Invalid clock-in time", "VALIDATION");
  }
  if (clockOut && Number.isNaN(clockOut.getTime())) {
    throw new ActionError("Invalid clock-out time", "VALIDATION");
  }
  if (clockOut && clockOut <= clockIn) {
    throw new ActionError("Clock-out must be after clock-in", "VALIDATION");
  }

  const { year, month } = getCurrentMonthParts();
  if (!isDateInMonth(localDateKey(clockIn), year, month)) {
    throw new ActionError(
      "Only dates in the current month can be logged",
      "OUT_OF_RANGE",
    );
  }

  if (clockOut === null) {
    const open = await prisma.timeEntry.findFirst({
      where: { userId: input.userId, clockOut: null },
    });
    if (open) {
      throw new ActionError(
        "Employee already has an open time entry",
        "OPEN_ENTRY_EXISTS",
      );
    }
  }

  const created = await prisma.timeEntry.create({
    data: {
      userId: input.userId,
      clockIn,
      clockOut,
      note: input.note?.trim() ? input.note.trim() : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    id: created.id,
    userId: created.userId,
    userName: created.user.name,
    userEmail: created.user.email,
    clockIn: created.clockIn.toISOString(),
    clockOut: created.clockOut?.toISOString() ?? null,
    note: created.note,
    durationHours: timesheetHoursForEntry(created.clockIn, created.clockOut),
    isOpen: created.clockOut === null,
    createdAt: created.createdAt.toISOString(),
  };
}
