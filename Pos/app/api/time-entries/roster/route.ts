import { NextResponse } from "next/server";
import { getEmployeeRoster } from "@/lib/actions/terminal-time";

export async function GET() {
  const roster = await getEmployeeRoster();
  return NextResponse.json({ roster });
}
