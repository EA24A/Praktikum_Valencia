import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  buildProductExportFilename,
  buildProductExportXlsx,
  type ProductExportRow,
} from "@/lib/products/export-products";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: {
      category: {
        select: { nameEs: true, nameEn: true, nameDe: true },
      },
    },
  });

  const rows: ProductExportRow[] = products.map((product) => ({
    id: product.id,
    nameEs: product.nameEs,
    nameEn: product.nameEn,
    categoryName: product.category.nameEs,
    categoryNameEn: product.category.nameEn,
    categoryNameDe: product.category.nameDe,
    price: Number(product.price),
    taxRate: Number(product.taxRate),
    isActive: product.isActive,
    posOnly: product.posOnly,
    sortOrder: product.sortOrder,
  }));

  const buffer = buildProductExportXlsx(rows);
  const filename = buildProductExportFilename();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
