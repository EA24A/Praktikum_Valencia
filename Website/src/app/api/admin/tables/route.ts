import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tables = await prisma.table.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, seats } = await req.json();
  if (!name || !seats) return NextResponse.json({ error: "name and seats required" }, { status: 400 });

  const table = await prisma.table.create({ data: { name, seats: Number(seats) } });
  return NextResponse.json(table, { status: 201 });
}
