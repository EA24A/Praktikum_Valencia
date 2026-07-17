import { NextResponse } from "next/server";
import {
  ActionError,
  createUser,
  listUsers,
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
            : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") !== "false";
    const users = await listUsers(includeInactive);
    return NextResponse.json({ users });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
      role?: Role;
    };

    const user = await createUser({
      email: body.email ?? "",
      name: body.name ?? "",
      password: body.password ?? "",
      role: body.role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
