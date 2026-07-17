import { prisma } from "@/lib/prisma";
import { getTranslations, getLocale } from "next-intl/server";
import { serializeDecimal } from "@/lib/serializeMenu";
import MenuQRDisplay from "@/components/public/MenuQRDisplay";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { publicMenuItemWhere } from "@/lib/menuPublicFilter";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menuqr" });

  const titles: Record<string, string> = {
    es: "Carta · Casa Fenicia Valencia",
    en: "Menu · Casa Fenicia Valencia",
    ar: "قائمة الطعام · Casa Fenicia Valencia",
    de: "Speisekarte · Casa Fenicia Valencia",
  };

  return {
    title: titles[locale] ?? titles.es,
    description: t("subtitle"),
    robots: { index: false },
    alternates: {
      canonical: `${SITE_URL}/${locale}/menuqr`,
      languages: {
        es: `${SITE_URL}/es/menuqr`,
        en: `${SITE_URL}/en/menuqr`,
        ar: `${SITE_URL}/ar/menuqr`,
        de: `${SITE_URL}/de/menuqr`,
      },
    },
  };
}

export default async function MenuQRPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menuqr" });

  // ── Identical query to the main menu page ─────────────────────────
  const [categories, combos] = await Promise.all([
    prisma.menuCategory.findMany({
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
    }).catch(() => []),

    prisma.comboDeal.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: { items: { include: { item: true } } },
    }).catch(() => []),
  ]);

  const i18n = {
    title: t("title"),
    subtitle: t("subtitle"),
    address: t("address"),
    phone: t("phone"),
    hours: t("hours"),
    printBtn: t("print_btn"),
    from: t("from"),
    priceNote: t("price_note"),
  };

  return (
    <MenuQRDisplay
      // serializeDecimal converts Prisma Decimal → plain number, same as the
      // main menu page does before passing data across the server→client boundary
      categories={serializeDecimal(categories)}
      combos={serializeDecimal(combos)}
      locale={locale}
      i18n={i18n}
    />
  );
}
