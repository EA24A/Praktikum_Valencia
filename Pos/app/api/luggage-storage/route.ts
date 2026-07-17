import { NextResponse } from "next/server";
import {
  createLuggageStorage,
  listLuggageStorage,
} from "@/lib/actions/luggage-storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  const result = await listLuggageStorage({ activeOnly });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json({ items: result.data });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    guestName?: string;
    phoneNumber?: string;
    guestEmail?: string;
    startedAt?: string;
    durationHours?: number;
    bagCount?: number;
    isPaid?: boolean;
    notes?: string;
  };

  const result = await createLuggageStorage({
    guestName: body.guestName ?? "",
    phoneNumber: body.phoneNumber ?? "",
    guestEmail: body.guestEmail,
    startedAt: body.startedAt ?? new Date().toISOString(),
    durationHours: body.durationHours ?? 0,
    bagCount: body.bagCount,
    isPaid: body.isPaid,
    notes: body.notes,
  });

  if (!result.success) {
    const status = result.error === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ item: result.data });
}
