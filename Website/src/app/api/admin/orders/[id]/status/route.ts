import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendOrderStatusEmail } from "@/lib/emails";

const schema = z.object({
  status: z.enum(["PENDING", "PAID", "PREPARING", "READY", "COMPLETED", "CANCELLED", "REFUNDED"]),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, note } = schema.parse(body);

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: { status, note },
      },
    },
  });

  // Notify customer
  sendOrderStatusEmail(order, order.status).catch(console.error);

  return NextResponse.json({ ok: true, status });
}
