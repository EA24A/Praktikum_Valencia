import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const dayOfWeek = parseInt(searchParams.get("dayOfWeek") ?? "0");

  if (!date) return NextResponse.json({ slots: [] });

  const slots = await prisma.timeSlot.findMany({
    where: { dayOfWeek, isActive: true },
    orderBy: { startTime: "asc" },
  });

  // For each slot, check remaining capacity
  const slotsWithAvailability = await Promise.all(
    slots.map(async (slot) => {
      const existing = await prisma.reservation.aggregate({
        where: {
          slotId: slot.id,
          date: {
            gte: new Date(date + "T00:00:00"),
            lte: new Date(date + "T23:59:59"),
          },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        _sum: { partySize: true },
      });
      const taken = existing._sum.partySize ?? 0;
      const remaining = slot.maxCovers - taken;
      return { ...slot, remaining };
    })
  );

  const available = slotsWithAvailability.filter((s) => s.remaining > 0);
  return NextResponse.json({ slots: available });
}
