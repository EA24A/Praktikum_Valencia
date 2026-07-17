import { NextResponse } from "next/server";
import { cancelOrder } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  const result = await cancelOrder(orderId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json({ ok: true, orderId: result.data.orderId });
}
