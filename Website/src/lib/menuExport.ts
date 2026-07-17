import * as XLSX from "xlsx";
import { SITE_URL } from "./siteUrl";
import type {
  ComboDeal,
  ComboItem,
  ItemVariant,
  MenuCategory,
  MenuItem,
  Modifier,
  ModifierGroup,
} from "@prisma/client";

type FullItem = MenuItem & {
  variants: ItemVariant[];
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[];
};

type FullCategory = MenuCategory & { items: FullItem[] };

type FullCombo = ComboDeal & {
  items: (ComboItem & { item: MenuItem })[];
};

function money(value: { toString(): string } | number) {
  return Number(value).toFixed(2);
}

function absoluteImageUrl(url: string | null | undefined) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatVariants(item: FullItem) {
  if (item.variants.length === 0) return "";
  return item.variants
    .map((variant) => {
      const delta = Number(variant.priceDelta);
      const suffix = delta === 0 ? "" : ` (+${delta.toFixed(2)})`;
      return `${variant.nameEs}${suffix}`;
    })
    .join(" | ");
}

function formatModifiers(item: FullItem) {
  if (item.modifierGroups.length === 0) return "";
  return item.modifierGroups
    .map((group) => {
      const options = group.modifiers
        .map((modifier) => {
          const delta = Number(modifier.priceDelta);
          const suffix = delta === 0 ? "" : ` (+${delta.toFixed(2)})`;
          return `${modifier.nameEs}${suffix}`;
        })
        .join(", ");
      return `${group.nameEs}: ${options}`;
    })
    .join(" | ");
}

function formatComboItems(combo: FullCombo) {
  return combo.items
    .map((entry) => `${entry.quantity}x ${entry.item.nameEs}`)
    .join(" | ");
}

export function buildMenuWorkbook(categories: FullCategory[], combos: FullCombo[]) {
  const productRows = categories.flatMap((category) =>
    category.items.map((item) => ({
      type: "product",
      id: item.id,
      sku: item.id,
      category_id: category.id,
      category_slug: category.slug,
      category_es: category.nameEs,
      category_en: category.nameEn,
      category_ar: category.nameAr ?? "",
      name_es: item.nameEs,
      name_en: item.nameEn,
      name_ar: item.nameAr ?? "",
      description_es: item.descriptionEs ?? "",
      description_en: item.descriptionEn ?? "",
      description_ar: item.descriptionAr ?? "",
      price: money(item.basePrice),
      tax_rate: money(item.taxRate ?? 10),
      price_after_tax: money(item.basePrice),
      currency: "EUR",
      image_url: absoluteImageUrl(item.imageUrl),
      available: item.isAvailable ? "yes" : "no",
      pos_only: item.posOnly ? "yes" : "no",
      featured: item.isFeatured ? "yes" : "no",
      display_order: item.displayOrder,
      allergens: item.allergens.join(", "),
      variants: formatVariants(item),
      modifiers: formatModifiers(item),
    }))
  );

  const comboRows = combos.map((combo) => ({
    type: "combo",
    id: combo.id,
    sku: combo.id,
    category_id: "",
    category_slug: "combos",
    category_es: "Combos",
    category_en: "Combos",
    category_ar: "",
    name_es: combo.nameEs,
    name_en: combo.nameEn,
    name_ar: combo.nameAr ?? "",
    description_es: combo.descriptionEs ?? "",
    description_en: combo.descriptionEn ?? "",
    description_ar: combo.descriptionAr ?? "",
    price: money(combo.price),
    tax_rate: money(combo.taxRate ?? 10),
    price_after_tax: money(combo.price),
    currency: "EUR",
    image_url: absoluteImageUrl(combo.imageUrl),
    available: combo.isActive ? "yes" : "no",
    pos_only: "no",
    featured: "no",
    display_order: combo.displayOrder,
    allergens: "",
    variants: "",
    modifiers: formatComboItems(combo),
  }));

  const categoryRows = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name_es: category.nameEs,
    name_en: category.nameEn,
    name_ar: category.nameAr ?? "",
    display_order: category.displayOrder,
    active: category.isActive ? "yes" : "no",
  }));

  const variantRows = categories.flatMap((category) =>
    category.items.flatMap((item) =>
      item.variants.map((variant) => ({
        product_id: item.id,
        product_name_es: item.nameEs,
        category_es: category.nameEs,
        variant_id: variant.id,
        name_es: variant.nameEs,
        name_en: variant.nameEn,
        name_ar: variant.nameAr ?? "",
        price_delta: money(variant.priceDelta),
        is_default: variant.isDefault ? "yes" : "no",
      }))
    )
  );

  const modifierRows = categories.flatMap((category) =>
    category.items.flatMap((item) =>
      item.modifierGroups.flatMap((group) =>
        group.modifiers.map((modifier) => ({
          product_id: item.id,
          product_name_es: item.nameEs,
          category_es: category.nameEs,
          group_id: group.id,
          group_name_es: group.nameEs,
          group_name_en: group.nameEn,
          group_required: group.required ? "yes" : "no",
          group_max_selections: group.maxSelections,
          modifier_id: modifier.id,
          name_es: modifier.nameEs,
          name_en: modifier.nameEn,
          name_ar: modifier.nameAr ?? "",
          price_delta: money(modifier.priceDelta),
        }))
      )
    )
  );

  const catalogRows = [...productRows, ...comboRows].map((row) => ({
    sku: row.sku,
    product_type: row.type,
    name: row.name_es,
    name_en: row.name_en,
    name_ar: row.name_ar,
    description: row.description_es,
    description_en: row.description_en,
    description_ar: row.description_ar,
    category: row.category_es,
    price: row.price,
    tax_rate: row.tax_rate,
    price_after_tax: row.price_after_tax,
    currency: row.currency,
    image_url: row.image_url,
    available: row.available === "yes" ? "TRUE" : "FALSE",
    pos_only: row.pos_only === "yes" ? "TRUE" : "FALSE",
    featured: row.featured === "yes" ? "TRUE" : "FALSE",
    allergens: row.allergens,
    variants: row.variants,
    extras: row.modifiers,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(catalogRows), "Catalog");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([...productRows, ...comboRows]),
    "Products"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoryRows), "Categories");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(variantRows), "Variants");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(modifierRows), "Modifiers");

  return workbook;
}

export function buildMenuExportBuffer(categories: FullCategory[], combos: FullCombo[]) {
  const workbook = buildMenuWorkbook(categories, combos);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildMenuExportFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  return `casafenicia-products-${stamp}.xlsx`;
}
