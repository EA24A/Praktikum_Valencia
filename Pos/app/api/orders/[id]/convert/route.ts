import { NextResponse } from "next/server";
import { convertOrderType } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  let body: { type?: "DINE_IN" | "TAKEAWAY"; tableId?: string | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.type !== "DINE_IN" && body.type !== "TAKEAWAY") {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const result = await convertOrderType(orderId, {
    type: body.type,
    tableId: body.tableId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json(result.data);
}
