import { NextResponse } from "next/server";
import {
  ActionError,
  deactivateUser,
  deleteUser,
  updateUser,
} from "@/lib/actions/users";
import type { Role } from "@prisma/client";

function handleError(error: unknown) {
  if (error instanceof ActionError) {
    const status =
      error.code === "FORBIDDEN"
        ? 403
        : error.code === "NOT_FOUND"
          ? 404
          : error.code === "DUPLICATE_EMAIL"
            ? 409
            : error.code === "HAS_HISTORY"
              ? 409
              : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
      role?: Role;
      isActive?: boolean;
      isOwner?: boolean;
      deactivate?: boolean;
    };

    if (body.deactivate) {
      const user = await deactivateUser(id);
      return NextResponse.json({ user });
    }

    const user = await updateUser(id, {
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role,
      isActive: body.isActive,
      isOwner: body.isOwner,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await deleteUser(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}
