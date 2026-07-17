# POS ↔ Website catalog sync

See the full contract in the CASAPOS repo: `CASAPOS/docs/POS-WEB-SYNC.md`.

Casa POS is the source of truth for catalog pricing. This site pulls via **Admin → Carta → Sincronizar desde POS**.

## What sync updates vs preserves

| POS-owned (updated) | Website-owned (never cleared) |
|---|---|
| names, category, price, tax, availability, `posOnly` | `imageUrl`, descriptions, `nameAr`, `isFeatured`, allergens, variants, modifiers, combos |

## Safe matching (no photo wipe)

Sync **never deletes** menu items. It matches each POS product to an existing dish by:

1. Same `id`
2. Same `posProductId`
3. Same category + Spanish name

Then it updates only POS-owned fields. Items removed from POS are **deactivated**, not deleted.

Legacy website-only items (never synced from POS) are left untouched.

## POS-only products

`posOnly: true` items sync into the DB but are hidden from `/menu`, `/pedir`, QR menu, and featured sections.
