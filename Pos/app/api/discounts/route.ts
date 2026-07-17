import { NextResponse } from "next/server";
import type { DiscountType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type DiscountBody = {
  nameEs: string;
  nameEn: string;
  type: DiscountType;
  value: number;
  requiresCashPayment?: boolean;
  comboProducts?: string[];
};

function validateDiscountBody(data: DiscountBody): string | null {
  const nameEs = data.nameEs?.trim();
  const nameEn = data.nameEn?.trim();

  if (!nameEs || !nameEn) {
    return "Name is required in both languages";
  }

  if (data.type === "PERCENTAGE") {
    if (data.value <= 0 || data.value > 100) {
      return "Percentage must be between 0 and 100";
    }
  } else if (data.type === "FIXED_AMOUNT") {
    if (data.value <= 0) {
      return "Fixed amount must be greater than zero";
    }
  } else if (data.type === "COMBO") {
    const products = data.comboProducts ?? [];
    if (products.length !== 2) {
      return "Combo requires exactly two products";
    }
    if (data.value <= 0) {
      return "Combo price must be greater than zero";
    }
  } else {
    return "Invalid discount type";
  }

  return null;
}

function buildDiscountData(data: DiscountBody) {
  const isCombo = data.type === "COMBO";
  return {
    nameEs: data.nameEs.trim(),
    nameEn: data.nameEn.trim(),
    type: data.type,
    value: data.value,
    isCombo,
    comboProducts: isCombo ? (data.comboProducts ?? []) : [],
    requiresCashPayment: data.requiresCashPayment ?? false,
  };
}

async function requireSuperadminApi() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSuperadmin = session.user.role === "SUPERADMIN";

  const discounts = await prisma.discount.findMany({
    where: isSuperadmin ? undefined : { isActive: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({
    discounts: discounts.map((discount) => ({
      id: discount.id,
      nameEs: discount.nameEs,
      nameEn: discount.nameEn,
      type: discount.type,
      value: Number(discount.value),
      isCombo: discount.isCombo,
      comboProducts: discount.comboProducts,
      requiresCashPayment: discount.requiresCashPayment,
      isActive: discount.isActive,
      usageCount: discount._count.orders,
      createdAt: discount.createdAt.toISOString(),
      updatedAt: discount.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireSuperadminApi();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: DiscountBody;
  try {
    body = (await request.json()) as DiscountBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateDiscountBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (body.type === "COMBO" && body.comboProducts?.length) {
    const count = await prisma.product.count({
      where: {
        id: { in: body.comboProducts },
        isActive: true,
      },
    });
    if (count !== body.comboProducts.length) {
      return NextResponse.json(
        { error: "One or more selected products are invalid" },
        { status: 400 },
      );
    }
  }

  const discount = await prisma.discount.create({
    data: buildDiscountData(body),
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json(
    {
      discount: {
        id: discount.id,
        nameEs: discount.nameEs,
        nameEn: discount.nameEn,
        type: discount.type,
        value: Number(discount.value),
        isCombo: discount.isCombo,
        comboProducts: discount.comboProducts,
        requiresCashPayment: discount.requiresCashPayment,
        isActive: discount.isActive,
        usageCount: discount._count.orders,
        createdAt: discount.createdAt.toISOString(),
        updatedAt: discount.updatedAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
