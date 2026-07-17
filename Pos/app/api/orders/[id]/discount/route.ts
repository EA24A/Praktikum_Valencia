import { NextResponse } from "next/server";
import { applyOrderDiscount } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  let body: { discountId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.discountId) {
    return NextResponse.json({ error: "discountId is required" }, { status: 400 });
  }

  const result = await applyOrderDiscount(orderId, body.discountId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json(result.data);
}
