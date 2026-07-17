"use server";

import { startOfDay, endOfDay } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTimesheetEligibleEmployeeWhere } from "@/lib/timesheet-workers";

async function requireTerminalAccess() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "UNAUTHORIZED" as const };
  }
  if (session.user.role !== "EMPLOYEE" && session.user.role !== "SUPERADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  return { ok: true as const, session };
}

export interface EmployeeRosterItem {
  id: string;
  name: string;
  isClockedIn: boolean;
  openEntryId: string | null;
  clockIn: string | null;
}

export interface TodayTimeEntry {
  id: string;
  userId: string;
  userName: string;
  clockIn: string;
  clockOut: string | null;
  note: string | null;
}

export async function getEmployeeRoster(): Promise<EmployeeRosterItem[]> {
  const access = await requireTerminalAccess();
  if (!access.ok) return [];

  const employees = await prisma.user.findMany({
    where: getTimesheetEligibleEmployeeWhere(),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      timeEntries: {
        where: { clockOut: null },
        orderBy: { clockIn: "desc" },
        take: 1,
        select: { id: true, clockIn: true },
      },
    },
  });

  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    isClockedIn: e.timeEntries.length > 0,
    openEntryId: e.timeEntries[0]?.id ?? null,
    clockIn: e.timeEntries[0]?.clockIn.toISOString() ?? null,
  }));
}

export async function getTodayTimeEntries(userId?: string): Promise<TodayTimeEntry[]> {
  const access = await requireTerminalAccess();
  if (!access.ok) return [];

  const now = new Date();
  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(userId ? { userId } : {}),
      clockIn: { gte: startOfDay(now), lte: endOfDay(now) },
      user: getTimesheetEligibleEmployeeWhere(),
    },
    include: { user: { select: { name: true } } },
    orderBy: { clockIn: "desc" },
  });

  return entries.map((e) => ({
    id: e.id,
    userId: e.userId,
    userName: e.user.name,
    clockIn: e.clockIn.toISOString(),
    clockOut: e.clockOut?.toISOString() ?? null,
    note: e.note,
  }));
}

export async function terminalClockIn(userId: string, clockIn?: string) {
  const access = await requireTerminalAccess();
  if (!access.ok) {
    return { success: false as const, error: access.error };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, ...getTimesheetEligibleEmployeeWhere() },
  });
  if (!user) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const open = await prisma.timeEntry.findFirst({
    where: { userId, clockOut: null },
  });
  if (open) {
    return { success: false as const, error: "ALREADY_CLOCKED_IN" as const };
  }

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      clockIn: clockIn ? new Date(clockIn) : new Date(),
    },
  });

  return { success: true as const, entry };
}

export async function terminalClockOut(
  userId: string,
  clockOut?: string,
  note?: string,
) {
  const access = await requireTerminalAccess();
  if (!access.ok) {
    return { success: false as const, error: access.error };
  }

  const open = await prisma.timeEntry.findFirst({
    where: { userId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!open) {
    return { success: false as const, error: "NOT_CLOCKED_IN" as const };
  }

  const entry = await prisma.timeEntry.update({
    where: { id: open.id },
    data: {
      clockOut: clockOut ? new Date(clockOut) : new Date(),
      note: note?.trim() || null,
    },
  });

  return { success: true as const, entry };
}

export async function logManualTimeEntry(input: {
  userId: string;
  clockIn: string;
  clockOut?: string;
  note?: string;
}) {
  const access = await requireTerminalAccess();
  if (!access.ok) {
    return { success: false as const, error: access.error };
  }

  const user = await prisma.user.findFirst({
    where: { id: input.userId, role: "EMPLOYEE", isActive: true },
  });
  if (!user) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  const clockIn = new Date(input.clockIn);
  const clockOut = input.clockOut ? new Date(input.clockOut) : null;

  if (Number.isNaN(clockIn.getTime())) {
    return { success: false as const, error: "INVALID_DATE" as const };
  }
  if (clockOut && (Number.isNaN(clockOut.getTime()) || clockOut <= clockIn)) {
    return { success: false as const, error: "INVALID_DATE" as const };
  }

  if (!clockOut) {
    const open = await prisma.timeEntry.findFirst({
      where: { userId: input.userId, clockOut: null },
    });
    if (open) {
      return { success: false as const, error: "ALREADY_CLOCKED_IN" as const };
    }
  }

  const entry = await prisma.timeEntry.create({
    data: {
      userId: input.userId,
      clockIn,
      clockOut,
      note: input.note?.trim() || null,
    },
  });

  return { success: true as const, entry };
}
