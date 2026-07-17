import { NextResponse } from "next/server";
import { closeRegisterForDay } from "@/lib/actions/cash-register";

export async function POST(request: Request) {
  let body: { floatToLeave?: number; countedBalance?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.floatToLeave == null || Number.isNaN(body.floatToLeave)) {
    return NextResponse.json({ error: "floatToLeave is required" }, { status: 400 });
  }

  if (
    body.countedBalance != null &&
    (Number.isNaN(body.countedBalance) || body.countedBalance < 0)
  ) {
    return NextResponse.json({ error: "countedBalance must be zero or greater" }, { status: 400 });
  }

  const result = await closeRegisterForDay(body.floatToLeave, body.countedBalance);

  if (!result.success) {
    const status = result.error === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
