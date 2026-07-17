import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendReservationStatusEmail } from "@/lib/emails";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  note: z.string().optional(),
  tableId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, note, tableId } = schema.parse(body);

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      status,
      ...(tableId ? { tableId } : {}),
      statusHistory: {
        create: { status, note },
      },
    },
  });

  try {
    await sendReservationStatusEmail(reservation);
  } catch (err) {
    console.error("[reservation status email]", err);
  }

  return NextResponse.json({ ok: true, status });
}
