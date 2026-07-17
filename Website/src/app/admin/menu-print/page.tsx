import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pickName, pickDescription } from "@/lib/pickLocalized";
import { tx } from "@/lib/tx";
import MenuPrintPreview from "@/components/admin/MenuPrintPreview";
import { publicMenuItemWhere } from "@/lib/menuPublicFilter";

type Props = { searchParams: Promise<{ locale?: string }> };

const LOCALES = ["es", "en", "ar", "de"] as const;
type Locale = (typeof LOCALES)[number];

export default async function AdminMenuPrintPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role === "STAFF") redirect("/admin");

  const { locale: rawLocale } = await searchParams;
  const locale: Locale = LOCALES.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "es";

  // Same query as the main menu page and QR page — single source of truth
  const [rawCategories, combos] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        items: {
          where: publicMenuItemWhere,
          orderBy: { displayOrder: "asc" },
          include: { variants: true },
        },
      },
    }),
    prisma.comboDeal.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: { items: { include: { item: true } } },
    }),
  ]);

  const categories = rawCategories.map((cat) => ({
    id: cat.id,
    name: pickName(cat, locale),
    items: cat.items.map((item) => ({
      id: item.id,
      name: pickName(item, locale),
      description: pickDescription(item, locale),
      basePrice: Number(item.basePrice),
      hasVariants: item.variants.length > 1,
      variants: item.variants.map((v) => ({
        id: v.id,
        name: pickName(v, locale),
        priceDelta: Number(v.priceDelta),
      })),
    })),
  }));

  const combosSection =
    combos.length > 0
      ? {
          id: "combos",
          name: tx(locale, "Combos & Ofertas", "Combos & Deals", "عروض ووجبات مشتركة", "Combos & Angebote"),
          items: combos.map((c) => ({
            id: c.id,
            name: pickName(c, locale),
            description: pickDescription(c, locale),
            basePrice: Number(c.price),
            hasVariants: false,
            variants: [],
          })),
        }
      : null;

  const allSections = combosSection
    ? [...categories, combosSection]
    : categories;

  const INFO = {
    es: {
      subtitle: "Cocina libanesa auténtica en el corazón de Valencia",
      address: "C/ de la Corretgeria, 4 · Ciutat Vella · Valencia",
      phone: "+34 600 345 055",
      hours: "Lun–Dom 9:00–22:00",
      priceNote: "Precios incluyen IVA",
      menuTitle: "CARTA",
    },
    en: {
      subtitle: "Authentic Lebanese cuisine in the heart of Valencia",
      address: "C/ de la Corretgeria, 4 · Ciutat Vella · Valencia",
      phone: "+34 600 345 055",
      hours: "Mon–Sun 9:00–22:00",
      priceNote: "Prices include VAT",
      menuTitle: "MENU",
    },
    ar: {
      subtitle: "مطبخ لبناني أصيل في قلب فالنسيا",
      address: "C/ de la Corretgeria, 4 · Ciutat Vella · Valencia",
      phone: "+34 600 345 055",
      hours: "الإثنين–الأحد 9:00–22:00",
      priceNote: "الأسعار تشمل الضريبة",
      menuTitle: "قائمة الطعام",
    },
    de: {
      subtitle: "Authentische libanesische Küche im Herzen von Valencia",
      address: "C/ de la Corretgeria, 4 · Ciutat Vella · Valencia",
      phone: "+34 600 345 055",
      hours: "Mo–So 9:00–22:00",
      priceNote: "Preise inkl. MwSt.",
      menuTitle: "SPEISEKARTE",
    },
  } satisfies Record<Locale, object>;

  return (
    <MenuPrintPreview
      categories={allSections}
      locale={locale}
      info={INFO[locale]}
    />
  );
}
