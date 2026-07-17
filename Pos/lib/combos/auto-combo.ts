export const COMBO_GROUP_COUNT = 2;

export type ComboComponentGroup = {
  productIds: string[];
  quantity: number;
};

export type ComboDefinition = {
  id: string;
  componentGroups: ComboComponentGroup[];
  price: number;
  taxRate: number;
};

export type ComboOrderLine = {
  id: string;
  productId: string;
  quantity: number;
  isVoided: boolean;
  customName: string | null;
  comboSourceProductIds?: string[];
};

export type ComboQuantityPlan = {
  componentQty: Map<string, number>;
  comboQty: Map<string, number>;
  comboSources: Map<string, string[]>;
};

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

function parseGroupEntry(value: unknown): ComboComponentGroup | null {
  if (Array.isArray(value)) {
    const productIds = value.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    return productIds.length > 0 ? { productIds, quantity: 1 } : null;
  }

  if (value && typeof value === "object") {
    const record = value as { productIds?: unknown; quantity?: unknown };
    if (!Array.isArray(record.productIds)) return null;
    const productIds = record.productIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    if (productIds.length === 0) return null;
    const quantity =
      typeof record.quantity === "number" && record.quantity >= 1
        ? Math.floor(record.quantity)
        : 1;
    return { productIds, quantity };
  }

  return null;
}

export function parseComboComponentGroups(value: unknown): ComboComponentGroup[] | null {
  if (!Array.isArray(value) || value.length !== COMBO_GROUP_COUNT) return null;
  const groups = value.map((entry) => parseGroupEntry(entry));
  if (groups.some((group) => group == null)) return null;
  return groups as ComboComponentGroup[];
}

export function normalizeComboGroups(
  comboComponentGroups: unknown,
  comboComponentIds: string[],
): ComboComponentGroup[] | null {
  const parsed = parseComboComponentGroups(comboComponentGroups);
  if (parsed) return parsed;

  if (comboComponentIds.length === COMBO_GROUP_COUNT) {
    return comboComponentIds.map((id) => ({ productIds: [id], quantity: 1 }));
  }

  return null;
}

function groupQuantity(pool: Map<string, number>, group: ComboComponentGroup): number {
  return group.productIds.reduce((sum, productId) => sum + (pool.get(productId) ?? 0), 0);
}

/** Only products from configured groups; unrelated items do not block combo matching. */
export function orderMatchesComboGroups(
  pool: Map<string, number>,
  groups: ComboComponentGroup[],
): boolean {
  const comboProductIds = new Set(groups.flatMap((group) => group.productIds));

  for (const [productId, qty] of pool) {
    if (qty <= 0) continue;
    if (!comboProductIds.has(productId)) continue;
    const matchingGroups = groups.filter((group) => group.productIds.includes(productId));
    if (matchingGroups.length !== 1) return false;
  }

  const comboOnlyPool = new Map<string, number>();
  for (const [productId, qty] of pool) {
    if (qty <= 0 || !comboProductIds.has(productId)) continue;
    comboOnlyPool.set(productId, qty);
  }

  if (comboOnlyPool.size === 0) return false;

  return comboSetsAvailable(comboOnlyPool, groups) > 0;
}

export function comboSetsAvailable(
  pool: Map<string, number>,
  groups: ComboComponentGroup[],
): number {
  return Math.min(
    ...groups.map((group) => Math.floor(groupQuantity(pool, group) / group.quantity)),
  );
}

/** Consume products for each combo set, honouring per-group quantities. */
export function consumeComboSets(
  pool: Map<string, number>,
  groups: ComboComponentGroup[],
  sets: number,
): string[] {
  const sources: string[] = [];

  for (let setIndex = 0; setIndex < sets; setIndex += 1) {
    for (const group of groups) {
      let remaining = group.quantity;

      for (const productId of group.productIds) {
        while (remaining > 0) {
          const available = pool.get(productId) ?? 0;
          if (available <= 0) break;
          pool.set(productId, available - 1);
          sources.push(productId);
          remaining -= 1;
        }
        if (remaining === 0) break;
      }

      if (remaining > 0) {
        throw new Error("Failed to consume combo set from pool");
      }
    }
  }

  return sources;
}

function expandComboLinesToComponents(
  lines: ComboOrderLine[],
  comboProductIds: Set<string>,
  comboById: Map<string, ComboDefinition>,
): Map<string, number> {
  const pool = new Map<string, number>();

  for (const line of lines) {
    if (line.isVoided || line.customName) continue;

    if (comboProductIds.has(line.productId)) {
      const combo = comboById.get(line.productId);
      if (!combo) continue;

      if (line.comboSourceProductIds && line.comboSourceProductIds.length > 0) {
        for (const productId of line.comboSourceProductIds) {
          pool.set(productId, (pool.get(productId) ?? 0) + 1);
        }
        continue;
      }

      for (let unit = 0; unit < line.quantity; unit += 1) {
        for (const group of combo.componentGroups) {
          for (let count = 0; count < group.quantity; count += 1) {
            const fallbackId = group.productIds[0];
            if (fallbackId) {
              pool.set(fallbackId, (pool.get(fallbackId) ?? 0) + 1);
            }
          }
        }
      }
      continue;
    }

    pool.set(line.productId, (pool.get(line.productId) ?? 0) + line.quantity);
  }

  return pool;
}

/**
 * Auto-combo when the order has enough matching components (with optional qty per group).
 * Unrelated items stay on the order; each full matching set becomes one combo (qty stacks).
 */
export function planComboQuantities(
  lines: ComboOrderLine[],
  comboProductIds: Set<string>,
  combos: ComboDefinition[],
): ComboQuantityPlan {
  const comboById = new Map(combos.map((combo) => [combo.id, combo]));
  const componentPool = expandComboLinesToComponents(lines, comboProductIds, comboById);

  const comboQty = new Map<string, number>();
  const comboSources = new Map<string, string[]>();
  const componentQty = new Map(componentPool);

  for (const combo of combos) {
    if (combo.componentGroups.length !== COMBO_GROUP_COUNT) continue;
    if (!orderMatchesComboGroups(componentPool, combo.componentGroups)) continue;

    const sets = comboSetsAvailable(componentPool, combo.componentGroups);
    if (!Number.isFinite(sets) || sets <= 0) continue;

    const workingPool = new Map(componentPool);
    const sources = consumeComboSets(workingPool, combo.componentGroups, sets);
    comboQty.set(combo.id, sets);
    comboSources.set(combo.id, sources);

    return { componentQty: workingPool, comboQty, comboSources };
  }

  return { componentQty, comboQty, comboSources };
}

function groupsStructureEqual(
  a: ComboComponentGroup[],
  b: ComboComponentGroup[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((group, index) => {
    const other = b[index]!;
    return group.quantity === other.quantity && setsEqual(group.productIds, other.productIds);
  });
}

export function buildComboDefinitions(
  products: Array<{
    id: string;
    nameEs: string;
    nameEn: string;
    price: number;
    taxRate: number;
    comboComponentIds: string[];
    comboComponentGroups: unknown;
  }>,
  discounts: Array<{
    nameEs: string;
    nameEn: string;
    type: string;
    value: number;
    comboProducts: string[];
    isActive: boolean;
  }>,
): ComboDefinition[] {
  const defs = new Map<string, ComboDefinition>();

  for (const product of products) {
    const groups = normalizeComboGroups(
      product.comboComponentGroups,
      product.comboComponentIds,
    );
    if (!groups) continue;

    defs.set(product.id, {
      id: product.id,
      componentGroups: groups,
      price: product.price,
      taxRate: product.taxRate,
    });
  }

  for (const discount of discounts) {
    if (!discount.isActive || discount.type !== "COMBO") continue;
    if (discount.comboProducts.length !== COMBO_GROUP_COUNT) continue;

    const discountGroups: ComboComponentGroup[] = discount.comboProducts.map((id) => ({
      productIds: [id],
      quantity: 1,
    }));

    const byGroups = products.find((product) => {
      const groups = normalizeComboGroups(
        product.comboComponentGroups,
        product.comboComponentIds,
      );
      return groups != null && groupsStructureEqual(groups, discountGroups);
    });
    const byName = products.find(
      (product) =>
        product.nameEs === discount.nameEs || product.nameEn === discount.nameEn,
    );
    const product = byGroups ?? byName;
    if (!product || defs.has(product.id)) continue;

    const groups =
      normalizeComboGroups(product.comboComponentGroups, product.comboComponentIds) ??
      discountGroups;

    defs.set(product.id, {
      id: product.id,
      componentGroups: groups,
      price: product.price,
      taxRate: product.taxRate,
    });
  }

  return [...defs.values()];
}

export { setsEqual };
