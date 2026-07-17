import { NextResponse } from "next/server";
import {
  logManualTimeEntry,
  terminalClockIn,
  terminalClockOut,
} from "@/lib/actions/terminal-time";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action: "clock-in" | "clock-out" | "log";
    userId: string;
    clockIn?: string;
    clockOut?: string;
    note?: string;
  };

  if (!body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  let result;
  switch (body.action) {
    case "clock-in":
      result = await terminalClockIn(body.userId, body.clockIn);
      break;
    case "clock-out":
      result = await terminalClockOut(body.userId, body.clockOut, body.note);
      break;
    case "log":
      if (!body.clockIn) {
        return NextResponse.json({ error: "clockIn required" }, { status: 400 });
      }
      result = await logManualTimeEntry({
        userId: body.userId,
        clockIn: body.clockIn,
        clockOut: body.clockOut,
        note: body.note,
      });
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

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

  return NextResponse.json({ entry: result.entry });
}
