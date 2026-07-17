import { NextResponse } from "next/server";
import { getMonthTimesheet, upsertTimesheetCell } from "@/lib/actions/timesheet";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "year and month required" }, { status: 400 });
  }

  const sheet = await getMonthTimesheet(year, month);
  if (!sheet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(sheet);
}

export async function PATCH(request: Request) {
  let body: {
    userId?: string;
    date?: string;
    fromHour?: number | null;
    toHour?: number | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.userId || !body.date) {
    return NextResponse.json({ error: "userId and date required" }, { status: 400 });
  }

  const fromHour =
    body.fromHour === null || body.fromHour === undefined
      ? null
      : Number(body.fromHour);
  const toHour =
    body.toHour === null || body.toHour === undefined ? null : Number(body.toHour);

  if (
    (fromHour != null && Number.isNaN(fromHour)) ||
    (toHour != null && Number.isNaN(toHour))
  ) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }

  const result = await upsertTimesheetCell({
    userId: body.userId,
    date: body.date,
    fromHour,
    toHour,
  });

  if (!result.success) {
    const status =
      result.error === "UNAUTHORIZED"
        ? 401
        : result.error === "FORBIDDEN"
          ? 403
          : result.error === "NOT_FOUND"
            ? 404
            : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
