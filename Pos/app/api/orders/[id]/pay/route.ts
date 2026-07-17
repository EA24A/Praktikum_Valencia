import { NextResponse } from "next/server";
import { payOrder } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";
import type { PaymentMethod } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  let body: {
    paymentMethod?: PaymentMethod;
    cardReference?: string;
    amountTendered?: number;
    splitIndex?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.paymentMethod || !["CASH", "CARD"].includes(body.paymentMethod)) {
    return NextResponse.json({ error: "Valid paymentMethod is required" }, { status: 400 });
  }

  const result = await payOrder(orderId, {
    paymentMethod: body.paymentMethod,
    cardReference: body.cardReference,
    amountTendered: body.amountTendered,
    splitIndex: body.splitIndex,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        ...("message" in result && result.message ? { message: result.message } : {}),
      },
      { status: posErrorStatus(result.error) },
    );
  }

  return NextResponse.json(result.data);
}
