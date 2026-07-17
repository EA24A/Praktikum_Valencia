import { calculateLineItemTax, formatDecimal } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  buildComboDefinitions,
  planComboQuantities,
  type ComboDefinition,
} from "@/lib/combos/auto-combo";

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

async function loadComboDefinitions(): Promise<{
  combos: ComboDefinition[];
  comboProductIds: Set<string>;
}> {
  const [products, discounts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameEs: true,
        nameEn: true,
        price: true,
        taxRate: true,
        comboComponentIds: true,
        comboComponentGroups: true,
      },
    }),
    prisma.discount.findMany({
      where: { isActive: true, type: "COMBO" },
      select: {
        nameEs: true,
        nameEn: true,
        type: true,
        value: true,
        comboProducts: true,
        isActive: true,
      },
    }),
  ]);

  const combos = buildComboDefinitions(
    products.map((product) => ({
      id: product.id,
      nameEs: product.nameEs,
      nameEn: product.nameEn,
      price: decimalToNumber(product.price),
      taxRate: decimalToNumber(product.taxRate),
      comboComponentIds: product.comboComponentIds,
      comboComponentGroups: product.comboComponentGroups,
    })),
    discounts.map((discount) => ({
      nameEs: discount.nameEs,
      nameEn: discount.nameEn,
      type: discount.type,
      value: decimalToNumber(discount.value),
      comboProducts: discount.comboProducts,
      isActive: discount.isActive,
    })),
  );

  return {
    combos,
    comboProductIds: new Set(combos.map((combo) => combo.id)),
  };
}

async function setProductLineQuantity(
  orderId: string,
  productId: string,
  targetQty: number,
  product: { price: number; taxRate: number },
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    isVoided: boolean;
    customName: string | null;
    comboSourceProductIds?: string[];
  }>,
  comboSourceProductIds?: string[],
) {
  const activeLines = items.filter(
    (item) =>
      !item.isVoided &&
      !item.customName &&
      item.productId === productId,
  );
  const currentQty = activeLines.reduce((sum, item) => sum + item.quantity, 0);
  const sourcesUnchanged =
    comboSourceProductIds == null ||
    (activeLines.length === 1 &&
      JSON.stringify(activeLines[0]?.comboSourceProductIds ?? []) ===
        JSON.stringify(comboSourceProductIds));

  if (currentQty === targetQty && (targetQty === 0 || sourcesUnchanged)) return;

  if (targetQty <= 0) {
    for (const line of activeLines) {
      await prisma.orderItem.update({
        where: { id: line.id },
        data: { isVoided: true, voidedAt: new Date(), voidReason: "Auto-combo" },
      });
    }
    return;
  }

  const unitPrice = formatDecimal(product.price);
  const taxRate = formatDecimal(product.taxRate);
  const lineTax = calculateLineItemTax({
    unitPrice,
    quantity: targetQty,
    taxRate,
  });

  const sourceData =
    comboSourceProductIds != null
      ? { comboSourceProductIds }
      : { comboSourceProductIds: [] as string[] };

  if (activeLines.length === 0) {
    await prisma.orderItem.create({
      data: {
        orderId,
        productId,
        quantity: targetQty,
        unitPrice,
        taxRate,
        subtotal: lineTax.subtotal,
        taxAmount: lineTax.taxAmount,
        total: lineTax.total,
        ...sourceData,
      },
    });
    return;
  }

  const [primary, ...extra] = activeLines;
  await prisma.orderItem.update({
    where: { id: primary.id },
    data: {
      quantity: targetQty,
      unitPrice,
      taxRate,
      subtotal: lineTax.subtotal,
      taxAmount: lineTax.taxAmount,
      total: lineTax.total,
      isVoided: false,
      voidedAt: null,
      voidReason: null,
      ...sourceData,
    },
  });

  for (const line of extra) {
    await prisma.orderItem.update({
      where: { id: line.id },
      data: { isVoided: true, voidedAt: new Date(), voidReason: "Auto-combo" },
    });
  }
}

/** Reconcile order lines when component products match a configured combo. */
export async function applyAutoCombosToOrder(orderId: string) {
  const { combos, comboProductIds } = await loadComboDefinitions();
  if (combos.length === 0) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== "OPEN") return;

  const activeItems = order.items.filter((item) => !item.isVoided);
  const plan = planComboQuantities(
    activeItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      isVoided: item.isVoided,
      customName: item.customName,
      comboSourceProductIds: item.comboSourceProductIds,
    })),
    comboProductIds,
    combos,
  );

  const comboById = new Map(combos.map((combo) => [combo.id, combo]));

  const productIds = new Set<string>();
  for (const [productId] of plan.componentQty) productIds.add(productId);
  for (const [comboId] of plan.comboQty) productIds.add(comboId);
  for (const item of activeItems) {
    if (!item.customName) productIds.add(item.productId);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...productIds] } },
    select: { id: true, price: true, taxRate: true },
  });
  const productById = new Map(
    products.map((product) => [
      product.id,
      {
        price: decimalToNumber(product.price),
        taxRate: decimalToNumber(product.taxRate),
      },
    ]),
  );

  const syncTargets: Array<{
    productId: string;
    qty: number;
    price: number;
    taxRate: number;
    comboSourceProductIds?: string[];
  }> = [];

  for (const productId of productIds) {
    const isComboProduct = comboProductIds.has(productId);
    const targetQty = isComboProduct
      ? (plan.comboQty.get(productId) ?? 0)
      : (plan.componentQty.get(productId) ?? 0);

    const pricing = isComboProduct
      ? comboById.get(productId)
      : productById.get(productId);
    if (!pricing) continue;

    syncTargets.push({
      productId,
      qty: targetQty,
      price: pricing.price,
      taxRate: pricing.taxRate,
      comboSourceProductIds: isComboProduct
        ? plan.comboSources.get(productId)
        : undefined,
    });
  }

  for (const target of syncTargets) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    await setProductLineQuantity(
      orderId,
      target.productId,
      target.qty,
      { price: target.price, taxRate: target.taxRate },
      items,
      target.comboSourceProductIds,
    );
  }

  const comboDiscounts = await prisma.discount.findMany({
    where: { type: "COMBO", isActive: true },
    select: { id: true },
  });
  if (comboDiscounts.length > 0) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        discounts: {
          disconnect: comboDiscounts.map((discount) => ({ id: discount.id })),
        },
      },
    });
  }
}
