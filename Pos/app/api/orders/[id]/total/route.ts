import { NextResponse } from "next/server";
import { setPayableTotal } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  let body: { total?: number; splitIndex?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.total == null || Number.isNaN(body.total)) {
    return NextResponse.json({ error: "total is required" }, { status: 400 });
  }

  const result = await setPayableTotal(orderId, body.total, body.splitIndex);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json(result.data);
}
