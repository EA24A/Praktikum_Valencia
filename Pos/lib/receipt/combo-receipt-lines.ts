import { calculateLineItemTax, formatDecimal } from "@/lib/calculations";

/** Standard VAT rate treated as the high-tax combo component (e.g. soft drinks). */
export const COMBO_HIGH_TAX_RATE = 21;

/** Share of combo gross price allocated to high-tax (21%) components. */
export const COMBO_HIGH_TAX_PRICE_SHARE = 0.01;

/** Share of combo gross price allocated to all other combo components. */
export const COMBO_LOW_TAX_PRICE_SHARE = 0.99;

export type ComboComponentProduct = {
  productId: string;
  nameEs: string;
  nameEn: string;
  nameDe: string;
  taxRate: number;
  /** How many of this product appear in one combo set for the line. */
  countPerSet: number;
};

export type ComboReceiptLineInput = {
  id: string;
  quantity: number;
  unitPrice: number;
  comboSourceProductIds: string[];
  comboComponents: ComboComponentProduct[];
  customReason?: string | null;
};

export type ReceiptDisplayLine = {
  id: string;
  name: string;
  nameSecondary: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  customReason: string | null;
};

function isHighTaxRate(taxRate: number): boolean {
  return formatDecimal(taxRate) === COMBO_HIGH_TAX_RATE;
}

function componentName(
  component: ComboComponentProduct,
  locale: string,
): { name: string; nameSecondary: string | null } {
  const prefix = "Combo ";

  if (locale === "de") {
    const german = component.nameDe?.trim();
    if (german) {
      return { name: `${prefix}${german}`, nameSecondary: null };
    }
  }

  const primary = component.nameEs;
  const secondary = component.nameEn;

  if (locale === "es" || primary === secondary) {
    return { name: `${prefix}${primary}`, nameSecondary: null };
  }

  return { name: `${prefix}${primary}`, nameSecondary: `${prefix}${secondary}` };
}

function countComponentsPerSet(
  comboSourceProductIds: string[],
  comboQuantity: number,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const productId of comboSourceProductIds) {
    counts.set(productId, (counts.get(productId) ?? 0) + 1);
  }

  if (comboQuantity <= 0) return counts;

  const perSet = new Map<string, number>();
  for (const [productId, totalCount] of counts) {
    perSet.set(productId, totalCount / comboQuantity);
  }
  return perSet;
}

function distributeWithRemainder(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  if (weightSum <= 0) {
    const even = formatDecimal(total / weights.length);
    const amounts = weights.map(() => even);
    const diff = formatDecimal(total - amounts.reduce((sum, value) => sum + value, 0));
    if (diff !== 0) {
      amounts[amounts.length - 1] = formatDecimal(amounts[amounts.length - 1] + diff);
    }
    return amounts;
  }

  const raw = weights.map((weight) => (total * weight) / weightSum);
  const rounded = raw.map((value) => formatDecimal(value));
  let remainder = formatDecimal(total - rounded.reduce((sum, value) => sum + value, 0));

  if (remainder !== 0) {
    const indices = weights
      .map((weight, index) => ({ index, weight }))
      .sort((a, b) => b.weight - a.weight);
    let cursor = 0;
    while (remainder !== 0 && cursor < indices.length * 4) {
      const target = indices[cursor % indices.length]!.index;
      const step = remainder > 0 ? 0.01 : -0.01;
      rounded[target] = formatDecimal(rounded[target] + step);
      remainder = formatDecimal(remainder - step);
      cursor += 1;
    }
  }

  return rounded;
}

function buildComponentList(item: ComboReceiptLineInput): ComboComponentProduct[] {
  if (item.comboComponents.length > 0) {
    return item.comboComponents;
  }

  const perSet = countComponentsPerSet(item.comboSourceProductIds, item.quantity);
  return [...perSet.entries()].map(([productId, countPerSet]) => ({
    productId,
    nameEs: productId,
    nameEn: productId,
    nameDe: "",
    taxRate: COMBO_HIGH_TAX_RATE,
    countPerSet,
  }));
}

/**
 * Split a combo order line into separate receipt rows with optimized tax allocation.
 * High-tax (21%) components receive 1% of the combo price; all others share 99%.
 */
export function expandComboReceiptLines(
  item: ComboReceiptLineInput,
  locale: string,
): ReceiptDisplayLine[] | null {
  if (item.comboSourceProductIds.length === 0) return null;

  const components = buildComponentList(item);
  const highTaxComponents = components.filter((component) => isHighTaxRate(component.taxRate));
  const lowTaxComponents = components.filter((component) => !isHighTaxRate(component.taxRate));

  if (highTaxComponents.length === 0 || lowTaxComponents.length === 0) {
    return null;
  }

  const comboQuantity = item.quantity;
  const perSetGross = formatDecimal(item.unitPrice);
  const lineGrossTotal = formatDecimal(perSetGross * comboQuantity);

  const highTaxGrossPerSet = formatDecimal(perSetGross * COMBO_HIGH_TAX_PRICE_SHARE);
  const lowTaxGrossPerSet = formatDecimal(perSetGross * COMBO_LOW_TAX_PRICE_SHARE);
  const lines: ReceiptDisplayLine[] = [];

  const appendLines = (
    group: ComboComponentProduct[],
    grossPerSet: number,
    groupKey: string,
  ) => {
    const weights = group.map((component) => component.countPerSet);
    const componentGrossPerSet = distributeWithRemainder(grossPerSet, weights);

    group.forEach((component, index) => {
      const componentGrossPerSetAmount = componentGrossPerSet[index] ?? 0;
      const lineGrossTotal = formatDecimal(componentGrossPerSetAmount * comboQuantity);
      const lineQuantity = formatDecimal(component.countPerSet * comboQuantity);
      const unitPrice =
        lineQuantity > 0 ? formatDecimal(lineGrossTotal / lineQuantity) : lineGrossTotal;
      const tax = calculateLineItemTax({
        unitPrice,
        quantity: lineQuantity,
        taxRate: component.taxRate,
      });
      const { name, nameSecondary } = componentName(component, locale);

      lines.push({
        id: `${item.id}-${groupKey}-${component.productId}`,
        name,
        nameSecondary,
        quantity: lineQuantity,
        unitPrice,
        taxRate: component.taxRate,
        subtotal: tax.subtotal,
        taxAmount: tax.taxAmount,
        total: tax.total,
        customReason: item.customReason ?? null,
      });
    });
  };

  appendLines(highTaxComponents, highTaxGrossPerSet, "high");
  appendLines(lowTaxComponents, lowTaxGrossPerSet, "low");

  const allocatedTotal = formatDecimal(lines.reduce((sum, line) => sum + line.total, 0));
  const totalDiff = formatDecimal(lineGrossTotal - allocatedTotal);
  if (totalDiff !== 0 && lines.length > 0) {
    const lastLine = lines[lines.length - 1]!;
    const adjustedTotal = formatDecimal(lastLine.total + totalDiff);
    const adjustedUnitPrice =
      lastLine.quantity > 0
        ? formatDecimal(adjustedTotal / lastLine.quantity)
        : adjustedTotal;
    const adjustedTax = calculateLineItemTax({
      unitPrice: adjustedUnitPrice,
      quantity: lastLine.quantity,
      taxRate: lastLine.taxRate,
    });
    lines[lines.length - 1] = {
      ...lastLine,
      unitPrice: adjustedUnitPrice,
      total: adjustedTotal,
      taxAmount: adjustedTax.taxAmount,
      subtotal: adjustedTax.subtotal,
    };
  }

  return lines;
}
