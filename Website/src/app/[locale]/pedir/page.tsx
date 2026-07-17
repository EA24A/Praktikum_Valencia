import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import OrderPageClient from "@/components/public/OrderPageClient";
import { serializeDecimal } from "@/lib/serializeMenu";
import PageReveal from "@/components/ui/PageReveal";
import { tx } from "@/lib/tx";
import { getSiteImages } from "@/lib/siteImages";
import { publicMenuItemWhere } from "@/lib/menuPublicFilter";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: tx(
      locale,
      "Pedir – Casa Fenicia Valencia",
      "Order – Casa Fenicia Valencia",
      "اطلب – كازا فينيسيا فالنسيا",
      "Bestellen – Casa Fenicia Valencia"
    ),
    description: tx(
      locale,
      "Pide tu comida libanesa favorita para recoger o a domicilio. Carta completa con hummus, shawarma, falafel y más.",
      "Order your favourite Lebanese food for pickup or delivery. Full menu with hummus, shawarma, falafel and more.",
      "اطلب طعامك اللبناني المفضل للاستلام أو التوصيل. قائمة كاملة تشمل الحمص والشاورما والفلافل والمزيد.",
      "Bestellen Sie Ihr Lieblingsgericht aus der libanesischen Küche zur Abholung oder Lieferung. Vollständige Speisekarte mit Hummus, Shawarma, Falafel und mehr."
    ),
  };
}

export default async function OrderPage() {
  const locale = await getLocale();

  const [categories, lastHourSale, siteSettings, siteImages] = await Promise.all([
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
      where: { key: { in: ["closing_time", "glovo_url"] } },
    }).catch(() => []),
    getSiteImages(),
  ]);

  const closingTime = siteSettings.find((s) => s.key === "closing_time")?.value ?? "22:00";
  const glovoUrl = siteSettings.find((s) => s.key === "glovo_url")?.value
    ?? "https://glovo.go.link/open?link_type=store&store_id=570810&adjust_t=s321jkn";

  const serializedCategories = serializeDecimal(categories);
  const serializedLastHourSale = serializeDecimal(lastHourSale);

  return (
    <>
      <Navbar logoUrl={siteImages.logo} />
      <PageReveal><main className="pt-20 min-h-screen bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl sm:text-5xl text-[var(--espresso)] mb-2">
              {tx(locale, "Haz tu pedido", "Place your order", "اطلب الآن", "Jetzt bestellen")}
            </h1>
            <p className="font-body text-[var(--olive)]">
              {tx(
                locale,
                "Elige recogida en local (pago online) o pide por Glovo",
                "Choose pickup (online payment) or order via Glovo",
                "اختر الاستلام من المطعم (دفع إلكتروني) أو اطلب عبر Glovo",
                "Wählen Sie Abholung (Online-Zahlung) oder bestellen Sie über Glovo"
              )}
            </p>
          </div>
          <OrderPageClient
            categories={serializedCategories}
            lastHourSale={serializedLastHourSale}
            closingTime={closingTime}
            glovoUrl={glovoUrl}
            locale={locale}
          />
        </div>
      </main></PageReveal>
      <Footer logoUrl={siteImages.logo} />
    </>
  );
}
