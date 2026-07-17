import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.seats !== undefined) data.seats = Number(body.seats);
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const table = await prisma.table.update({ where: { id }, data });
  return NextResponse.json(table);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
