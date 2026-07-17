import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { fetchAndSyncFromPosApi } from "@/lib/posCatalogSync";

function verifySecret(request: NextRequest): boolean {
  const expected = process.env.POS_CATALOG_SYNC_SECRET?.trim();
  if (!expected) return false;

  const header = request.headers.get("authorization")?.trim();
  if (!header?.toLowerCase().startsWith("bearer ")) return false;

  const token = header.slice(7).trim();
  if (token.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Optional push hook from CASAPOS after catalog changes. */
export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
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
