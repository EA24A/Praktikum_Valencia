import { NextResponse } from "next/server";
import { buildCatalogSyncPayload } from "@/lib/catalog/build-catalog-sync";
import { verifyCatalogSyncSecret } from "@/lib/catalog/catalog-sync-auth";

/**
 * Machine-readable catalog for Casa Fenicia website sync.
 * Auth: Authorization: Bearer <CATALOG_SYNC_SECRET>
 */
export async function GET(request: Request) {
  if (!verifyCatalogSyncSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await buildCatalogSyncPayload();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
