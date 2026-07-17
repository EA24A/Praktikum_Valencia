import { NextResponse } from "next/server";
import {
  addCustomOrderItem,
  addOrderItem,
  updateItemQty,
  updateItemUnitPrice,
  voidOrderItem,
} from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params;

  let body: {
    action?: "add" | "addCustom" | "update" | "updatePrice" | "void";
    productId?: string;
    name?: string;
    price?: number;
    taxRate?: number;
    reason?: string;
    itemId?: string;
    quantity?: number;
    unitPrice?: number;
    voidReason?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;

  if (action === "add") {
    if (!body.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
    const result = await addOrderItem(orderId, body.productId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
    }
    return NextResponse.json(result.data);
  }

  if (action === "addCustom") {
    if (
      !body.name?.trim() ||
      body.price == null ||
      body.taxRate == null ||
      !body.reason?.trim()
    ) {
      return NextResponse.json(
        { error: "name, price, taxRate, and reason are required" },
        { status: 400 },
      );
    }
    const result = await addCustomOrderItem(orderId, {
      name: body.name,
      price: body.price,
      taxRate: body.taxRate,
      reason: body.reason,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
    }
    return NextResponse.json(result.data);
  }

  if (action === "update") {
    if (!body.itemId || body.quantity == null) {
      return NextResponse.json(
        { error: "itemId and quantity are required" },
        { status: 400 },
      );
    }
    const result = await updateItemQty(orderId, body.itemId, body.quantity);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
    }
    return NextResponse.json(result.data);
  }

  if (action === "updatePrice") {
    if (!body.itemId || body.unitPrice == null) {
      return NextResponse.json(
        { error: "itemId and unitPrice are required" },
        { status: 400 },
      );
    }
    const result = await updateItemUnitPrice(orderId, body.itemId, body.unitPrice);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
    }
    return NextResponse.json(result.data);
  }

  if (action === "void") {
    if (!body.itemId || !body.voidReason?.trim()) {
      return NextResponse.json(
        { error: "itemId and voidReason are required" },
        { status: 400 },
      );
    }
    const result = await voidOrderItem(orderId, body.itemId, body.voidReason);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
    }
    return NextResponse.json(result.data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
