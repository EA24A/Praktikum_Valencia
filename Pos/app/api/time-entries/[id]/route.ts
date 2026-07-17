import { NextResponse } from "next/server";
import { ActionError } from "@/lib/actions/users";
import { updateTimeEntry } from "@/lib/actions/time-entries";

function handleError(error: unknown) {
  if (error instanceof ActionError) {
    const status =
      error.code === "FORBIDDEN"
        ? 403
        : error.code === "NOT_FOUND"
          ? 404
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
      clockIn?: string;
      clockOut?: string | null;
      note?: string | null;
    };

    const entry = await updateTimeEntry(id, body);
    return NextResponse.json({ entry });
  } catch (error) {
    return handleError(error);
  }
}
