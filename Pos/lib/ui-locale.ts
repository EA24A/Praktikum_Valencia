import { de, enGB, es } from "date-fns/locale";

export function intlLocaleForUi(locale: string): string {
  if (locale === "es") return "es-ES";
  if (locale === "de") return "de-DE";
  return "en-GB";
}

export function dateFnsLocaleForUi(locale: string) {
  if (locale === "es") return es;
  if (locale === "de") return de;
  return enGB;
}
