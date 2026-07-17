import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/siteUrl";
const BASE_URL = SITE_URL;

const PATH_BY_LOCALE: Record<string, Record<string, string>> = {
  es: { home: "", menu: "/menu", order: "/pedir", reserve: "/reservar", about: "/nosotros", contact: "/contacto" },
  en: { home: "", menu: "/menu", order: "/order", reserve: "/reserve", about: "/about", contact: "/contact" },
  ar: { home: "", menu: "/menu", order: "/pedir", reserve: "/reservar", about: "/nosotros", contact: "/contacto" },
  de: { home: "", menu: "/menu", order: "/order", reserve: "/reserve", about: "/about", contact: "/contact" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  for (const [locale, paths] of Object.entries(PATH_BY_LOCALE)) {
    for (const [pageKey, path] of Object.entries(paths)) {
      // Build the full alternates map for hreflang
      const alternates: Record<string, string> = {};
      for (const [otherLocale, otherPaths] of Object.entries(PATH_BY_LOCALE)) {
        alternates[otherLocale] = `${BASE_URL}/${otherLocale}${otherPaths[pageKey]}`;
      }
      alternates["x-default"] = `${BASE_URL}/es${PATH_BY_LOCALE.es[pageKey]}`;

      routes.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: pageKey === "home" ? "daily" : "weekly",
        priority: pageKey === "home" ? 1.0 : 0.85,
        alternates: { languages: alternates },
      });
    }
  }

  return routes;
}
