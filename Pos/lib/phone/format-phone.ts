import {
  COUNTRY_PHONE_CODES,
  findCountryByIso,
} from "@/lib/phone/country-codes";

const DIAL_CODES_LONGEST_FIRST = [...COUNTRY_PHONE_CODES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

export function formatFullPhone(dialCode: string, localNumber: string): string {
  const code = dialCode.replace(/\D/g, "");
  const local = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  if (!code || !local) return "";
  return `+${code}${local}`;
}

export function formatFullPhoneFromIso(iso2: string, localNumber: string): string {
  const country = findCountryByIso(iso2);
  if (!country) return "";
  return formatFullPhone(country.dialCode, localNumber);
}

export function parseStoredPhone(stored: string): {
  countryIso: string;
  localNumber: string;
} {
  const trimmed = stored.trim();
  const digits = trimmed.startsWith("+")
    ? trimmed.slice(1).replace(/\D/g, "")
    : trimmed.replace(/\D/g, "");

  if (!digits) {
    return { countryIso: "ES", localNumber: "" };
  }

  for (const country of DIAL_CODES_LONGEST_FIRST) {
    if (digits.startsWith(country.dialCode)) {
      return {
        countryIso: country.iso2,
        localNumber: digits.slice(country.dialCode.length),
      };
    }
  }

  return {
    countryIso: "ES",
    localNumber: digits.replace(/^0+/, ""),
  };
}

export function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (!digits) throw new Error("INVALID_PHONE");
    return `+${digits}`;
  }

  const parsed = parseStoredPhone(trimmed);
  const full = formatFullPhoneFromIso(parsed.countryIso, parsed.localNumber);
  if (!full) throw new Error("INVALID_PHONE");
  return full;
}
