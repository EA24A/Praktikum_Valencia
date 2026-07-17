import { prisma } from "./prisma";
import { parseAvailable } from "./menuPricing";
import {
  lookupWebEnrichment,
  mergeWebFields,
  normalizeMenuName,
  pickWebFields,
} from "./menuWebContent";

export type PosCatalogProductRow = {
  sku: string;
  product_type?: string;
  name: string;
  name_en?: string;
  name_ar?: string;
  category: string;
  price: number;
  tax_rate: number;
  available: string | boolean;
  pos_only?: boolean;
  display_order?: number;
};

export type PosCatalogSyncPayload = {
  version: number;
  syncedAt: string;
  products: Array<{
    id: string;
    categoryNameEs: string;
    nameEs: string;
    nameEn: string;
    price: number;
    taxRate: number;
    isActive: boolean;
    posOnly: boolean;
    sortOrder: number;
  }>;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCategoryName(value: string) {
  return value.trim().toLowerCase();
}

async function resolveCategoryId(
  categoryName: string,
  cache: Map<string, string>,
  nextOrder: { value: number }
) {
  const key = normalizeCategoryName(categoryName);
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await prisma.menuCategory.findMany();
  const match = existing.find(
    (category) => normalizeCategoryName(category.nameEs) === key
  );

  if (match) {
    cache.set(key, match.id);
    return match.id;
  }

  const created = await prisma.menuCategory.create({
    data: {
      nameEs: categoryName,
      nameEn: categoryName,
      slug: `${slugify(categoryName)}-${Date.now().toString(36)}`,
      displayOrder: nextOrder.value++,
      isActive: true,
    },
  });

  cache.set(key, created.id);
  return created.id;
}

type ExistingItem = {
  id: string;
  posProductId: string | null;
  syncedFromPosAt: Date | null;
  nameEs: string;
  nameEn: string;
  nameAr: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  allergens: string[];
  category: { nameEs: string };
};

function indexExistingItems(items: ExistingItem[]) {
  const byId = new Map<string, ExistingItem>();
  const byPosProductId = new Map<string, ExistingItem>();
  const byNameCategory = new Map<string, ExistingItem>();

  for (const item of items) {
    byId.set(item.id, item);
    if (item.posProductId) byPosProductId.set(item.posProductId, item);
    const categoryName = item.category?.nameEs ?? "";
    const key = `${normalizeCategoryName(categoryName)}::${normalizeMenuName(item.nameEs)}`;
    if (!byNameCategory.has(key)) byNameCategory.set(key, item);
  }

  return { byId, byPosProductId, byNameCategory };
}

function findExistingItem(
  row: PosCatalogProductRow,
  categoryName: string,
  indexes: ReturnType<typeof indexExistingItems>
) {
  return (
    indexes.byPosProductId.get(row.sku) ??
    indexes.byId.get(row.sku) ??
    indexes.byNameCategory.get(
      `${normalizeCategoryName(categoryName)}::${normalizeMenuName(row.name)}`
    ) ??
    null
  );
}

export function posApiPayloadToRows(payload: PosCatalogSyncPayload): PosCatalogProductRow[] {
  return payload.products.map((product) => ({
    sku: product.id,
    product_type: "product",
    name: product.nameEs,
    name_en: product.nameEn,
    category: product.categoryNameEs,
    price: product.price,
    tax_rate: product.taxRate,
    available: product.isActive,
    pos_only: product.posOnly,
    display_order: product.sortOrder,
  }));
}

export async function syncMenuFromPosProductRows(productRows: PosCatalogProductRow[]) {
  const rows = productRows.filter(
    (row) =>
      row.sku &&
      row.name &&
      row.category &&
      !Number.isNaN(row.price) &&
      (row.product_type ?? "product") === "product"
  );

  if (rows.length === 0) {
    throw new Error("No product rows found in catalog");
  }

  const posSkuSet = new Set(rows.map((row) => row.sku));
  const categoryCache = new Map<string, string>();
  const nextCategoryOrder = {
    value:
      ((
        await prisma.menuCategory.aggregate({ _max: { displayOrder: true } })
      )._max.displayOrder ?? 0) + 1,
  };

  const existingItems = await prisma.menuItem.findMany({
    include: { category: { select: { nameEs: true } } },
  });
  const indexes = indexExistingItems(existingItems);
  const matchedIds = new Set<string>();

  const syncedAt = new Date();
  let upserted = 0;
  let posOnlyCount = 0;
  let merged = 0;
  let created = 0;

  for (const row of rows) {
    const categoryId = await resolveCategoryId(
      row.category,
      categoryCache,
      nextCategoryOrder
    );
    const posOnly = row.pos_only ?? false;
    if (posOnly) posOnlyCount += 1;

    const existing = findExistingItem(row, row.category, indexes);
    const enrichment = lookupWebEnrichment(row.name);
    const web = mergeWebFields(
      existing ? pickWebFields(existing) : null,
      enrichment
    );

    const posFields = {
      categoryId,
      nameEs: row.name,
      nameEn: row.name_en || row.name,
      basePrice: row.price,
      taxRate: row.tax_rate,
      isAvailable: parseAvailable(row.available),
      posOnly,
      posProductId: row.sku,
      displayOrder: row.display_order ?? 0,
      syncedFromPosAt: syncedAt,
    };

    if (existing) {
      matchedIds.add(existing.id);
      if (existing.id !== row.sku) merged += 1;

      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          ...posFields,
          ...web,
        },
      });
    } else {
      created += 1;
      await prisma.menuItem.create({
        data: {
          id: row.sku,
          ...posFields,
          ...web,
        },
      });
      matchedIds.add(row.sku);
    }

    upserted += 1;
  }

  let deactivated = 0;

  for (const item of existingItems) {
    const linkedPosId = item.posProductId ?? item.id;
    const wasSyncedFromPos = item.syncedFromPosAt != null || item.posProductId != null;

    if (wasSyncedFromPos && !posSkuSet.has(linkedPosId) && !matchedIds.has(item.id)) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { isAvailable: false, syncedFromPosAt: syncedAt },
      });
      deactivated += 1;
    }
  }

  const activeCategoryIds = new Set(
    (
      await prisma.menuItem.findMany({
        where: { isAvailable: true },
        select: { categoryId: true },
        distinct: ["categoryId"],
      })
    ).map((item) => item.categoryId)
  );

  await prisma.menuCategory.updateMany({
    where: { id: { notIn: [...activeCategoryIds] } },
    data: { isActive: false },
  });

  await prisma.menuCategory.updateMany({
    where: { id: { in: [...activeCategoryIds] } },
    data: { isActive: true },
  });

  return {
    upserted,
    created,
    merged,
    deleted: 0,
    deactivated,
    posOnlyCount,
    webVisibleCount: upserted - posOnlyCount,
    totalInCatalog: rows.length,
    syncedAt: syncedAt.toISOString(),
  };
}

export async function restoreMenuWebContent(options?: { overwriteImages?: boolean }) {
  const items = await prisma.menuItem.findMany();
  let imagesRestored = 0;
  let textRestored = 0;

  for (const item of items) {
    const enrichment = lookupWebEnrichment(item.nameEs);
    const merged = mergeWebFields(pickWebFields(item), enrichment);

    const data: Record<string, unknown> = {};

    if (!item.nameAr && merged.nameAr) {
      data.nameAr = merged.nameAr;
      textRestored += 1;
    }
    if (!item.descriptionEs && merged.descriptionEs) data.descriptionEs = merged.descriptionEs;
    if (!item.descriptionEn && merged.descriptionEn) data.descriptionEn = merged.descriptionEn;
    if (!item.descriptionAr && merged.descriptionAr) data.descriptionAr = merged.descriptionAr;
    if (!item.isFeatured && merged.isFeatured) data.isFeatured = true;
    if (item.allergens.length === 0 && merged.allergens.length > 0) {
      data.allergens = merged.allergens;
    }

    const shouldSetImage =
      merged.imageUrl &&
      (options?.overwriteImages || !item.imageUrl);

    if (shouldSetImage) {
      data.imageUrl = merged.imageUrl;
      imagesRestored += 1;
    }

    if (Object.keys(data).length > 0) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data,
      });
    }
  }

  return { imagesRestored, textRestored, total: items.length };
}

export async function fetchAndSyncFromPosApi() {
  const url = process.env.POS_CATALOG_SYNC_URL?.trim();
  const secret = process.env.POS_CATALOG_SYNC_SECRET?.trim();

  if (!url || !secret) {
    throw new Error("POS sync not configured (POS_CATALOG_SYNC_URL / POS_CATALOG_SYNC_SECRET)");
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POS catalog fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const payload = (await res.json()) as PosCatalogSyncPayload;
  const rows = posApiPayloadToRows(payload);
  const result = await syncMenuFromPosProductRows(rows);
  return { ...result, posSyncedAt: payload.syncedAt };
}
