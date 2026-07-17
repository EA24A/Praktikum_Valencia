/**
 * Optional push hook: after POS catalog changes, notify Casa Fenicia to pull sync.
 * Set WEB_CATALOG_SYNC_URL + WEB_CATALOG_SYNC_SECRET in CASAPOS env.
 */
export async function notifyWebsiteCatalogSync() {
  const url = process.env.WEB_CATALOG_SYNC_URL?.trim();
  const secret = process.env.WEB_CATALOG_SYNC_SECRET?.trim();
  if (!url || !secret) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "casapos", at: new Date().toISOString() }),
    });
  } catch {
    // Best-effort; website can also pull on schedule or from admin UI.
  }
}
