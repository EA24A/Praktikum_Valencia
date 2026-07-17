import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireManagerOrOwner() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "STAFF") return null;
  return session;
}

// GET /api/admin/menu-prices — all categories + items with prices
export async function GET() {
  const session = await requireManagerOrOwner();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.menuCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      items: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          nameEn: true,
          nameEs: true,
          nameAr: true,
          basePrice: true,
          isAvailable: true,
        },
      },
    },
  });

  return NextResponse.json({ categories });
}

// PATCH /api/admin/menu-prices — update a single item's price
const patchSchema = z.object({
  itemId: z.string().min(1),
  basePrice: z.number().positive().max(9999),
});

export async function PATCH(req: NextRequest) {
  const session = await requireManagerOrOwner();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { itemId, basePrice } = parsed.data;

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: { basePrice },
    select: { id: true, nameEn: true, basePrice: true },
  });

  return NextResponse.json({ item: updated });
}
