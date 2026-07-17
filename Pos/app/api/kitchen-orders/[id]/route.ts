import { NextResponse } from "next/server";
import { setKitchenOrderCompleted } from "@/lib/actions/kitchen-orders";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let completed = true;

  try {
    const body = (await request.json()) as { completed?: boolean };
    if (typeof body.completed === "boolean") {
      completed = body.completed;
    }
  } catch {
    // Default to marking as done when body is empty.
  }

  const result = await setKitchenOrderCompleted(id, completed);
  if (!result.success) {
    const status =
      result.error === "FORBIDDEN" ? 403 : result.error === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result.data);
}
