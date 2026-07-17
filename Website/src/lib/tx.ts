/**
 * Lightweight multi-locale string picker.
 *
 * Use to inline-translate strings without going through next-intl
 * (e.g. inside server component metadata generators or one-off labels).
 *
 *   tx(locale, "Hola", "Hello", "مرحباً", "Hallo")
 *   // → "Hola" when locale==="es", "مرحباً" when locale==="ar",
 *   //   "Hallo" when locale==="de", "Hello" otherwise.
 */
export function tx(locale: string, es: string, en: string, ar?: string, de?: string): string {
  if (locale === "es") return es;
  if (locale === "ar") return ar ?? en;
  if (locale === "de") return de ?? en;
  return en;
}
