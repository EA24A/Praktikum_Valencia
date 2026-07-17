import { NextResponse } from "next/server";
import { getMyTodayStats } from "@/lib/actions/employee-stats";

export async function GET() {
  const result = await getMyTodayStats();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ stats: result.data });
}
