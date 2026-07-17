import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    itemIds: z.array(z.string()).min(1),
  }),
  z.object({
    action: z.literal("setTaxRate"),
    itemIds: z.array(z.string()).min(1),
    taxRate: z.number().min(0).max(100),
  }),
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());

  if (body.action === "setTaxRate") {
    const result = await prisma.menuItem.updateMany({
      where: { id: { in: body.itemIds } },
      data: { taxRate: body.taxRate },
    });

    return NextResponse.json({ ok: true, updated: result.count });
  }

  let deleted = 0;
  let deactivated = 0;
  const errors: string[] = [];

  for (const itemId of body.itemIds) {
    try {
      await prisma.$transaction([
        prisma.lastHourSaleItem.deleteMany({ where: { menuItemId: itemId } }),
        prisma.comboItem.deleteMany({ where: { itemId } }),
        prisma.menuItem.delete({ where: { id: itemId } }),
      ]);
      deleted += 1;
    } catch {
      try {
        await prisma.menuItem.update({
          where: { id: itemId },
          data: { isAvailable: false },
        });
        deactivated += 1;
      } catch {
        errors.push(itemId);
      }
    }
  }

  return NextResponse.json({ ok: true, deleted, deactivated, errors });
}
