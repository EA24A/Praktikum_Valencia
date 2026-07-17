import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchAndSyncFromPosApi } from "@/lib/posCatalogSync";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await fetchAndSyncFromPosApi();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "POS sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
