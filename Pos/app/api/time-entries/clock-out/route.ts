import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { note?: string };

  const openEntry = await prisma.timeEntry.findFirst({
    where: {
      userId: session.user.id,
      clockOut: null,
    },
    orderBy: { clockIn: "desc" },
  });

  if (!openEntry) {
    return NextResponse.json({ error: "Not clocked in" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.update({
    where: { id: openEntry.id },
    data: {
      clockOut: new Date(),
      note: body.note?.trim() || null,
    },
  });

  return NextResponse.json({ entry });
}
