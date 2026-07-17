import { auth } from "@/auth";
import {
  getMonthTimesheet,
  upsertTimesheetCell,
  type MonthTimesheet,
} from "@/lib/actions/timesheet";
import { getCurrentMonthParts, isDateInMonth } from "@/lib/timesheet-utils";

async function assertSuperadminOnly() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  return { ok: true as const, session };
}

export async function getAdminCurrentMonthTimesheet(): Promise<
  MonthTimesheet | { error: "FORBIDDEN" }
> {
  const access = await assertSuperadminOnly();
  if (!access.ok) {
    return { error: "FORBIDDEN" };
  }

  const { year, month } = getCurrentMonthParts();
  const sheet = await getMonthTimesheet(year, month);
  return sheet ?? { year, month, workers: [], days: [], workerTotals: {} };
}

export async function upsertAdminTimesheetCell(input: {
  userId: string;
  date: string;
  fromHour: number | null;
  toHour: number | null;
}) {
  const access = await assertSuperadminOnly();
  if (!access.ok) {
    return { success: false as const, error: access.error };
  }

  const { year, month } = getCurrentMonthParts();
  if (!isDateInMonth(input.date, year, month)) {
    return { success: false as const, error: "OUT_OF_RANGE" as const };
  }

  return upsertTimesheetCell(input);
}

export async function bulkUpsertAdminTimesheetCells(input: {
  userIds: string[];
  date: string;
  fromHour: number;
  toHour: number;
}): Promise<
  | { success: true; applied: number }
  | { success: false; error: "FORBIDDEN" | "OUT_OF_RANGE" | "VALIDATION" }
> {
  const access = await assertSuperadminOnly();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const uniqueIds = [...new Set(input.userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, error: "VALIDATION" };
  }

  const { year, month } = getCurrentMonthParts();
  if (!isDateInMonth(input.date, year, month)) {
    return { success: false, error: "OUT_OF_RANGE" };
  }

  let applied = 0;
  for (const userId of uniqueIds) {
    const result = await upsertTimesheetCell({
      userId,
      date: input.date,
      fromHour: input.fromHour,
      toHour: input.toHour,
    });
    if (result.success) {
      applied += 1;
    }
  }

  return { success: true, applied };
}
