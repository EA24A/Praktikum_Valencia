/** Format elapsed minutes for admin open-orders list. */
export function formatElapsedMinutes(
  minutes: number,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string,
): string {
  if (minutes < 60) {
    return locale === "es" || locale === "de"
      ? t("elapsedMinutesOnly", { minutes })
      : t("elapsedMinutesShort", { minutes });
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return t("elapsedHoursMinutes", { hours, minutes: mins });
}
