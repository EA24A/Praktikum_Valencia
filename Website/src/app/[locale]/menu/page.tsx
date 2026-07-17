import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import MenuPageClient from "@/components/public/MenuPageClient";
import { serializeDecimal } from "@/lib/serializeMenu";
import PageReveal from "@/components/ui/PageReveal";
import { SITE_URL } from "@/lib/siteUrl";
import { tx } from "@/lib/tx";
import { getSiteImages } from "@/lib/siteImages";
import { publicMenuItemWhere } from "@/lib/menuPublicFilter";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const seo = await prisma.seoSetting
    .findUnique({ where: { pageKey_locale: { pageKey: "menu", locale } } })
    .catch(() => null);
  return {
    title:
      seo?.title ??
      tx(locale, "Carta – Casa Fenicia Valencia", "Menu – Casa Fenicia Valencia", "القائمة – كازا فينيسيا فالنسيا", "Speisekarte – Casa Fenicia Valencia"),
    description:
      seo?.description ??
      tx(
        locale,
        "Descubre nuestra carta de cocina libanesa: hummus, shawarma, falafel, kibbeh y mucho más. Ingredientes frescos, recetas auténticas.",
        "Explore our Lebanese menu: hummus, shawarma, falafel, kibbeh and much more. Fresh ingredients, authentic recipes.",
        "اكتشف قائمتنا اللبنانية: حمص، شاورما، فلافل، كبة وأكثر بكثير. مكونات طازجة ووصفات أصيلة.",
        "Entdecken Sie unsere libanesische Speisekarte: Hummus, Shawarma, Falafel, Kibbeh und vieles mehr. Frische Zutaten, authentische Rezepte."
      ),
    alternates: {
      canonical: `${SITE_URL}/${locale}/menu`,
      languages: {
        es: `${SITE_URL}/es/menu`,
        en: `${SITE_URL}/en/menu`,
        ar: `${SITE_URL}/ar/menu`,
        de: `${SITE_URL}/de/menu`,
        "x-default": `${SITE_URL}/es/menu`,
      },
    },
  };
}

export default async function MenuPage() {
  const locale = await getLocale();
  const siteImages = await getSiteImages();

  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      items: {
        where: publicMenuItemWhere,
        orderBy: { displayOrder: "asc" },
        include: {
          variants: true,
          modifierGroups: { include: { modifiers: true } },
        },
      },
    },
  }).catch(() => []);

  const combos = await prisma.comboDeal.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: { items: { include: { item: true } } },
  }).catch(() => []);

  return (
    <>
      <Navbar logoUrl={siteImages.logo} />
      <PageReveal><main className="pt-20 min-h-screen bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-12 h-px bg-[var(--terracotta)]/40" />
              <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
                {tx(locale, "Nuestra propuesta", "Our offering", "ما نقدّمه", "Unser Angebot")}
              </span>
              <span className="w-12 h-px bg-[var(--terracotta)]/40" />
            </div>
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-[var(--espresso)]">
              {tx(locale, "Nuestra Carta", "Our Menu", "قائمتنا", "Unsere Speisekarte")}
            </h1>
            <p className="font-body text-[var(--olive)] mt-3 max-w-lg mx-auto">
              {tx(
                locale,
                "Cocina libanesa auténtica, elaborada con ingredientes frescos cada día",
                "Authentic Lebanese cuisine, crafted with fresh ingredients every day",
                "مطبخ لبناني أصيل، يُحضَّر بمكونات طازجة كل يوم",
                "Authentische libanesische Küche, täglich mit frischen Zutaten zubereitet"
              )}
            </p>
          </div>

          <MenuPageClient categories={serializeDecimal(categories)} combos={serializeDecimal(combos)} locale={locale} />
        </div>
      </main></PageReveal>
      <Footer logoUrl={siteImages.logo} />
    </>
  );
}
