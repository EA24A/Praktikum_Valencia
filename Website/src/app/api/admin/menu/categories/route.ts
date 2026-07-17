import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { nameEs, nameEn, nameAr, displayOrder } = schema.parse(body);

  const slug = nameEs.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const maxOrder = await prisma.menuCategory.aggregate({ _max: { displayOrder: true } });
  const order = displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 1;

  const category = await prisma.menuCategory.create({
    data: {
      nameEs,
      nameEn,
      nameAr: nameAr || null,
      slug: `${slug}-${Date.now()}`,
      displayOrder: order,
    },
  });

  return NextResponse.json({ category });
}
