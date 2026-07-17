import { prisma } from "./prisma";

const EMAIL_KEYS = {
  resendApiKey: "email.resend_api_key",
  from: "email.from",
  reservationAdmin: "email.reservation_admin",
  admin: "email.admin",
} as const;

export type EmailConfig = {
  apiKey: string;
  fromEmail: string;
  adminEmail: string;
  reservationAdminEmail: string;
};

let cached: { config: EmailConfig; at: number } | null = null;
const CACHE_MS = 60_000;

function formatFrom(address: string) {
  return address.includes("<") ? address : `Casa Fenicia <${address}>`;
}

function buildConfig(input: {
  apiKey: string;
  from?: string | null;
  reservationAdmin?: string | null;
  admin?: string | null;
}): EmailConfig {
  return {
    apiKey: input.apiKey,
    fromEmail: formatFrom(input.from ?? "noreply@casafenicia.com"),
    adminEmail: input.admin ?? "admin@casafenicia.com",
    reservationAdminEmail: input.reservationAdmin ?? "ali@casafenicia.com",
  };
}

async function getDbEmailConfig(): Promise<EmailConfig | null> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) {
    return cached.config;
  }

  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: Object.values(EMAIL_KEYS) } },
    });
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const apiKey = map[EMAIL_KEYS.resendApiKey];
    if (!isValidResendKey(apiKey)) return null;

    const config = buildConfig({
      apiKey,
      from: map[EMAIL_KEYS.from],
      reservationAdmin: map[EMAIL_KEYS.reservationAdmin],
      admin: map[EMAIL_KEYS.admin],
    });

    cached = { config, at: now };
    return config;
  } catch (error) {
    console.error("[email config]", error);
    return null;
  }
}

function isValidResendKey(key?: string | null): key is string {
  return Boolean(
    key &&
      key.startsWith("re_") &&
      key.length > 20 &&
      !key.includes("...")
  );
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  if (isValidResendKey(process.env.RESEND_API_KEY)) {
    return buildConfig({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
      reservationAdmin: process.env.RESERVATION_ADMIN_EMAIL,
      admin: process.env.ADMIN_EMAIL,
    });
  }

  return getDbEmailConfig();
}

export async function isEmailConfigured() {
  const config = await getEmailConfig();
  return Boolean(config?.apiKey);
}
