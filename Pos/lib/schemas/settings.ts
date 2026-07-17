import { z } from "zod";

export const settingsUpdateSchema = z.object({
  businessName: z.string().min(1).max(200),
  businessAddress: z.string().max(500),
  businessPhone: z.string().max(50),
  taxId: z.string().max(50),
  defaultTaxRate: z.number().min(0).max(100),
  currencySymbol: z.string().min(1).max(5),
  receiptHeaderEs: z.string().max(1000),
  receiptHeaderEn: z.string().max(1000),
  receiptFooterEs: z.string().max(1000),
  receiptFooterEn: z.string().max(1000),
  kitchenPrintingEnabled: z.boolean(),
  receiptEmailEnabled: z.boolean(),
  receiptFromEmail: z.string().max(200),
  mapWidth: z.number().int().min(50).max(500),
  mapHeight: z.number().int().min(50).max(500),
  cashRegisterBalance: z.number().min(0),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
