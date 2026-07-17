import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import HeroSection from "@/components/public/HeroSection";
import FeaturedDishes from "@/components/public/FeaturedDishes";
import StorySection from "@/components/public/StorySection";
import LastHourBanner from "@/components/public/LastHourBanner";
import ReserveSection from "@/components/public/ReserveSection";
import { serializeDecimal } from "@/lib/serializeMenu";
import StructuredData from "@/components/seo/StructuredData";
import SeoContent from "@/components/seo/SeoContent";
import FaqSection from "@/components/seo/FaqSection";
import { SITE_URL } from "@/lib/siteUrl";
import { tx } from "@/lib/tx";
import { getSiteImages } from "@/lib/siteImages";
import { publicMenuItemWhere } from "@/lib/menuPublicFilter";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const seo = await prisma.seoSetting
    .findUnique({ where: { pageKey_locale: { pageKey: "home", locale } } })
    .catch(() => null);

  const title =
    seo?.title ??
    tx(
      locale,
      "Casa Fenicia – Bistró & Café Libanés en Valencia",
      "Casa Fenicia – Lebanese Bistro & Café in Valencia",
      "كازا فينيسيا – بيسترو ومقهى لبناني في فالنسيا",
      "Casa Fenicia – Libanesisches Bistró & Café in Valencia"
    );
  const description =
    seo?.description ??
    tx(
      locale,
      "Auténtica cocina libanesa en el corazón de Ciutat Vella, Valencia. Reservas online, pedidos para recoger y carta variada.",
      "Authentic Lebanese cuisine in the heart of Ciutat Vella, Valencia. Online reservations, pickup orders and full menu.",
      "مطبخ لبناني أصيل في قلب سيوتات بيلا، فالنسيا. حجوزات إلكترونية، طلبات للاستلام، وقائمة متنوعة.",
      "Authentische libanesische Küche im Herzen von Ciutat Vella, Valencia. Online-Reservierungen, Abholbestellungen und vielfältige Speisekarte."
    );
  const keywords =
    seo?.keywords ??
    tx(
      locale,
      "restaurante libanés Valencia, bistró libanés, Casa Fenicia, comida libanesa Valencia, reservar mesa Valencia",
      "Lebanese restaurant Valencia, Lebanese bistro, Casa Fenicia, Lebanese food Valencia, book table Valencia",
      "مطعم لبناني فالنسيا, بيسترو لبناني, كازا فينيسيا, طعام لبناني فالنسيا, حجز طاولة فالنسيا",
      "libanesisches Restaurant Valencia, libanesisches Bistró, Casa Fenicia, libanesisches Essen Valencia, Tisch reservieren Valencia"
    );
  const ogLocale =
    locale === "es" ? "es_ES" : locale === "ar" ? "ar_AR" : locale === "de" ? "de_DE" : "en_GB";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        es: `${SITE_URL}/es`,
        en: `${SITE_URL}/en`,
        ar: `${SITE_URL}/ar`,
        de: `${SITE_URL}/de`,
        "x-default": `${SITE_URL}/es`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: "Casa Fenicia",
      locale: ogLocale,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : [],
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();

  const [featuredItems, lastHourSale, siteSettings, siteImages] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isFeatured: true, ...publicMenuItemWhere },
      include: { category: true },
      orderBy: { displayOrder: "asc" },
      take: 6,
    }).catch(() => []),
    prisma.lastHourSale.findFirst({
      where: {
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        isActive: true,
      },
      include: {
        items: {
          include: { menuItem: true },
          where: { stockRemaining: { gt: 0 } },
        },
      },
    }).catch(() => null),
    prisma.siteSetting.findMany({
      where: { key: { in: ["closing_time", "glovo_url", "instagram_url", "tiktok_url"] } },
    }).catch(() => []),
    getSiteImages(),
  ]);

  const closingTime = siteSettings.find((s) => s.key === "closing_time")?.value ?? "22:00";
  const glovoUrl = siteSettings.find((s) => s.key === "glovo_url")?.value
    ?? "https://glovo.go.link/open?link_type=store&store_id=570810&adjust_t=s321jkn";
  const instagramUrl = siteSettings.find((s) => s.key === "instagram_url")?.value;
  const tiktokUrl = siteSettings.find((s) => s.key === "tiktok_url")?.value;

  const serializedFeaturedItems = serializeDecimal(featuredItems);
  const serializedLastHourSale = serializeDecimal(lastHourSale);

  return (
    <>
      <StructuredData locale={locale} images={siteImages} />

      <Navbar logoUrl={siteImages.logo} />
      <main>
        <HeroSection
          locale={locale}
          glovoUrl={glovoUrl}
          heroImageUrl={siteImages.hero}
        />
        {serializedLastHourSale && serializedLastHourSale.items.length > 0 && (
          <LastHourBanner
            sale={serializedLastHourSale}
            closingTime={closingTime}
            locale={locale}
          />
        )}
        <FeaturedDishes items={serializedFeaturedItems} locale={locale} />
        <StorySection locale={locale} storyImageUrl={siteImages.story} />
        <FaqSection locale={locale} />
        <ReserveSection locale={locale} />
        <SeoContent locale={locale} />
      </main>
      <Footer
        instagramUrl={instagramUrl}
        tiktokUrl={tiktokUrl}
        logoUrl={siteImages.logo}
      />
    </>
  );
}
