import { getLocale, getTranslations } from "next-intl/server";
import { listCategories } from "@/lib/actions/categories";
import { getSettings } from "@/lib/actions/settings";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { isAliDibLabel, isComboCategoryLabel, stripAliDib } from "@/lib/menu-cards/filter-menu-content";
import { MenuPrintPreview } from "@/components/admin/menu-cards/menu-print-preview";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function receiptHeaderForLocale(
  settings: Awaited<ReturnType<typeof getSettings>>,
  locale: string,
) {
  if (locale === "es") return settings.receiptHeaderEs.trim();
  if (locale === "de") {
    return settings.receiptHeaderEn.trim() || settings.receiptHeaderEs.trim();
  }
  return settings.receiptHeaderEn.trim() || settings.receiptHeaderEs.trim();
}

function localizedDiscountName(
  discount: { nameEs: string; nameEn: string },
  locale: string,
) {
  if (locale === "es") return discount.nameEs;
  return discount.nameEn || discount.nameEs;
}

function comboIncludesHotDrink(label: string) {
  return /caf[eé]|coffee|t[eé]\b|tea/i.test(label);
}

export default async function AdminMenuCardsPage() {
  const locale = await getLocale();
  const t = await getTranslations("menuCards");

  const [categories, settings, comboDiscounts] = await Promise.all([
    listCategories({ includeInactive: false, includeProducts: true }),
    getSettings(),
    prisma.discount.findMany({
      where: { isActive: true, type: "COMBO" },
      orderBy: { nameEs: "asc" },
      select: { id: true, nameEs: true, nameEn: true, value: true },
    }),
  ]);

  const printCategories = categories
    .map((category) => {
      const name = localizedCatalogName(category, locale);
      return {
        id: category.id,
        name,
        items: (category.products ?? [])
          .filter((product) => product.isActive && !product.posOnly)
          .map((product) => ({
            id: product.id,
            name: localizedCatalogName(product, locale),
            price: product.price,
          }))
          .filter((product) => !isAliDibLabel(product.name)),
      };
    })
    .filter(
      (category) =>
        category.items.length > 0 &&
        !isAliDibLabel(category.name) &&
        !isComboCategoryLabel(category.name),
    );

  const comboCategoryItems = categories
    .map((category) => ({
      name: localizedCatalogName(category, locale),
      items: (category.products ?? [])
        .filter((product) => product.isActive && !product.posOnly)
        .map((product) => ({
          id: product.id,
          name: localizedCatalogName(product, locale),
          price: product.price,
        }))
        .filter((product) => !isAliDibLabel(product.name)),
    }))
    .find((category) => isComboCategoryLabel(category.name))?.items;

  const subtitle = stripAliDib(receiptHeaderForLocale(settings, locale));
  const printCombosFromDiscounts = comboDiscounts
    .map((combo) => {
      const label = stripAliDib(localizedDiscountName(combo, locale));
      return {
        id: combo.id,
        label,
        price: Number(combo.value),
        note: comboIncludesHotDrink(label) ? t("comboDrinkNote") : undefined,
      };
    })
    .filter((combo) => combo.label.length > 0);

  const printCombosFromCategory =
    comboCategoryItems?.map((item) => ({
      id: item.id,
      label: item.name,
      price: item.price,
      note: comboIncludesHotDrink(item.name) ? t("comboDrinkNote") : undefined,
    })) ?? [];

  const printCombos =
    printCombosFromDiscounts.length > 0
      ? printCombosFromDiscounts
      : printCombosFromCategory;

  return (
    <div className="-m-4 md:-m-6">
      <MenuPrintPreview
        categories={printCategories}
        combos={printCombos}
        logoUrl="/logo.png"
        info={{
          businessName: stripAliDib(settings.businessName),
          subtitle: isAliDibLabel(subtitle) ? "" : subtitle,
          footerTagline: t("footerTagline"),
          priceNote: t("priceNote"),
        }}
      />
    </div>
  );
}
