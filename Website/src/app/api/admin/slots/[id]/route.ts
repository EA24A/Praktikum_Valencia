import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.startTime !== undefined) data.startTime = body.startTime;
  if (body.endTime !== undefined) data.endTime = body.endTime;
  if (body.maxCovers !== undefined) data.maxCovers = Number(body.maxCovers);
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.dayOfWeek !== undefined) data.dayOfWeek = Number(body.dayOfWeek);

  const slot = await prisma.timeSlot.update({ where: { id }, data });
  return NextResponse.json(slot);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.timeSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
