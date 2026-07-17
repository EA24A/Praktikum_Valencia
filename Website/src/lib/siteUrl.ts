/**
 * Canonical site URL.
 *
 * Uses the value from NEXT_PUBLIC_SITE_URL when set (recommended in production),
 * otherwise falls back to the canonical www host.
 */
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") as string) ||
  "https://www.casafenicia.com";
