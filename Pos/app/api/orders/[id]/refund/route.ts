import { NextResponse } from "next/server";
import { issueRefund } from "@/lib/actions/orders";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { amount?: number; reason?: string; full?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const result = await issueRefund(id, {
    amount: body.amount,
    reason: body.reason ?? "",
    full: body.full === true,
  });

  if (!result.success) {
    const statusMap: Record<string, number> = {
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      INVALID_STATUS: 422,
      INVALID_AMOUNT: 422,
      REASON_REQUIRED: 422,
    };
    return NextResponse.json({ error: result.error }, { status: statusMap[result.error] ?? 500 });
  }

  return NextResponse.json({ refund: result.data });
}
