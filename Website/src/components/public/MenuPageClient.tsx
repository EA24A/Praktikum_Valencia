"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus, ChevronDown, ChevronUp, Utensils, Gift } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatPriceWithTax, priceWithTax } from "@/lib/menuPricing";
import { tx } from "@/lib/tx";
import { pickName, pickDescription } from "@/lib/pickLocalized";
import type {
  MenuCategory, MenuItem, ItemVariant, ModifierGroup, Modifier, ComboDeal, ComboItem
} from "@prisma/client";

type FullItem = MenuItem & {
  variants: ItemVariant[];
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[];
};
type FullCategory = MenuCategory & { items: FullItem[] };
type FullCombo = ComboDeal & { items: (ComboItem & { item: MenuItem })[] };

type Props = {
  categories: FullCategory[];
  combos: FullCombo[];
  locale: string;
};

export default function MenuPageClient({ categories, combos, locale }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const allLabel = tx(locale, "Todo", "All", "الكل", "Alle");
  const combosLabel = tx(locale, "Combos", "Combos", "عروض", "Combos");
  type Tab = { id: string; nameEs: string; nameEn: string; nameAr?: string | null };
  const allCategories: Tab[] = [
    { id: "all", nameEs: allLabel, nameEn: allLabel, nameAr: allLabel },
    ...categories,
    ...(combos.length > 0
      ? [{ id: "combos", nameEs: combosLabel, nameEn: combosLabel, nameAr: combosLabel }]
      : []),
  ];

  const filteredCategories =
    activeCategory === "all"
      ? categories
      : activeCategory === "combos"
      ? []
      : categories.filter((c) => c.id === activeCategory);

  const showCombos = activeCategory === "all" || activeCategory === "combos";

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-10 scrollbar-hide">
        {allCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-5 py-2.5 rounded-full font-body text-sm transition-all ${
              activeCategory === cat.id
                ? "bg-[var(--terracotta)] text-white shadow-sm"
                : "bg-[var(--warm-white)] border border-[var(--border)] text-[var(--olive)] hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
            }`}
          >
            {pickName(cat, locale)}
          </button>
        ))}
      </div>

      {/* Categories & items */}
      {filteredCategories.map((category) => (
        <div key={category.id} className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-display text-3xl text-[var(--espresso)]">
              {pickName(category, locale)}
            </h2>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {category.items.map((item) => (
              <MenuItemCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        </div>
      ))}

      {/* Combos */}
      {showCombos && combos.length > 0 && (
        <div className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-display text-3xl text-[var(--espresso)]">
              {tx(locale, "Combos & Ofertas", "Combos & Deals", "عروض ووجبات مشتركة", "Combos & Angebote")}
            </h2>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {filteredCategories.length === 0 && !showCombos && (
        <div className="text-center py-20 text-[var(--olive)] font-body">
          {tx(locale, "No hay platos disponibles", "No dishes available", "لا توجد أطباق متاحة", "Keine Gerichte verfügbar")}
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, locale }: { item: FullItem; locale: string }) {
  const [expanded, setExpanded] = useState(false);

  const name = pickName(item, locale);
  const description = pickDescription(item, locale);

  return (
    <div className="card-warm overflow-hidden group hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-[#1A1500] to-[#0E0B00] overflow-hidden flex items-center justify-center p-2">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Utensils size={40} className="text-[var(--gold)]/25" />
                  </div>
        )}
        {item.variants.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-[var(--sand)] text-xs px-2 py-0.5 rounded-full backdrop-blur-sm font-body">
            {item.variants.length} {tx(locale, "opciones", "options", "خيارات", "Optionen")}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-lg text-[var(--espresso)] leading-tight">{name}</h3>
          <span className="font-display text-base text-[var(--terracotta)] font-semibold whitespace-nowrap">
            {formatPriceWithTax(item.basePrice, item.taxRate ?? 10)}
          </span>
        </div>

        {description && (
          <p className="font-body text-sm text-[var(--olive)] leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Variants */}
        {item.variants.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-body text-[var(--terracotta)] hover:text-[var(--terracotta-dark)]"
            >
              {tx(locale, "Ver opciones", "See options", "عرض الخيارات", "Optionen ansehen")}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {expanded && (
              <div className="mt-2 space-y-1">
                {item.variants.map((v) => (
                  <div key={v.id} className="flex justify-between text-xs font-body text-[var(--espresso-light)] bg-[var(--muted)] rounded px-2 py-1">
                    <span>{pickName(v, locale)}</span>
                    <span className="text-[var(--terracotta)]">
                      {Number(v.priceDelta) > 0
                        ? `+${formatPriceWithTax(v.priceDelta, item.taxRate ?? 10)}`
                        : formatPriceWithTax(Number(item.basePrice) + Number(v.priceDelta), item.taxRate ?? 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Allergens */}
        {item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.allergens.map((a) => (
              <span key={a} className="text-xs font-body bg-[#1C1800] text-[var(--olive)] px-2 py-0.5 rounded-full">
                {a}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/${locale}/pedir?item=${item.id}`}
          className="flex items-center justify-center gap-2 w-full bg-[var(--terracotta)]/10 hover:bg-[var(--terracotta)] text-[var(--terracotta)] hover:text-white border border-[var(--terracotta)]/30 hover:border-[var(--terracotta)] rounded-lg py-2 text-sm font-body transition-all"
        >
          <Plus size={14} />
          {tx(locale, "Añadir al pedido", "Add to order", "أضف إلى الطلب", "Zur Bestellung hinzufügen")}
        </Link>
      </div>
    </div>
  );
}

function ComboCard({ combo, locale }: { combo: FullCombo; locale: string }) {
  const name = pickName(combo, locale);
  const description = pickDescription(combo, locale);

  return (
    <div className="card-warm overflow-hidden border-2 border-[var(--terracotta)]/20 hover:border-[var(--terracotta)]/40 transition-colors">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[var(--espresso)] to-[var(--terracotta-dark)] flex items-center justify-center p-2">
        {combo.imageUrl ? (
          <Image src={combo.imageUrl} alt={name} fill className="object-contain opacity-70" />
        ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gift size={40} className="text-white/30" />
                  </div>
        )}
        <div className="absolute top-3 right-3 bg-[var(--terracotta)] text-white text-xs px-3 py-1 rounded-full font-body font-medium">
          COMBO
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-xl text-[var(--espresso)]">
            {name}
          </h3>
          <span className="font-display text-xl text-[var(--terracotta)] font-bold whitespace-nowrap">
            {formatPriceWithTax(combo.price, combo.taxRate ?? 10)}
          </span>
        </div>
        {description && (
          <p className="font-body text-sm text-[var(--olive)] mb-3">
            {description}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mb-4">
          {combo.items.map((ci) => (
            <span key={ci.id} className="text-xs font-body bg-[#1C1800] text-[var(--gold)] px-2 py-0.5 rounded-full">
              {ci.quantity}x {pickName(ci.item, locale)}
            </span>
          ))}
        </div>
        <Link
          href={`/${locale}/pedir?combo=${combo.id}`}
          className="flex items-center justify-center gap-2 w-full btn-primary text-sm py-2"
        >
          <ShoppingBag size={14} />
          {tx(locale, "Pedir combo", "Order combo", "اطلب العرض", "Combo bestellen")}
        </Link>
      </div>
    </div>
  );
}
