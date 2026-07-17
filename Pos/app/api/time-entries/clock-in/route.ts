import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.timeEntry.findFirst({
    where: {
      userId: session.user.id,
      clockOut: null,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Already clocked in" },
      { status: 400 },
    );
  }

  const entry = await prisma.timeEntry.create({
    data: {
      userId: session.user.id,
    },
  });

  return NextResponse.json({ entry });
}
