import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await prisma.timeSlot.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { dayOfWeek, startTime, endTime, maxCovers } = await req.json();
  if (dayOfWeek === undefined || !startTime || !endTime || !maxCovers) {
    return NextResponse.json({ error: "dayOfWeek, startTime, endTime, maxCovers required" }, { status: 400 });
  }

  const slot = await prisma.timeSlot.create({
    data: { dayOfWeek: Number(dayOfWeek), startTime, endTime, maxCovers: Number(maxCovers) },
  });
  return NextResponse.json(slot, { status: 201 });
}
