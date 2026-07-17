import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listOrders, type OrderListFilters } from "@/lib/actions/orders";
import { createOrder, getOpenOrdersForPos } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";
import type { OrderType, PaymentMethod } from "@prisma/client";

function parseFilters(searchParams: URLSearchParams): OrderListFilters {
  const filters: OrderListFilters = {};

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const tableId = searchParams.get("tableId");
  const employeeId = searchParams.get("employeeId");
  const paymentMethod = searchParams.get("paymentMethod");

  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  if (tableId) filters.tableId = tableId;
  if (employeeId) filters.employeeId = employeeId;
  if (paymentMethod && ["CASH", "CARD"].includes(paymentMethod)) {
    filters.paymentMethod = paymentMethod as PaymentMethod;
  }

  return filters;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (scope === "pos") {
    const result = await getOpenOrdersForPos();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
    }
    return NextResponse.json(result.data);
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await listOrders(parseFilters(searchParams));

  if (!result.success) {
    const status = result.error === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  let body: { type?: OrderType; tableId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = body.type ?? "DINE_IN";
  if (type !== "DINE_IN" && type !== "TAKEAWAY" && type !== "ONLINE") {
    return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
  }

  const result = await createOrder({
    type,
    tableId: body.tableId ?? null,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json(result.data, { status: result.data.created ? 201 : 200 });
}
