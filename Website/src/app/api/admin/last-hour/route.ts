import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.lastHourSale.findFirst({
    where: { date: { gte: today } },
  });

  if (existing) {
    return NextResponse.json({ error: "Sale already exists for today" }, { status: 409 });
  }

  const sale = await prisma.lastHourSale.create({
    data: { date: today, isActive: true, items: { create: [] } },
    include: { items: { include: { menuItem: true } } },
  });

  return NextResponse.json({ sale });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { saleId, isActive } = await req.json();

  const sale = await prisma.lastHourSale.update({
    where: { id: saleId },
    data: { isActive },
  });

  return NextResponse.json({ ok: true, sale });
}
