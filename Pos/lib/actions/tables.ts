"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const tableShapeSchema = z.enum(["rectangle", "circle"]);

const tableInputSchema = z.object({
  number: z.string().trim().min(1).max(20),
  x: z.number().min(0).max(100).default(0),
  y: z.number().min(0).max(100).default(0),
  width: z.number().min(1).max(100).default(10),
  height: z.number().min(1).max(100).default(10),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#3b82f6"),
  shape: tableShapeSchema.default("rectangle"),
  isActive: z.boolean().optional(),
});

const updateTableSchema = tableInputSchema.partial();

const layoutItemSchema = z.object({
  id: z.string().optional(),
  number: z.string().trim().min(1).max(20),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  shape: tableShapeSchema,
  isActive: z.boolean().default(true),
});

const saveLayoutSchema = z.object({
  tables: z.array(layoutItemSchema),
  deletedIds: z.array(z.string()).optional(),
});

export type TableActionRecord = {
  id: string;
  number: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TableActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireSuperadminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return null;
  }
  return session;
}

function serializeTable(table: {
  id: string;
  number: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TableActionRecord {
  return {
    id: table.id,
    number: table.number,
    x: table.x,
    y: table.y,
    width: table.width,
    height: table.height,
    color: table.color,
    shape: table.shape,
    isActive: table.isActive,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  };
}

export async function getTables(): Promise<TableActionResult<TableActionRecord[]>> {
  if (!(await requireSuperadminSession())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: "asc" },
    });
    return { success: true, data: tables.map(serializeTable) };
  } catch {
    return { success: false, error: "loadFailed" };
  }
}

export async function createTable(
  input: z.infer<typeof tableInputSchema>,
): Promise<TableActionResult<TableActionRecord>> {
  if (!(await requireSuperadminSession())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const data = tableInputSchema.parse(input);

    const existing = await prisma.table.findFirst({
      where: { number: data.number, isActive: true },
    });
    if (existing) {
      return { success: false, error: "duplicateNumber" };
    }

    const table = await prisma.table.create({ data });
    revalidatePath("/admin/tables");
    return { success: true, data: serializeTable(table) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "invalidInput" };
    }
    return { success: false, error: "createFailed" };
  }
}

export async function updateTable(
  id: string,
  input: z.infer<typeof updateTableSchema>,
): Promise<TableActionResult<TableActionRecord>> {
  if (!(await requireSuperadminSession())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const data = updateTableSchema.parse(input);

    if (data.number) {
      const duplicate = await prisma.table.findFirst({
        where: {
          number: data.number,
          isActive: true,
          NOT: { id },
        },
      });
      if (duplicate) {
        return { success: false, error: "duplicateNumber" };
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/tables");
    return { success: true, data: serializeTable(table) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "invalidInput" };
    }
    return { success: false, error: "updateFailed" };
  }
}

export async function deleteTable(
  id: string,
): Promise<TableActionResult<{ id: string }>> {
  if (!(await requireSuperadminSession())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/admin/tables");
    return { success: true, data: { id } };
  } catch {
    return { success: false, error: "deleteFailed" };
  }
}

export async function saveTableLayout(
  input: z.infer<typeof saveLayoutSchema>,
): Promise<TableActionResult<TableActionRecord[]>> {
  if (!(await requireSuperadminSession())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { tables, deletedIds = [] } = saveLayoutSchema.parse(input);

    const activeNumbers = tables
      .filter((table) => table.isActive)
      .map((table) => table.number);
    if (new Set(activeNumbers).size !== activeNumbers.length) {
      return { success: false, error: "duplicateNumber" };
    }

    const saved = await prisma.$transaction(async (tx) => {
      const results: TableActionRecord[] = [];

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
          results.push(serializeTable(updated));
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
          results.push(serializeTable(created));
        }
      }

      return results;
    });

    revalidatePath("/admin/tables");
    return { success: true, data: saved };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "invalidInput" };
    }
    return { success: false, error: "saveFailed" };
  }
}
