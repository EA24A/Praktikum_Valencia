import { NextResponse } from "next/server";
import type { DiscountType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  nameEs?: string;
  nameEn?: string;
  type?: DiscountType;
  value?: number;
  requiresCashPayment?: boolean;
  comboProducts?: string[];
  isActive?: boolean;
};

function validateDiscountBody(data: {
  nameEs: string;
  nameEn: string;
  type: DiscountType;
  value: number;
  comboProducts?: string[];
}): string | null {
  const nameEs = data.nameEs.trim();
  const nameEn = data.nameEn.trim();

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

function buildDiscountData(data: {
  nameEs: string;
  nameEn: string;
  type: DiscountType;
  value: number;
  requiresCashPayment: boolean;
  comboProducts?: string[];
}) {
  const isCombo = data.type === "COMBO";
  return {
    nameEs: data.nameEs.trim(),
    nameEn: data.nameEn.trim(),
    type: data.type,
    value: data.value,
    isCombo,
    comboProducts: isCombo ? (data.comboProducts ?? []) : [],
    requiresCashPayment: data.requiresCashPayment,
  };
}

async function requireSuperadminApi() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return null;
  }
  return session;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSuperadminApi();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Discount not found" }, { status: 404 });
  }

  if (body.isActive !== undefined && Object.keys(body).length === 1) {
    const discount = await prisma.discount.update({
      where: { id },
      data: { isActive: body.isActive },
      include: { _count: { select: { orders: true } } },
    });

    return NextResponse.json({
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
    });
  }

  const merged = {
    nameEs: body.nameEs ?? existing.nameEs,
    nameEn: body.nameEn ?? existing.nameEn,
    type: body.type ?? existing.type,
    value: body.value ?? Number(existing.value),
    requiresCashPayment:
      body.requiresCashPayment ?? existing.requiresCashPayment,
    comboProducts:
      body.comboProducts ??
      (body.type === "COMBO" || existing.type === "COMBO"
        ? existing.comboProducts
        : []),
  };

  const validationError = validateDiscountBody(merged);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (merged.type === "COMBO" && merged.comboProducts.length) {
    const count = await prisma.product.count({
      where: {
        id: { in: merged.comboProducts },
        isActive: true,
      },
    });
    if (count !== merged.comboProducts.length) {
      return NextResponse.json(
        { error: "One or more selected products are invalid" },
        { status: 400 },
      );
    }
  }

  const discount = await prisma.discount.update({
    where: { id },
    data: {
      ...buildDiscountData(merged),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json({
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
  });
}
