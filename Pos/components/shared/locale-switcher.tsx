"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

const localeLabels: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  de: "DE",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");

  const switchLocale = (nextLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 rounded-md border p-1" aria-label={t("language")}>
      {(Object.keys(localeLabels) as Locale[]).map((code) => (
        <Button
          key={code}
          variant={locale === code ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => switchLocale(code)}
        >
          {localeLabels[code]}
        </Button>
      ))}
    </div>
  );
}
