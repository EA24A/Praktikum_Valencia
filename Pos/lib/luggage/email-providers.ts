/** Common email domains for tourist quick-fill (EU-focused). */
export const EMAIL_PROVIDER_DOMAINS = [
  { id: "gmail", label: "@gmail.com", domain: "gmail.com" },
  { id: "googlemail", label: "@googlemail.com", domain: "googlemail.com" },
  { id: "gmx-de", label: "@gmx.de", domain: "gmx.de" },
  { id: "gmx-net", label: "@gmx.net", domain: "gmx.net" },
  { id: "web-de", label: "@web.de", domain: "web.de" },
  { id: "outlook", label: "@outlook.com", domain: "outlook.com" },
  { id: "hotmail", label: "@hotmail.com", domain: "hotmail.com" },
  { id: "live", label: "@live.com", domain: "live.com" },
  { id: "yahoo", label: "@yahoo.com", domain: "yahoo.com" },
  { id: "icloud", label: "@icloud.com", domain: "icloud.com" },
  { id: "proton", label: "@proton.me", domain: "proton.me" },
  { id: "t-online", label: "@t-online.de", domain: "t-online.de" },
  { id: "orange", label: "@orange.es", domain: "orange.es" },
  { id: "libero", label: "@libero.it", domain: "libero.it" },
] as const;

export function applyEmailProvider(value: string, domain: string): string {
  const local = value.includes("@")
    ? value.split("@")[0]?.trim() ?? ""
    : value.trim();
  if (!local) {
    return `@${domain}`;
  }
  return `${local}@${domain}`;
}

export function normalizeGuestEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("@")) return null;
  return trimmed.toLowerCase();
}

export function isValidGuestEmail(value: string): boolean {
  const email = normalizeGuestEmail(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
