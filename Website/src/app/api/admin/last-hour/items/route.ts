import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  saleId: z.string(),
  menuItemId: z.string(),
  salePrice: z.number().positive(),
  stockLimit: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { saleId, menuItemId, salePrice, stockLimit } = schema.parse(body);

  const item = await prisma.lastHourSaleItem.create({
    data: {
      saleId,
      menuItemId,
      salePrice,
      stockLimit,
      stockRemaining: stockLimit,
    },
    include: { menuItem: true },
  });

  return NextResponse.json({ item });
}
