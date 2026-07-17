"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { settingsUpdateSchema } from "@/lib/schemas/settings";
import type { BusinessSettings } from "@/types";

const SETTINGS_ID = "default";

function toBusinessSettings(record: {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  taxId: string;
  defaultTaxRate: { toNumber(): number } | number;
  currencySymbol: string;
  receiptHeaderEs: string;
  receiptHeaderEn: string;
  receiptFooterEs: string;
  receiptFooterEn: string;
  kitchenPrintingEnabled: boolean;
  receiptEmailEnabled: boolean;
  receiptFromEmail: string;
  mapWidth: number;
  mapHeight: number;
  cashRegisterBalance: { toNumber(): number } | number;
}): BusinessSettings {
  return {
    businessName: record.businessName,
    businessAddress: record.businessAddress,
    businessPhone: record.businessPhone,
    taxId: record.taxId,
    defaultTaxRate:
      typeof record.defaultTaxRate === "number"
        ? record.defaultTaxRate
        : record.defaultTaxRate.toNumber(),
    currencySymbol: record.currencySymbol,
    receiptHeaderEs: record.receiptHeaderEs,
    receiptHeaderEn: record.receiptHeaderEn,
    receiptFooterEs: record.receiptFooterEs,
    receiptFooterEn: record.receiptFooterEn,
    kitchenPrintingEnabled: record.kitchenPrintingEnabled,
    receiptEmailEnabled: record.receiptEmailEnabled,
    receiptFromEmail: record.receiptFromEmail,
    mapWidth: record.mapWidth,
    mapHeight: record.mapHeight,
    cashRegisterBalance:
      typeof record.cashRegisterBalance === "number"
        ? record.cashRegisterBalance
        : record.cashRegisterBalance.toNumber(),
  };
}

export async function getSettings(): Promise<BusinessSettings> {
  await requireSuperadmin();

  const record = await prisma.settings.findUniqueOrThrow({
    where: { id: SETTINGS_ID },
  });

  return toBusinessSettings(record);
}

export async function updateSettingsData(
  data: unknown,
): Promise<BusinessSettings> {
  await requireSuperadmin();

  const parsed = settingsUpdateSchema.parse(data);

  const record = await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: parsed,
  });

  return toBusinessSettings(record);
}

export async function updateSettings(data: unknown): Promise<BusinessSettings> {
  const settings = await updateSettingsData(data);
  revalidatePath("/admin/settings");
  return settings;
}

export async function clearRegisterCache(): Promise<{ registerCacheVersion: number }> {
  await requireSuperadmin();

  const record = await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: { registerCacheVersion: { increment: 1 } },
    select: { registerCacheVersion: true },
  });

  revalidatePath("/admin/settings");
  return { registerCacheVersion: record.registerCacheVersion };
}
