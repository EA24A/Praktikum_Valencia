# POS ↔ Website catalog sync

Casa POS (`CASAPOS`) is the **source of truth** for product names, categories, prices, tax rates, and availability. Casa Fenicia (`casafenicia`) pulls the catalog and displays only non–POS-only items on the public site.

## Concepts

| Field | CASAPOS (`Product.posOnly`) | Website (`MenuItem.posOnly`) |
|-------|----------------------------|------------------------------|
| `false` | Shown on POS **and** website | Synced; visible on menu / order |
| `true` | Shown on POS only (toppings, ice latte extras, etc.) | Synced to DB but **hidden** from public pages |

**POS-owned fields** (updated on every sync): `id`, category, `nameEs`/`nameEn`, `basePrice`, `taxRate`, `isAvailable`, `posOnly`, `displayOrder`.

**Website-owned fields** (preserved on sync): descriptions, `nameAr`, `imageUrl`, `isFeatured`, `allergens`, variants, modifiers, combos.

**Sync safety:** never deletes menu items. Matches POS products to existing dishes by ID, `posProductId`, or category + Spanish name so photos and descriptions stay attached. Items removed from POS are deactivated only.

## API (pull sync)

### CASAPOS → JSON catalog

```
GET /api/catalog/sync
Authorization: Bearer <CATALOG_SYNC_SECRET>
```

Returns `{ version, syncedAt, categories[], products[] }`.

### Website endpoints

```
POST /api/admin/menu/sync-pos     # Admin UI — pulls from POS
POST /api/webhooks/pos-catalog    # Optional push from POS after changes
```

Both use the same sync engine as XLSX import (`src/lib/posCatalogSync.ts`).

## Environment variables

### CASAPOS (`.env`)

```env
CATALOG_SYNC_SECRET=shared-secret-with-website
# Optional push to website after product save:
WEB_CATALOG_SYNC_URL=https://www.casafenicia.com/api/webhooks/pos-catalog
WEB_CATALOG_SYNC_SECRET=shared-secret-with-website
```

### Casa Fenicia (`.env.local` / Vercel)

```env
POS_CATALOG_SYNC_URL=https://your-pos-domain.com/api/catalog/sync
POS_CATALOG_SYNC_SECRET=shared-secret-with-website
```

Use the **same** secret for `CATALOG_SYNC_SECRET` and `POS_CATALOG_SYNC_SECRET`.

**Local dev** (run POS on port 3000, website on 3001):

```env
# CASAPOS
CATALOG_SYNC_SECRET=dev-sync-secret
WEB_CATALOG_SYNC_URL=http://localhost:3001/api/webhooks/pos-catalog
WEB_CATALOG_SYNC_SECRET=dev-sync-secret

# casafenicia
POS_CATALOG_SYNC_URL=http://localhost:3000/api/catalog/sync
POS_CATALOG_SYNC_SECRET=dev-sync-secret
```

## Workflows

1. **Add/edit products in CASAPOS admin** → optional webhook → website pulls sync.
2. **Manual sync**: Casa Fenicia admin → Carta → **Sincronizar desde POS**.
3. **Excel fallback**: Export from CASAPOS → Import XLSX on website (includes `pos_only` column).

## Adding POS-only toppings (e.g. ice latte)

1. In CASAPOS, create products (e.g. “Extra shot”, “Oat milk”) with **Solo TPV / POS only** checked.
2. Sync to website — they exist in admin but do not appear on `/menu`, `/pedir`, or QR menu.
3. Staff add them as separate line items on the POS ticket.

## Cursor agents

When changing catalog behavior, update **both** repos and this doc:

- **CASAPOS**: schema, export, `/api/catalog/sync`, product form `posOnly`
- **casafenicia**: `posCatalogSync.ts`, public queries filter `posOnly: false`, admin sync button
