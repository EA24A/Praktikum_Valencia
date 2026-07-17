import { NextResponse } from "next/server";
import { getTodayTimeEntries } from "@/lib/actions/terminal-time";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? undefined;
  const entries = await getTodayTimeEntries(userId);
  return NextResponse.json({ entries });
}
