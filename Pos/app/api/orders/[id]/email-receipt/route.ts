import { NextResponse } from "next/server";
import { sendOrderReceiptEmail } from "@/lib/actions/receipt-email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  let body: { email?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const result = await sendOrderReceiptEmail(
    orderId,
    body.email,
    body.locale ?? "es",
  );

  if (!result.success) {
    const status =
      result.error === "UNAUTHORIZED"
        ? 401
        : result.error === "FORBIDDEN"
          ? 403
          : result.error === "NOT_FOUND"
            ? 404
            : result.error === "INVALID_STATUS" ||
                result.error === "INVALID_EMAIL" ||
                result.error === "EMAIL_DISABLED"
              ? 422
              : 503;
    return NextResponse.json(
      { error: result.error, message: "message" in result ? result.message : undefined },
      { status },
    );
  }

  return NextResponse.json({ ok: true });
}
