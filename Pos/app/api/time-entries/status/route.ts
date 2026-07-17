import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openEntry = await prisma.timeEntry.findFirst({
    where: {
      userId: session.user.id,
      clockOut: null,
    },
    orderBy: { clockIn: "desc" },
  });

  return NextResponse.json({ entry: openEntry });
}
