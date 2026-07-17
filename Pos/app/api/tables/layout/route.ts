import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const layoutItemSchema = z.object({
  id: z.string().optional(),
  number: z.string().trim().min(1).max(20),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  shape: z.enum(["rectangle", "circle"]),
  isActive: z.boolean().default(true),
});

const saveLayoutSchema = z.object({
  tables: z.array(layoutItemSchema),
  deletedIds: z.array(z.string()).optional(),
});

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

export async function POST(request: Request) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { tables, deletedIds = [] } = saveLayoutSchema.parse(body);

    const saved = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const id of deletedIds) {
        await tx.table.update({
          where: { id },
          data: { isActive: false },
        });
      }

      for (const table of tables) {
        if (table.id) {
          const updated = await tx.table.update({
            where: { id: table.id },
            data: {
              number: table.number,
              x: table.x,
              y: table.y,
              width: table.width,
              height: table.height,
              color: table.color,
              shape: table.shape,
              isActive: table.isActive,
            },
          });
          results.push(updated);
        } else {
          const created = await tx.table.create({
            data: {
              number: table.number,
              x: table.x,
              y: table.y,
              width: table.width,
              height: table.height,
              color: table.color,
              shape: table.shape,
              isActive: table.isActive,
            },
          });
          results.push(created);
        }
      }

      return results;
    });

    return NextResponse.json({ tables: saved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
    return NextResponse.json({ error: "saveFailed" }, { status: 500 });
  }
}
