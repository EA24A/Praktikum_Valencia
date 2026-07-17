import { timingSafeEqual } from "node:crypto";

export function verifyCatalogSyncSecret(request: Request): boolean {
  const expected = process.env.CATALOG_SYNC_SECRET?.trim();
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
