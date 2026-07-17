import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDecimal } from "@/lib/calculations";
import { normalizeComboGroups } from "@/lib/combos/auto-combo";
import type { ComboComponentGroup } from "@/lib/combos/auto-combo";

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

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const search = searchParams.get("search")?.trim();
  const includeInactive =
    session.user.role === "SUPERADMIN" &&
    searchParams.get("includeInactive") === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              { nameEs: { contains: search, mode: "insensitive" } },
              { nameEn: { contains: search, mode: "insensitive" } },
              { nameDe: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return NextResponse.json({
    products: products.map(serializeProduct),
  });
}

export async function POST(request: Request) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  let body: {
    categoryId?: string;
    nameEs?: string;
    nameEn?: string;
    nameDe?: string;
    price?: number;
    taxRate?: number;
    sortOrder?: number;
    posOnly?: boolean;
    comboComponentIds?: string[];
    comboComponentGroups?: ComboComponentGroup[] | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nameEs = body.nameEs?.trim();
  const nameEn = body.nameEn?.trim();
  const nameDe = body.nameDe?.trim() ?? "";
  const categoryId = body.categoryId;
  const price = body.price;
  const taxRate = body.taxRate ?? 21;

  if (!categoryId || !nameEs || !nameEn || price === undefined) {
    return NextResponse.json(
      { error: "categoryId, nameEs, nameEn, and price are required" },
      { status: 400 },
    );
  }

  if (price < 0) {
    return NextResponse.json(
      { error: "Price must be non-negative" },
      { status: 400 },
    );
  }

  if (taxRate < 0 || taxRate > 100) {
    return NextResponse.json(
      { error: "Tax rate must be between 0 and 100" },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  let sortOrder = body.sortOrder;
  if (sortOrder === undefined) {
    const maxSort = await prisma.product.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });
    sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  }

  const product = await prisma.product.create({
    data: {
      categoryId,
      nameEs,
      nameEn,
      nameDe,
      price: formatDecimal(price),
      taxRate: formatDecimal(taxRate),
      sortOrder,
      posOnly: body.posOnly ?? false,
      comboComponentIds: [],
      comboComponentGroups:
        body.comboComponentGroups === undefined
          ? undefined
          : body.comboComponentGroups === null
            ? Prisma.DbNull
            : (body.comboComponentGroups as Prisma.InputJsonValue),
    },
  });

  return NextResponse.json(
    { product: serializeProduct(product) },
    { status: 201 },
  );
}
