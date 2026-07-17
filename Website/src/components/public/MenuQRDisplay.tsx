"use client";

import { useRouter } from "next/navigation";
import { Phone, MapPin, Clock } from "lucide-react";
import { pickName, pickDescription } from "@/lib/pickLocalized";
import { formatPriceWithTax, priceWithTax } from "@/lib/menuPricing";
import { formatPrice } from "@/lib/utils";
import { tx } from "@/lib/tx";
import { routing } from "@/i18n/routing";
import type {
  MenuCategory, MenuItem, ItemVariant, ModifierGroup, Modifier,
  ComboDeal, ComboItem,
} from "@prisma/client";

// ── Full types — identical to what the main menu page uses ──────────────────
type FullItem = MenuItem & {
  variants: ItemVariant[];
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[];
};
type FullCategory = MenuCategory & { items: FullItem[] };
type FullCombo = ComboDeal & { items: (ComboItem & { item: MenuItem })[] };

type I18n = {
  title: string;
  subtitle: string;
  address: string;
  phone: string;
  hours: string;
  printBtn: string;
  from: string;
  priceNote: string;
};

type Props = {
  categories: FullCategory[];
  combos: FullCombo[];
  locale: string;
  i18n: I18n;
};

const LOCALE_LABELS: Record<string, string> = { es: "ES", en: "EN", ar: "AR", de: "DE" };
const LOCALE_NAMES: Record<string, string> = {
  es: "Español",
  en: "English",
  ar: "العربية",
  de: "Deutsch",
};
const CAT_ORNAMENTS = ["✦", "◈", "✧", "◆", "❋", "◉", "✦", "◈"];

export default function MenuQRDisplay({ categories, combos, locale, i18n }: Props) {
  const router = useRouter();
  const isRtl = locale === "ar";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--cream)", color: "var(--espresso)" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Sticky top bar — language switcher */}
      <div
        className="sticky top-0 z-10 flex items-center justify-center gap-2 px-4 py-3"
        style={{
          background: "rgba(8,8,8,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        {routing.locales.map((loc) => (
          <button
            key={loc}
            onClick={() => router.push(`/${loc}/menuqr`)}
            title={LOCALE_NAMES[loc]}
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "4px 14px",
              borderRadius: "4px",
              border: loc === locale
                ? "1.5px solid var(--gold)"
                : "1.5px solid transparent",
              background: loc === locale
                ? "rgba(201,168,76,0.15)"
                : "transparent",
              color: loc === locale ? "var(--gold)" : "var(--olive)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {LOCALE_LABELS[loc]}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6 lg:max-w-4xl">
        {/* ── Header ── */}
        <header className="mb-10 text-center">
          <OrnamentLine />

          <h1 style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            color: "var(--espresso)",
          }}>
            Casa Fenicia
          </h1>
          <p style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
            color: "var(--olive)",
            marginTop: "0.4rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            {i18n.subtitle}
          </p>

          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            style={{ fontFamily: "Lora, serif", fontSize: "0.78rem", color: "var(--olive-light)" }}
          >
            <span className="flex items-center gap-1.5">
              <MapPin size={11} style={{ color: "var(--gold)", flexShrink: 0 }} />
              {i18n.address}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={11} style={{ color: "var(--gold)", flexShrink: 0 }} />
              {i18n.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: "var(--gold)", flexShrink: 0 }} />
              {i18n.hours}
            </span>
          </div>

          <OrnamentLine className="mt-5" />
        </header>

        {/* ── Regular categories ── */}
        <div className="space-y-10">
          {categories.map((cat, catIdx) => (
            <section key={cat.id}>
              <CategoryHeading
                name={pickName(cat, locale)}
                ornament={CAT_ORNAMENTS[catIdx % CAT_ORNAMENTS.length]}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {cat.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    name={pickName(item, locale)}
                    description={pickDescription(item, locale)}
                    basePrice={Number(item.basePrice)}
                    taxRate={Number(item.taxRate ?? 10)}
                    variants={item.variants}
                    locale={locale}
                    fromLabel={i18n.from}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* ── Combos — same source as main menu ── */}
          {combos.length > 0 && (
            <section>
              <CategoryHeading
                name={tx(locale, "Combos & Ofertas", "Combos & Deals", "عروض ووجبات مشتركة", "Combos & Angebote")}
                ornament="◉"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {combos.map((combo) => (
                  <ItemRow
                    key={combo.id}
                    name={pickName(combo, locale)}
                    description={pickDescription(combo, locale)}
                    basePrice={Number(combo.price)}
                    taxRate={Number(combo.taxRate ?? 10)}
                    variants={[]}
                    locale={locale}
                    fromLabel={i18n.from}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <p className="mt-10 text-center" style={{
          fontFamily: "Lora, Georgia, serif",
          fontSize: "0.7rem",
          color: "var(--olive)",
          letterSpacing: "0.06em",
          opacity: 0.7,
        }}>
          {i18n.priceNote}
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function OrnamentLine({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div style={{ height: "1px", flex: 1, background: "linear-gradient(to right, transparent, rgba(201,168,76,0.4))" }} />
      <span style={{ color: "var(--gold)", fontSize: "1rem", opacity: 0.7 }}>◆</span>
      <div style={{ height: "1px", flex: 1, background: "linear-gradient(to left, transparent, rgba(201,168,76,0.4))" }} />
    </div>
  );
}

function CategoryHeading({ name, ornament }: { name: string; ornament: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span style={{ color: "var(--gold)", fontSize: "0.75rem" }}>{ornament}</span>
      <h2 style={{
        fontFamily: "Cormorant Garamond, Georgia, serif",
        fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--gold)",
      }}>
        {name}
      </h2>
      <div style={{ flex: 1, height: "1px", background: "rgba(201,168,76,0.2)" }} />
    </div>
  );
}

function ItemRow({
  name, description, basePrice, taxRate, variants, locale, fromLabel,
}: {
  name: string;
  description: string | null;
  basePrice: number;
  taxRate: number;
  variants: ItemVariant[];
  locale: string;
  fromLabel: string;
}) {
  const defaultVariant = variants.find((v) => v.isDefault);
  const hasMultiple = variants.length > 1;

  const displayPreTax = defaultVariant
    ? basePrice + Number(defaultVariant.priceDelta)
    : basePrice;
  const displayPrice = priceWithTax(displayPreTax, taxRate);

  return (
    <div
      className="flex items-start justify-between gap-3 py-2.5"
      style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}
    >
      <div className="min-w-0 flex-1">
        <div style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--espresso)",
          lineHeight: 1.3,
        }}>
          {name}
        </div>
        {description && (
          <div style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: "0.75rem",
            color: "var(--olive)",
            marginTop: "0.15rem",
            lineHeight: 1.4,
          }}>
            {description}
          </div>
        )}
        {/* Show non-default variants inline */}
        {variants.length > 0 && hasMultiple && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {variants.map((v) => (
              <span
                key={v.id}
                style={{
                  fontFamily: "Lora, serif",
                  fontSize: "0.7rem",
                  color: "var(--olive-light)",
                }}
              >
                {pickName(v, locale)}{" "}
                <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>
                  {formatPriceWithTax(basePrice + Number(v.priceDelta), taxRate)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{
        fontFamily: "Cormorant Garamond, Georgia, serif",
        fontSize: "1rem",
        fontWeight: 700,
        color: "var(--gold)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}>
        {hasMultiple && !defaultVariant && (
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 400,
            fontFamily: "Lora, serif",
            color: "var(--olive)",
            marginInlineEnd: "3px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {fromLabel}{" "}
          </span>
        )}
        {formatPrice(displayPrice)}
      </div>
    </div>
  );
}
