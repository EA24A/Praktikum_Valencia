import bcrypt from "bcryptjs";
import { endOfMonth, startOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { paymentBreakdownFromGroupedRows } from "@/lib/reports/payment-breakdown";
import { sumTimesheetHoursForWorker } from "@/lib/timesheet-hours";
import { getCurrentMonthParts } from "@/lib/timesheet-utils";

const BCRYPT_ROUNDS = 12;

export class ActionError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

async function assertSuperadmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new ActionError("Forbidden", "FORBIDDEN");
  }
  return session;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  /** Timesheet hours for the current month (same rules as employee time tracking). */
  monthHours: number;
  ordersCount: number;
  isClockedIn: boolean;
}

export async function listUsers(
  includeInactive = true,
): Promise<UserListItem[]> {
  await assertSuperadmin();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const { start: monthStart, end: monthEnd } = getCurrentMonthParts(now);

  const users = await prisma.user.findMany({
    where: includeInactive ? {} : { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      isOwner: true,
      createdAt: true,
      updatedAt: true,
      timeEntries: {
        where: {
          clockIn: { lte: monthEnd },
          OR: [{ clockOut: null }, { clockOut: { gte: monthStart } }],
        },
        select: { clockIn: true, clockOut: true },
        orderBy: { clockIn: "asc" },
      },
      _count: {
        select: {
          ordersCreated: {
            where: {
              status: "PAID",
              paidAt: { gte: weekStart, lte: weekEnd },
            },
          },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const openEntries = await prisma.timeEntry.findMany({
    where: { clockOut: null },
    select: { userId: true },
  });
  const clockedInIds = new Set(openEntries.map((e) => e.userId));

  return users.map((user) => {
    const monthHours = sumTimesheetHoursForWorker(
      user.timeEntries,
      monthStart,
      monthEnd,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isOwner: user.isOwner,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      monthHours,
      ordersCount: user._count.ordersCreated,
      isClockedIn: clockedInIds.has(user.id),
    };
  });
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export async function createUser(input: CreateUserInput) {
  await assertSuperadmin();

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();

  if (!email || !name || !input.password) {
    throw new ActionError("All fields are required", "VALIDATION");
  }

  if (input.password.length < 8) {
    throw new ActionError("Password must be at least 8 characters", "VALIDATION");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ActionError("Email already in use", "DUPLICATE_EMAIL");
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: input.role ?? "EMPLOYEE",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      isOwner: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
  isOwner?: boolean;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const session = await assertSuperadmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ActionError("User not found", "NOT_FOUND");
  }

  const data: {
    email?: string;
    name?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
    isOwner?: boolean;
  } = {};

  if (input.email !== undefined) {
    const email = input.email.toLowerCase().trim();
    if (!email) {
      throw new ActionError("Email is required", "VALIDATION");
    }
    if (email !== user.email) {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        throw new ActionError("Email already in use", "DUPLICATE_EMAIL");
      }
    }
    data.email = email;
  }

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new ActionError("Name is required", "VALIDATION");
    }
    data.name = name;
  }

  if (input.password) {
    if (input.password.length < 8) {
      throw new ActionError("Password must be at least 8 characters", "VALIDATION");
    }
    data.password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  }

  if (input.role !== undefined) {
    if (session.user.id === id && input.role !== user.role) {
      throw new ActionError("You cannot change your own role", "VALIDATION");
    }
    data.role = input.role;
  }

  if (input.isActive !== undefined) {
    if (input.isActive === false && session.user.id === id) {
      throw new ActionError("You cannot deactivate your own account", "VALIDATION");
    }
    data.isActive = input.isActive;
  }

  if (input.isOwner !== undefined) {
    data.isOwner = input.isOwner;
  }

  const demotingSuperadmin =
    user.role === "SUPERADMIN" &&
    ((data.role !== undefined && data.role !== "SUPERADMIN") ||
      data.isActive === false);

  if (demotingSuperadmin) {
    const activeSuperadminCount = await prisma.user.count({
      where: { role: "SUPERADMIN", isActive: true },
    });
    if (activeSuperadminCount <= 1) {
      throw new ActionError("Cannot remove the last superadmin", "VALIDATION");
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      isOwner: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deactivateUser(id: string) {
  return updateUser(id, { isActive: false });
}

export async function deleteUser(id: string) {
  const session = await assertSuperadmin();

  if (session.user.id === id) {
    throw new ActionError("You cannot delete your own account", "VALIDATION");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ActionError("User not found", "NOT_FOUND");
  }

  if (user.role === "SUPERADMIN") {
    const superadminCount = await prisma.user.count({
      where: { role: "SUPERADMIN" },
    });
    if (superadminCount <= 1) {
      throw new ActionError("Cannot delete the last superadmin", "VALIDATION");
    }
  }

  const [ordersCount, refundsCount] = await Promise.all([
    prisma.order.count({
      where: { OR: [{ createdById: id }, { paidById: id }] },
    }),
    prisma.refund.count({ where: { issuedById: id } }),
  ]);

  if (ordersCount > 0 || refundsCount > 0) {
    throw new ActionError(
      "Cannot delete an employee with order or refund history. Deactivate them instead.",
      "HAS_HISTORY",
    );
  }

  await prisma.$transaction([
    prisma.timeEntry.deleteMany({ where: { userId: id } }),
    prisma.luggageStorage.deleteMany({ where: { createdById: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return { id };
}

export interface UserPerformanceStats {
  userId: string;
  name: string;
  email: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  entriesCount: number;
  ordersCreated: number;
  ordersPaid: number;
  totalRevenue: number;
  cashRevenue: number;
  onlineRevenue: number;
  averageTicket: number;
  openShift: boolean;
}

export async function getUserPerformanceStats(
  userId: string,
  dateFrom?: Date,
  dateTo?: Date,
): Promise<UserPerformanceStats> {
  await assertSuperadmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new ActionError("User not found", "NOT_FOUND");
  }

  const now = new Date();
  const periodStart = dateFrom ?? startOfMonth(now);
  const periodEnd = dateTo ?? endOfMonth(now);

  const [entries, ordersCreated, ordersPaid, openEntry] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: { lte: periodEnd },
        OR: [{ clockOut: null }, { clockOut: { gte: periodStart } }],
      },
      select: { clockIn: true, clockOut: true },
      orderBy: { clockIn: "asc" },
    }),
    prisma.order.count({
      where: {
        createdById: userId,
        status: "PAID",
        paidAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    prisma.order.count({
      where: {
        paidById: userId,
        status: "PAID",
        paidAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    }),
  ]);

  const totalHours = sumTimesheetHoursForWorker(entries, periodStart, periodEnd);

  const revenueAgg = await prisma.order.aggregate({
    where: {
      createdById: userId,
      status: "PAID",
      paidAt: { gte: periodStart, lte: periodEnd },
    },
    _sum: { total: true },
  });

  const paymentRows = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: {
      createdById: userId,
      status: "PAID",
      paidAt: { gte: periodStart, lte: periodEnd },
      paymentMethod: { not: null },
    },
    _sum: { total: true },
    _count: true,
  });

  const toNumber = (value: { toNumber(): number } | number | null | undefined) => {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    return value.toNumber();
  };

  const paymentBreakdown = paymentBreakdownFromGroupedRows(paymentRows, toNumber);
  const totalRevenue = Number(revenueAgg._sum.total ?? 0);

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalHours,
    entriesCount: entries.length,
    ordersCreated,
    ordersPaid,
    totalRevenue,
    cashRevenue: paymentBreakdown.cash.revenue,
    onlineRevenue: paymentBreakdown.online.revenue,
    averageTicket: ordersCreated > 0 ? totalRevenue / ordersCreated : 0,
    openShift: Boolean(openEntry),
  };
}
