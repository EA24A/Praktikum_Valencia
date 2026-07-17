import { NextResponse } from "next/server";
import { markAllKitchenOrdersCompleted } from "@/lib/actions/kitchen-orders";

export async function POST() {
  const result = await markAllKitchenOrdersCompleted();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result.data);
}
