import { NextResponse } from "next/server";
import { getCashRegisterSummary } from "@/lib/actions/cash-register";

export async function GET() {
  const result = await getCashRegisterSummary();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result.data);
}
