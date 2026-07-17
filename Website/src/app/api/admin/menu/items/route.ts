import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  categoryId: z.string(),
  nameEs: z.string().min(1),
  nameEn: z.string().optional().default(""),
  nameAr: z.string().nullable().optional(),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().nullable().optional(),
  basePrice: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  allergens: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  const maxOrder = await prisma.menuItem.aggregate({
    where: { categoryId: data.categoryId },
    _max: { displayOrder: true },
  });

  const item = await prisma.menuItem.create({
    data: {
      ...data,
      nameEn: data.nameEn || data.nameEs,
      nameAr: data.nameAr || null,
      descriptionAr: data.descriptionAr || null,
      imageUrl: data.imageUrl || null,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
    include: { variants: true, modifierGroups: { include: { modifiers: true } } },
  });

  return NextResponse.json({ item });
}
