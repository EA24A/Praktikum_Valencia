import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import { getSiteImages } from "@/lib/siteImages";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const DEFAULT_META: Record<string, { title: string; description: string; keywords: string }> = {
  es: {
    title: "Casa Fenicia – Restaurante Libanés en Valencia | Bistró Libanés Ciutat Vella",
    description:
      "Casa Fenicia, el mejor restaurante libanés en Valencia. Cocina libanesa auténtica en Ciutat Vella: hummus, shawarma, falafel, kibbeh, baklava, knafeh y más. Comida libanesa Valencia, bistro libanés cerca de mí, comida halal mediterránea, restaurante árabe Valencia. Reservas online y pedidos para recoger.",
    keywords:
      "restaurante libanés Valencia, comida libanesa Valencia, bistro libanés, Casa Fenicia, hummus Valencia, shawarma Valencia, falafel Valencia, kibbeh, baklava, knafeh, comida árabe Valencia, restaurante mediterráneo Valencia, comida libanesa cerca de mí, restaurante halal Valencia, mejor restaurante libanés Valencia, Ciutat Vella, Corretgeria, restaurante Valencia centro, comida para llevar libanesa Valencia, libanés Valencia, restaurante libanés barato, comida libanesa para domicilio Valencia, Casa Fenicia Valencia, Lebanese restaurant Valencia, Lebanese food, libanon bistro valencia, libanon food valencia, مطعم لبناني فالنسيا",
  },
  en: {
    title: "Casa Fenicia – Lebanese Restaurant in Valencia | Best Lebanese Bistro Ciutat Vella",
    description:
      "Casa Fenicia, the best Lebanese restaurant in Valencia, Spain. Authentic Lebanese food in Ciutat Vella: hummus, shawarma, falafel, kibbeh, baklava, knafeh & more. Lebanese bistro near me, Mediterranean halal food, Arab restaurant Valencia. Online reservations and pickup orders available.",
    keywords:
      "Lebanese restaurant Valencia, Lebanese food Valencia, Lebanese bistro, Casa Fenicia, hummus Valencia, shawarma Valencia, falafel Valencia, kibbeh, baklava, knafeh, Arab food Valencia, Mediterranean restaurant Valencia, Lebanese food near me, halal restaurant Valencia, best Lebanese restaurant Valencia, Ciutat Vella, Corretgeria, Valencia city centre restaurant, Lebanese takeaway Valencia, Lebanon bistro Valencia, Lebanon food Valencia, Lebanese delivery Valencia, Lebanese cuisine Spain, Middle Eastern restaurant Valencia, مطعم لبناني فالنسيا",
  },
  ar: {
    title: "كازا فينيسيا – أفضل مطعم لبناني في فالنسيا | بيسترو لبناني سيوتات بيلا",
    description:
      "كازا فينيسيا، أفضل مطعم لبناني في فالنسيا، إسبانيا. مطبخ لبناني أصيل في سيوتات بيلا: حمص، شاورما، فلافل، كبة، بقلاوة، كنافة والمزيد. بيسترو لبناني قريب مني، طعام متوسطي حلال، مطعم عربي في فالنسيا. حجز إلكتروني وطلبات للاستلام.",
    keywords:
      "مطعم لبناني فالنسيا, طعام لبناني فالنسيا, بيسترو لبناني, كازا فينيسيا, حمص فالنسيا, شاورما فالنسيا, فلافل فالنسيا, كبة, بقلاوة, كنافة, مطعم عربي فالنسيا, مطعم متوسطي فالنسيا, مطعم حلال فالنسيا, أفضل مطعم لبناني فالنسيا, سيوتات بيلا, مطعم وسط فالنسيا, طعام لبناني توصيل فالنسيا, Lebanese restaurant Valencia, Lebanese food Valencia, restaurante libanés Valencia",
  },
  de: {
    title: "Casa Fenicia – Libanesisches Restaurant in Valencia | Bestes libanesisches Bistro Ciutat Vella",
    description:
      "Casa Fenicia, das beste libanesische Restaurant in Valencia, Spanien. Authentische libanesische Küche in Ciutat Vella: Hummus, Shawarma, Falafel, Kibbeh, Baklava, Knafeh und mehr. Libanesisches Bistro in der Nähe, mediterranes Halal-Essen, arabisches Restaurant Valencia. Online-Reservierungen und Abholbestellungen.",
    keywords:
      "libanesisches Restaurant Valencia, libanesisches Essen Valencia, libanesisches Bistro, Casa Fenicia, Hummus Valencia, Shawarma Valencia, Falafel Valencia, Kibbeh, Baklava, Knafeh, arabisches Essen Valencia, mediterranes Restaurant Valencia, libanesisches Essen in der Nähe, Halal Restaurant Valencia, bestes libanesisches Restaurant Valencia, Ciutat Vella, Corretgeria, Restaurant Valencia Zentrum, libanesisches Takeaway Valencia, libanesische Lieferung Valencia, Lebanese restaurant Valencia",
  },
};

const LOCALE_OG: Record<string, string> = {
  es: "es_ES",
  en: "en_GB",
  ar: "ar_AR",
  de: "de_DE",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pageKey = "home";

  const [seo, siteImages] = await Promise.all([
    prisma.seoSetting
      .findUnique({ where: { pageKey_locale: { pageKey, locale } } })
      .catch(() => null),
    getSiteImages().catch(() => null),
  ]);

  const defaults = DEFAULT_META[locale] ?? DEFAULT_META.es;
  const fallbackOg = siteImages?.og_default ?? "/og-default.jpg";

  const title = seo?.title ?? defaults.title;
  const description = seo?.description ?? defaults.description;
  const keywords = seo?.keywords ?? defaults.keywords;

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
      type: "website",
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: "Casa Fenicia",
      locale: LOCALE_OG[locale] ?? "es_ES",
      alternateLocale: ["es_ES", "en_GB", "ar_AR", "de_DE"].filter((l) => l !== LOCALE_OG[locale]),
      images: seo?.ogImageUrl
        ? [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: "Casa Fenicia Valencia" }]
        : [
            {
              url: fallbackOg,
              width: 1200,
              height: 630,
              alt: "Casa Fenicia – Lebanese Bistro & Café Valencia – Restaurante Libanés Valencia",
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      "geo.region": "ES-V",
      "geo.placename": "Valencia, Comunitat Valenciana, Spain",
      "geo.position": "39.4751;-0.3766",
      ICBM: "39.4751, -0.3766",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = locale === "ar";

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} dir={isRtl ? "rtl" : "ltr"}>
        {children}
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--warm-white)",
            border: "1px solid var(--border)",
            color: "var(--espresso)",
            fontFamily: "Lora, serif",
          },
        }}
      />
    </NextIntlClientProvider>
  );
}
