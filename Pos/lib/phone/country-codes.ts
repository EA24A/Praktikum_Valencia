import rawCountries from "@/lib/phone/country-codes-data.json";

export type CountryPhoneCode = {
  iso2: string;
  name: string;
  dialCode: string;
};

/** All countries/territories with dial codes — Spain pinned first. */

const sorted = (rawCountries as CountryPhoneCode[]).slice().sort((a, b) =>
  a.name.localeCompare(b.name),
);
const spain = sorted.find((c) => c.iso2 === "ES");
const rest = sorted.filter((c) => c.iso2 !== "ES");

export const COUNTRY_PHONE_CODES: CountryPhoneCode[] = spain
  ? [spain, ...rest]
  : sorted;

export const DEFAULT_COUNTRY_ISO = "ES";

export function countryFlag(iso2: string): string {
  const code = iso2.toUpperCase();
  if (code.length !== 2) return "";
  return [...code]
    .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    .join("");
}

export function findCountryByIso(iso2: string): CountryPhoneCode | undefined {
  return COUNTRY_PHONE_CODES.find(
    (country) => country.iso2.toUpperCase() === iso2.toUpperCase(),
  );
}

export function findCountryByDialCode(dialCode: string): CountryPhoneCode | undefined {
  return COUNTRY_PHONE_CODES.find((country) => country.dialCode === dialCode);
}
