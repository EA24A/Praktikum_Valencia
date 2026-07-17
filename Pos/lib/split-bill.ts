import { calculateLineItemTax, calculateOrderTotals, formatDecimal } from "@/lib/calculations";

export interface SplitAllocation {
  splitIndex: number;
  quantity: number;
}

export interface SplittableLineItem {
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  isVoided?: boolean;
  splitIndex?: number | null;
  splitAllocations?: SplitAllocation[] | null;
}

export interface SplitBillSummary {
  splitIndex: number;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  itemCount: number;
}

export interface SplitItemAssignment {
  itemId: string;
  allocations: SplitAllocation[];
}

function activeItems(items: SplittableLineItem[]) {
  return items.filter((item) => !item.isVoided);
}

export function normalizeSplitAllocations(
  item: SplittableLineItem,
): SplitAllocation[] {
  if (item.splitAllocations?.length) {
    return item.splitAllocations.filter((entry) => entry.quantity > 0);
  }

  const quantity = item.quantity ?? 1;
  const splitIndex = item.splitIndex ?? 0;
  return [{ splitIndex, quantity }];
}

export function allocationsFromLegacySplitIndex(
  item: SplittableLineItem,
  splitIndex: number,
): SplitAllocation[] {
  return [{ splitIndex, quantity: item.quantity ?? 1 }];
}

export function emptyAllocationsForSplits(
  splitCount: number,
): SplitAllocation[] {
  return Array.from({ length: splitCount }, (_, splitIndex) => ({
    splitIndex,
    quantity: 0,
  }));
}

export function buildDefaultItemAllocations(
  item: SplittableLineItem,
  splitCount: number,
): SplitAllocation[] {
  const existing = normalizeSplitAllocations(item);
  const bySplit = new Map<number, number>();

  for (const entry of existing) {
    if (entry.splitIndex < splitCount) {
      bySplit.set(
        entry.splitIndex,
        (bySplit.get(entry.splitIndex) ?? 0) + entry.quantity,
      );
    }
  }

  const assigned = [...bySplit.values()].reduce((sum, qty) => sum + qty, 0);
  const totalQty = item.quantity ?? 1;
  const unassigned = Math.max(0, totalQty - assigned);

  const allocations = Array.from({ length: splitCount }, (_, splitIndex) => ({
    splitIndex,
    quantity: bySplit.get(splitIndex) ?? 0,
  }));

  if (unassigned > 0) {
    const target =
      existing.find((entry) => entry.splitIndex < splitCount)?.splitIndex ?? 0;
    allocations[target] = {
      splitIndex: target,
      quantity: allocations[target]!.quantity + unassigned,
    };
  }

  return allocations;
}

export function quantityForSplit(
  item: SplittableLineItem,
  splitIndex: number,
): number {
  return normalizeSplitAllocations(item)
    .filter((entry) => entry.splitIndex === splitIndex)
    .reduce((sum, entry) => sum + entry.quantity, 0);
}

export function portionLineForSplit(
  item: SplittableLineItem,
  splitIndex: number,
): { quantity: number; subtotal: number; taxAmount: number; total: number } | null {
  const allocQty = quantityForSplit(item, splitIndex);
  if (allocQty <= 0) return null;

  const itemQty = item.quantity ?? 1;
  if (item.unitPrice != null && item.taxRate != null) {
    const line = calculateLineItemTax({
      unitPrice: item.unitPrice,
      quantity: allocQty,
      taxRate: item.taxRate,
    });
    return {
      quantity: allocQty,
      subtotal: line.subtotal,
      taxAmount: line.taxAmount,
      total: line.total,
    };
  }

  const fraction = allocQty / itemQty;
  return {
    quantity: allocQty,
    subtotal: formatDecimal(item.subtotal * fraction),
    taxAmount: formatDecimal(item.taxAmount * fraction),
    total: formatDecimal(item.total * fraction),
  };
}

function orderGrossTotal(items: SplittableLineItem[]) {
  return formatDecimal(activeItems(items).reduce((sum, item) => sum + item.total, 0));
}

export function calculateSplitTotal(
  items: SplittableLineItem[],
  splitIndex: number,
  discountTotal = 0,
) {
  const grossTotal = orderGrossTotal(items);
  const splitLines = activeItems(items)
    .map((item) => portionLineForSplit(item, splitIndex))
    .filter((line): line is NonNullable<typeof line> => line != null);

  const splitGross = formatDecimal(splitLines.reduce((sum, line) => sum + line.total, 0));
  const splitDiscount =
    grossTotal > 0 ? formatDecimal(discountTotal * (splitGross / grossTotal)) : 0;

  return {
    ...calculateOrderTotals(splitLines, splitDiscount),
    itemCount: splitLines.length,
  };
}

export function calculateSplitBillSummaries(
  items: SplittableLineItem[],
  splitCount: number,
  discountTotal = 0,
): SplitBillSummary[] {
  return Array.from({ length: splitCount }, (_, splitIndex) => ({
    splitIndex,
    ...calculateSplitTotal(items, splitIndex, discountTotal),
  }));
}

export function buildSplitBreakdownForDisplay(
  items: Array<
    SplittableLineItem & { nameEs: string; nameEn: string; nameDe?: string }
  >,
  splitCount: number,
  discountTotal = 0,
) {
  return calculateSplitBillSummaries(items, splitCount, discountTotal).map(
    (summary) => ({
      splitIndex: summary.splitIndex,
      subtotal: summary.subtotal,
      discountTotal: summary.discountTotal,
      total: summary.total,
      lines: items
        .filter((item) => !item.isVoided)
        .map((item) => {
          const portion = portionLineForSplit(item, summary.splitIndex);
          if (!portion) return null;
          return {
            nameEs: item.nameEs,
            nameEn: item.nameEn,
            nameDe: item.nameDe,
            quantity: portion.quantity,
            total: portion.total,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line != null),
    }),
  );
}

export function validateItemAssignments(
  items: SplittableLineItem[],
  assignments: SplitItemAssignment[],
  splitCount: number,
): boolean {
  const itemById = new Map(
    activeItems(items).map((item) => [(item as { id?: string }).id, item]),
  );

  for (const assignment of assignments) {
    const item = itemById.get(assignment.itemId);
    if (!item) return false;

    const totalQty = item.quantity ?? 1;
    let assigned = 0;

    for (const entry of assignment.allocations) {
      if (
        !Number.isInteger(entry.splitIndex) ||
        !Number.isInteger(entry.quantity) ||
        entry.splitIndex < 0 ||
        entry.splitIndex >= splitCount ||
        entry.quantity < 0
      ) {
        return false;
      }
      assigned += entry.quantity;
    }

    if (assigned !== totalQty) return false;
  }

  return assignments.length === itemById.size;
}
