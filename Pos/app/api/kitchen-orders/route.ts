import { NextResponse } from "next/server";
import { getKitchenOrders } from "@/lib/actions/kitchen-orders";

export async function GET() {
  const result = await getKitchenOrders();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result.data);
}
