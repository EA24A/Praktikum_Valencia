import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Record<string, string>;

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
