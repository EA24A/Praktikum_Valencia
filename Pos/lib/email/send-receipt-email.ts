import { Resend } from "resend";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendReceiptEmailMessage(input: {
  to: string;
  from: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function resolveReceiptFromEmail(settingsFrom: string): string {
  const trimmed = settingsFrom.trim();
  if (trimmed) return trimmed;
  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (envFrom) return envFrom;
  return "Casa POS <onboarding@resend.dev>";
}
