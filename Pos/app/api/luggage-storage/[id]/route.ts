import { NextResponse } from "next/server";
import {
  deleteLuggageStorage,
  updateLuggageStorage,
} from "@/lib/actions/luggage-storage";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    guestName?: string;
    phoneNumber?: string;
    guestEmail?: string | null;
    startedAt?: string;
    durationHours?: number;
    bagCount?: number;
    isPaid?: boolean;
    notes?: string | null;
    pickedUp?: boolean;
  };

  const result = await updateLuggageStorage(id, body);
  if (!result.success) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "NOT_FOUND"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ item: result.data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteLuggageStorage(id);
  if (!result.success) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "NOT_FOUND"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
