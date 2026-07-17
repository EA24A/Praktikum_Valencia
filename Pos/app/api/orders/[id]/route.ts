import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOrderDetail as getAdminOrderDetail,
  updateOrderCardReference,
} from "@/lib/actions/orders";
import { getOrderDetail as getPosOrderDetail } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "SUPERADMIN") {
    const result = await getAdminOrderDetail(id);
    if (!result.success) {
      const status =
        result.error === "FORBIDDEN" ? 403 : result.error === "NOT_FOUND" ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ order: result.data });
  }

  const result = await getPosOrderDetail(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json({ order: result.data.order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { cardReference?: string | null; splitIndex?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!("cardReference" in body)) {
    return NextResponse.json({ error: "cardReference is required" }, { status: 400 });
  }

  const result = await updateOrderCardReference(
    id,
    body.cardReference ?? null,
    typeof body.splitIndex === "number" ? body.splitIndex : undefined,
  );

  if (!result.success) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "NOT_FOUND"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
