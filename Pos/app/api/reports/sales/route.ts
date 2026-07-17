import { NextResponse } from "next/server";
import { getSalesOverview } from "@/lib/actions/reports";
import { getRangeFromRequest, requireReportsAccess } from "@/lib/api/reports-route";

export async function GET(request: Request) {
  const access = await requireReportsAccess();
  if ("error" in access) return access.error;

  const range = getRangeFromRequest(request);
  const data = await getSalesOverview(range);
  return NextResponse.json(data);
}
