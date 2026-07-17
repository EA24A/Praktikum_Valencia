import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PosCategory } from "@/types";

import { normalizeComboGroups } from "@/lib/combos/auto-combo";

function serializeProduct(product: {
  id: string;
  categoryId: string;
  nameEs: string;
  nameEn: string;
  nameDe: string;
  price: { toNumber?: () => number } | number | string;
  taxRate: { toNumber?: () => number } | number | string;
  isActive: boolean;
  posOnly: boolean;
  sortOrder: number;
  comboComponentIds?: string[];
  comboComponentGroups?: unknown;
}) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    nameEs: product.nameEs,
    nameEn: product.nameEn,
    nameDe: product.nameDe,
    price: Number(product.price),
    taxRate: Number(product.taxRate),
    isActive: product.isActive,
    posOnly: product.posOnly,
    sortOrder: product.sortOrder,
    comboComponentIds: product.comboComponentIds ?? [],
    comboComponentGroups: normalizeComboGroups(
      product.comboComponentGroups,
      product.comboComponentIds ?? [],
    ),
  };
}

function serializeCategory(
  category: {
    id: string;
    nameEs: string;
    nameEn: string;
    nameDe: string;
    sortOrder: number;
    isActive: boolean;
    products: Array<Parameters<typeof serializeProduct>[0]>;
  },
): PosCategory {
  return {
    id: category.id,
    nameEs: category.nameEs,
    nameEn: category.nameEn,
    nameDe: category.nameDe,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    products: category.products.map(serializeProduct),
  };
}

async function requireSuperadminApi() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "SUPERADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive =
    session.user.role === "SUPERADMIN" &&
    searchParams.get("includeInactive") === "true";

  const categories = await prisma.category.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: includeInactive ? undefined : { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json({
    categories: categories.map(serializeCategory),
  });
}

export async function POST(request: Request) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  let body: { nameEs?: string; nameEn?: string; nameDe?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nameEs = body.nameEs?.trim();
  const nameEn = body.nameEn?.trim();

  const nameDe = body.nameDe?.trim() ?? "";

  if (!nameEs || !nameEn) {
    return NextResponse.json(
      { error: "nameEs and nameEn are required" },
      { status: 400 },
    );
  }

  const maxSort = await prisma.category.aggregate({
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      nameEs,
      nameEn,
      nameDe,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    include: { products: true },
  });

  return NextResponse.json(
    { category: serializeCategory(category) },
    { status: 201 },
  );
}
