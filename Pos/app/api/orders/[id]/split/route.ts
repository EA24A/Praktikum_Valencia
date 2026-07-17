import { NextResponse } from "next/server";
import { configureSplitBill } from "@/lib/actions/pos-orders";
import type { SplitItemAssignment } from "@/lib/split-bill";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  let body: {
    isSplitBill?: boolean;
    splitCount?: number;
    assignments?: SplitItemAssignment[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.isSplitBill == null) {
    return NextResponse.json({ error: "isSplitBill is required" }, { status: 400 });
  }

  const result = await configureSplitBill(orderId, {
    isSplitBill: body.isSplitBill,
    splitCount: body.splitCount,
    assignments: body.assignments,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json(result.data);
}
