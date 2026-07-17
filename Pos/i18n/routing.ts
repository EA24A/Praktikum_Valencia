import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "de"],
  defaultLocale: "es",
  localePrefix: "never",
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];
