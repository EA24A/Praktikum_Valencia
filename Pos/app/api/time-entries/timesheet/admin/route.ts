import { NextResponse } from "next/server";
import {
  getAdminCurrentMonthTimesheet,
  upsertAdminTimesheetCell,
} from "@/lib/actions/timesheet-admin";

export async function GET() {
  const sheet = await getAdminCurrentMonthTimesheet();
  if ("error" in sheet) {
    return NextResponse.json({ error: sheet.error }, { status: 403 });
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

  const result = await upsertAdminTimesheetCell({
    userId: body.userId,
    date: body.date,
    fromHour,
    toHour,
  });

  if (!result.success) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "NOT_FOUND"
          ? 404
          : result.error === "OUT_OF_RANGE"
            ? 400
            : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
