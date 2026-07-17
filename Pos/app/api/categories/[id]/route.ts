import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

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

function serializeCategory(category: {
  id: string;
  nameEs: string;
  nameEn: string;
  nameDe: string;
  sortOrder: number;
  isActive: boolean;
  products: Array<Parameters<typeof serializeProduct>[0]>;
}) {
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

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  const { id } = await context.params;

  let body: {
    nameEs?: string;
    nameEn?: string;
    nameDe?: string;
    isActive?: boolean;
    sortOrder?: number;
    reorder?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.reorder && Array.isArray(body.reorder)) {
    if (body.reorder.length === 0) {
      return NextResponse.json(
        { error: "reorder array cannot be empty" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      body.reorder.map((categoryId, index) =>
        prisma.category.update({
          where: { id: categoryId },
          data: { sortOrder: index },
        }),
      ),
    );

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        products: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json({
      categories: categories.map(serializeCategory),
    });
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.nameEs !== undefined && { nameEs: body.nameEs.trim() }),
      ...(body.nameEn !== undefined && { nameEn: body.nameEn.trim() }),
      ...(body.nameDe !== undefined && { nameDe: body.nameDe.trim() }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
    include: { products: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ category: serializeCategory(category) });
}
