import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateTableSchema = z.object({
  number: z.string().trim().min(1).max(20).optional(),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  width: z.number().min(1).max(100).optional(),
  height: z.number().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  shape: z.enum(["rectangle", "circle"]).optional(),
  isActive: z.boolean().optional(),
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateTableSchema.parse(body);

    if (data.number) {
      const duplicate = await prisma.table.findFirst({
        where: {
          number: data.number,
          isActive: true,
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: "duplicateNumber" }, { status: 409 });
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data,
    });

    return NextResponse.json({ table });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
    return NextResponse.json({ error: "updateFailed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  const { id } = await params;

  try {
    await prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "deleteFailed" }, { status: 500 });
  }
}
