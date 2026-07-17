import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDecimal } from "@/lib/calculations";
import { normalizeComboGroups } from "@/lib/combos/auto-combo";
import type { ComboComponentGroup } from "@/lib/combos/auto-combo";

type RouteContext = { params: Promise<{ id: string }> };

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
    categoryId?: string;
    nameEs?: string;
    nameEn?: string;
    nameDe?: string;
    price?: number;
    taxRate?: number;
    sortOrder?: number;
    isActive?: boolean;
    posOnly?: boolean;
    comboComponentIds?: string[];
    comboComponentGroups?: ComboComponentGroup[] | null;
    deactivate?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (body.price !== undefined && body.price < 0) {
    return NextResponse.json(
      { error: "Price must be non-negative" },
      { status: 400 },
    );
  }

  if (
    body.taxRate !== undefined &&
    (body.taxRate < 0 || body.taxRate > 100)
  ) {
    return NextResponse.json(
      { error: "Tax rate must be between 0 and 100" },
      { status: 400 },
    );
  }

  if (body.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  const isActive =
    body.deactivate === true ? false : body.isActive;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      ...(body.nameEs !== undefined && { nameEs: body.nameEs.trim() }),
      ...(body.nameEn !== undefined && { nameEn: body.nameEn.trim() }),
      ...(body.nameDe !== undefined && { nameDe: body.nameDe.trim() }),
      ...(body.price !== undefined && { price: formatDecimal(body.price) }),
      ...(body.taxRate !== undefined && {
        taxRate: formatDecimal(body.taxRate),
      }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(isActive !== undefined && { isActive }),
      ...(body.posOnly !== undefined && { posOnly: body.posOnly }),
      ...(body.comboComponentGroups !== undefined && {
        comboComponentGroups:
          body.comboComponentGroups === null
            ? Prisma.DbNull
            : (body.comboComponentGroups as Prisma.InputJsonValue),
        comboComponentIds: [],
      }),
    },
  });

  return NextResponse.json({ product: serializeProduct(product) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  const { id } = await context.params;
  const { deleteProduct } = await import("@/lib/actions/products");
  const result = await deleteProduct(id);

  if (!result.success) {
    const status = result.code === "HAS_HISTORY" || result.code === "HAS_COMBO_REF" ? 409 : 400;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({ ok: true });
}
