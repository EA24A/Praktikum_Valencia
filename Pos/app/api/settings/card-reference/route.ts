import { NextResponse } from "next/server";
import { updateLastCardReference } from "@/lib/actions/pos-orders";
import { posErrorStatus } from "@/lib/pos-api-status";

export async function POST(request: Request) {
  let body: { reference?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.reference?.trim()) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const result = await updateLastCardReference(body.reference);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: posErrorStatus(result.error) });
  }

  return NextResponse.json(result.data);
}
