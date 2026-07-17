import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendReservationConfirmationEmails } from "@/lib/emails";
import { generateOrderNumber } from "@/lib/utils";

const schema = z.object({
  date: z.string(),
  slotId: z.string(),
  partySize: z.number().min(1).max(20),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const slot = await prisma.timeSlot.findUnique({ where: { id: data.slotId } });
    if (!slot) return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });

    const reservationDate = new Date(data.date + "T" + slot.startTime + ":00");

    // Check capacity
    const existingCount = await prisma.reservation.count({
      where: {
        slotId: data.slotId,
        date: {
          gte: new Date(data.date + "T00:00:00"),
          lte: new Date(data.date + "T23:59:59"),
        },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    const existingGuests = await prisma.reservation.aggregate({
      where: {
        slotId: data.slotId,
        date: {
          gte: new Date(data.date + "T00:00:00"),
          lte: new Date(data.date + "T23:59:59"),
        },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _sum: { partySize: true },
    });

    const totalGuests = (existingGuests._sum.partySize ?? 0) + data.partySize;
    if (totalGuests > slot.maxCovers) {
      return NextResponse.json(
        { error: "No availability for this time slot" },
        { status: 409 }
      );
    }

    const reservationNumber = `RES-${generateOrderNumber()}`;

    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        slotId: data.slotId,
        date: reservationDate,
        partySize: data.partySize,
        notes: data.notes,
        statusHistory: {
          create: { status: "PENDING" },
        },
      },
    });

    const emailResult = await sendReservationConfirmationEmails(reservation);

    return NextResponse.json({
      reservationNumber: reservation.reservationNumber,
      emailSent: emailResult.ok,
      ...(emailResult.ok ? {} : { emailErrors: emailResult.errors }),
    });
  } catch (err) {
    console.error(err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
