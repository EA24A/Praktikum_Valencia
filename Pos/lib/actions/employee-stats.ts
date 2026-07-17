"use server";

import { startOfDay, endOfDay } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getMyTodayStats() {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "FORBIDDEN" as const };
  }

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const userId = session.user.id;

  const [ordersCreated, ordersPaid, revenueAgg, openEntry] = await Promise.all([
    prisma.order.count({
      where: {
        createdById: userId,
        status: "PAID",
        paidAt: { gte: dayStart, lte: dayEnd },
      },
    }),
    prisma.order.count({
      where: {
        paidById: userId,
        status: "PAID",
        paidAt: { gte: dayStart, lte: dayEnd },
      },
    }),
    prisma.order.aggregate({
      where: {
        paidById: userId,
        status: "PAID",
        paidAt: { gte: dayStart, lte: dayEnd },
      },
      _sum: { total: true },
    }),
    prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
      orderBy: { clockIn: "desc" },
    }),
  ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);
  const averageTicket = ordersPaid > 0 ? revenue / ordersPaid : 0;

  return {
    success: true as const,
    data: {
      ordersCreated,
      ordersPaid,
      revenue,
      averageTicket,
      isClockedIn: !!openEntry,
      clockIn: openEntry?.clockIn.toISOString() ?? null,
    },
  };
}
