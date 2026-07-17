import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "ar", "de"],
  defaultLocale: "es",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/menu": { es: "/menu", en: "/menu", ar: "/menu", de: "/menu" },
    "/menuqr": { es: "/menuqr", en: "/menuqr", ar: "/menuqr", de: "/menuqr" },
    "/pedir": { es: "/pedir", en: "/order", ar: "/pedir", de: "/order" },
    "/reservar": { es: "/reservar", en: "/reserve", ar: "/reservar", de: "/reserve" },
    "/nosotros": { es: "/nosotros", en: "/about", ar: "/nosotros", de: "/about" },
    "/contacto": { es: "/contacto", en: "/contact", ar: "/contacto", de: "/contact" },
  },
});
