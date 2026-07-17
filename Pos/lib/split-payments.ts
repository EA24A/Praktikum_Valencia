import type { PaymentMethod } from "@prisma/client";

export interface SplitPaymentRecord {
  splitIndex: number;
  paymentMethod: PaymentMethod;
  cardReference: string | null;
  total: number;
  amountTendered?: number | null;
  changeGiven?: number | null;
}

export function parseSplitPayments(value: unknown): SplitPaymentRecord[] {
  if (!Array.isArray(value)) return [];

  const parsed: SplitPaymentRecord[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as {
      splitIndex?: unknown;
      paymentMethod?: unknown;
      cardReference?: unknown;
      total?: unknown;
      amountTendered?: unknown;
      changeGiven?: unknown;
    };
    if (
      typeof record.splitIndex !== "number" ||
      (record.paymentMethod !== "CASH" && record.paymentMethod !== "CARD") ||
      typeof record.total !== "number"
    ) {
      continue;
    }

    parsed.push({
      splitIndex: record.splitIndex,
      paymentMethod: record.paymentMethod,
      cardReference:
        typeof record.cardReference === "string" ? record.cardReference : null,
      total: record.total,
      amountTendered:
        typeof record.amountTendered === "number" ? record.amountTendered : null,
      changeGiven:
        typeof record.changeGiven === "number" ? record.changeGiven : null,
    });
  }

  return parsed.sort((a, b) => a.splitIndex - b.splitIndex);
}

export function serializeSplitPayments(records: SplitPaymentRecord[]): SplitPaymentRecord[] {
  return [...records].sort((a, b) => a.splitIndex - b.splitIndex);
}

export function splitPaymentForIndex(
  records: SplitPaymentRecord[],
  splitIndex: number,
): SplitPaymentRecord | null {
  return records.find((record) => record.splitIndex === splitIndex) ?? null;
}

export function buildSplitPaymentSlots(input: {
  splitCount: number;
  splitPayments: SplitPaymentRecord[];
  legacyCardReference?: string | null;
  legacyPaymentMethod?: PaymentMethod | null;
}): Array<{
  splitIndex: number;
  paymentMethod: PaymentMethod | null;
  cardReference: string | null;
}> {
  const slots = Array.from({ length: input.splitCount }, (_, splitIndex) => {
    const stored = splitPaymentForIndex(input.splitPayments, splitIndex);
    if (stored) {
      return {
        splitIndex,
        paymentMethod: stored.paymentMethod,
        cardReference: stored.cardReference,
      };
    }

    const isLegacyCard =
      input.legacyPaymentMethod === "CARD" &&
      input.legacyCardReference &&
      splitIndex === input.splitCount - 1;

    return {
      splitIndex,
      paymentMethod: isLegacyCard ? ("CARD" as const) : null,
      cardReference: isLegacyCard ? input.legacyCardReference ?? null : null,
    };
  });

  return slots;
}
