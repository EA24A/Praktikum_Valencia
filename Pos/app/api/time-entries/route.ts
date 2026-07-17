import { NextResponse } from "next/server";
import { ActionError } from "@/lib/actions/users";
import { createTimeEntry, listTimeEntries } from "@/lib/actions/time-entries";

function handleError(error: unknown) {
  if (error instanceof ActionError) {
    const status = error.code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? undefined;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const result = await listTimeEntries({
      userId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      clockIn?: string;
      clockOut?: string | null;
      note?: string | null;
    };

    if (!body.userId || !body.clockIn) {
      return NextResponse.json(
        { error: "userId and clockIn are required" },
        { status: 400 },
      );
    }

    const entry = await createTimeEntry({
      userId: body.userId,
      clockIn: body.clockIn,
      clockOut: body.clockOut,
      note: body.note,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    return handleError(error);
  }
}
