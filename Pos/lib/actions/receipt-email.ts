"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializePosOrderDetail } from "@/lib/actions/pos-orders";
import { buildReceiptEmailSubject } from "@/lib/receipt/format-receipt";
import { buildReceiptHtml } from "@/lib/receipt/receipt-html";
import type { ReceiptSettings } from "@/lib/receipt/types";
import {
  isResendConfigured,
  resolveReceiptFromEmail,
  sendReceiptEmailMessage,
} from "@/lib/email/send-receipt-email";

const emailSchema = z.string().email();

function toReceiptSettings(record: {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  taxId: string;
  currencySymbol: string;
  receiptHeaderEs: string;
  receiptHeaderEn: string;
  receiptFooterEs: string;
  receiptFooterEn: string;
}): ReceiptSettings {
  return {
    businessName: record.businessName,
    businessAddress: record.businessAddress,
    businessPhone: record.businessPhone,
    taxId: record.taxId,
    currencySymbol: record.currencySymbol,
    receiptHeaderEs: record.receiptHeaderEs,
    receiptHeaderEn: record.receiptHeaderEn,
    receiptFooterEs: record.receiptFooterEs,
    receiptFooterEn: record.receiptFooterEn,
  };
}

async function requireReceiptAccess() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "UNAUTHORIZED" as const };
  }
  if (session.user.role !== "EMPLOYEE" && session.user.role !== "SUPERADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  return { ok: true as const, session };
}

export async function sendOrderReceiptEmail(
  orderId: string,
  toEmail: string,
  locale = "es",
) {
  const access = await requireReceiptAccess();
  if (!access.ok) {
    return { success: false as const, error: access.error };
  }

  const parsedEmail = emailSchema.safeParse(toEmail.trim());
  if (!parsedEmail.success) {
    return { success: false as const, error: "INVALID_EMAIL" as const };
  }

  const settingsRecord = await prisma.settings.findUniqueOrThrow({
    where: { id: "default" },
  });

  if (!settingsRecord.receiptEmailEnabled) {
    return { success: false as const, error: "EMAIL_DISABLED" as const };
  }

  if (!isResendConfigured()) {
    return { success: false as const, error: "RESEND_NOT_CONFIGURED" as const };
  }

  const order = await serializePosOrderDetail(orderId);
  if (!order) {
    return { success: false as const, error: "NOT_FOUND" as const };
  }

  if (order.status !== "PAID") {
    return { success: false as const, error: "INVALID_STATUS" as const };
  }

  const settings = toReceiptSettings(settingsRecord);
  const html = buildReceiptHtml({ order, settings, locale });
  const subject = buildReceiptEmailSubject(order, settings, locale);
  const from = resolveReceiptFromEmail(settingsRecord.receiptFromEmail);

  try {
    await sendReceiptEmailMessage({
      to: parsedEmail.data,
      from,
      subject,
      html,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEND_FAILED";
    return { success: false as const, error: "SEND_FAILED" as const, message };
  }

  return { success: true as const };
}
