import { NextResponse } from "next/server";
import { requireApiSuperadmin } from "@/lib/auth-utils";
import { parseDateRangeParams } from "@/lib/actions/reports";

export async function requireReportsAccess() {
  const session = await requireApiSuperadmin();
  if (!session) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export function getRangeFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  return parseDateRangeParams(
    searchParams.get("from"),
    searchParams.get("to"),
  );
}
