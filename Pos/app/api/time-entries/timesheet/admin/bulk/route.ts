import { NextResponse } from "next/server";
import { bulkUpsertAdminTimesheetCells } from "@/lib/actions/timesheet-admin";

export async function POST(request: Request) {
  let body: {
    userIds?: string[];
    date?: string;
    fromHour?: number;
    toHour?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.date || !body.userIds?.length) {
    return NextResponse.json(
      { error: "date and userIds are required" },
      { status: 400 },
    );
  }

  if (body.fromHour == null || body.toHour == null) {
    return NextResponse.json(
      { error: "fromHour and toHour are required" },
      { status: 400 },
    );
  }

  const fromHour = Number(body.fromHour);
  const toHour = Number(body.toHour);
  if (Number.isNaN(fromHour) || Number.isNaN(toHour)) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }

  const result = await bulkUpsertAdminTimesheetCells({
    userIds: body.userIds,
    date: body.date,
    fromHour,
    toHour,
  });

  if (!result.success) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "OUT_OF_RANGE"
          ? 400
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ applied: result.applied });
}
