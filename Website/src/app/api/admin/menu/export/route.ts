import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMenuExportBuffer, buildMenuExportFilename } from "@/lib/menuExport";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [categories, combos] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        items: {
          orderBy: { displayOrder: "asc" },
          include: {
            variants: true,
            modifierGroups: { include: { modifiers: true } },
          },
        },
      },
    }),
    prisma.comboDeal.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        items: { include: { item: true } },
      },
    }),
  ]);

  const buffer = buildMenuExportBuffer(categories, combos);
  const filename = buildMenuExportFilename();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
