import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createTableSchema = z.object({
  number: z.string().trim().min(1).max(20),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  width: z.number().min(1).max(100).optional(),
  height: z.number().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  shape: z.enum(["rectangle", "circle"]).optional(),
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

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tables = await prisma.table.findMany({
    where: { isActive: true },
    orderBy: { number: "asc" },
  });

  return NextResponse.json({ tables });
}

export async function POST(request: Request) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const data = createTableSchema.parse(body);

    const existing = await prisma.table.findFirst({
      where: { number: data.number, isActive: true },
    });
    if (existing) {
      return NextResponse.json({ error: "duplicateNumber" }, { status: 409 });
    }

    const table = await prisma.table.create({
      data: {
        number: data.number,
        x: data.x ?? 0,
        y: data.y ?? 0,
        width: data.width ?? 10,
        height: data.height ?? 10,
        color: data.color ?? "#3b82f6",
        shape: data.shape ?? "rectangle",
      },
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
    return NextResponse.json({ error: "createFailed" }, { status: 500 });
  }
}
