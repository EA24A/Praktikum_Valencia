"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPriceWithTax } from "@/lib/menuPricing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { tx } from "@/lib/tx";
import { pickName, pickDescription } from "@/lib/pickLocalized";
import type { MenuItem, MenuCategory } from "@prisma/client";

function PlateIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"
      className="text-[var(--gold)]/25" stroke="currentColor">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      <path d="M5.6 5.6l.7.7" /><path d="M18.4 5.6l-.7.7" />
    </svg>
  );
}

type ItemWithCategory = MenuItem & { category: MenuCategory };
type Props = { items: ItemWithCategory[]; locale: string };

export default function FeaturedDishes({ items, locale }: Props) {
  if (items.length === 0) return null;

  // Duplicate for seamless infinite loop
  const track = [...items, ...items, ...items];

  return (
    <section className="py-16 sm:py-24 bg-[#0E0B00] relative overflow-hidden"
      style={{ borderTop: "1px solid #1E1800" }}>

      {/* Radial glow accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 70%)", transform: "translate(-50%,-40%)" }} />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[350px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 70%)", transform: "translate(30%, 40%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <ScrollReveal variant="fadeUp" className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-12 h-px bg-[var(--terracotta)]/40" />
            <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
              {tx(locale, "Lo más pedido", "Most ordered", "الأكثر طلباً", "Am beliebtesten")}
            </span>
            <span className="w-12 h-px bg-[var(--terracotta)]/40" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[var(--espresso)]">
            {tx(locale, "Nuestros favoritos", "Our favourites", "أطباقنا المفضلة", "Unsere Favoriten")}
          </h2>
          <p className="font-body text-[var(--olive)] mt-3 max-w-md mx-auto">
            {tx(
              locale,
              "Una selección de los platos que más enamoran a nuestros clientes",
              "A selection of the dishes our guests love most",
              "مجموعة من الأطباق التي يعشقها زبائننا",
              "Eine Auswahl der Gerichte, die unsere Gäste am meisten lieben"
            )}
          </p>
        </ScrollReveal>
      </div>

      {/* Marquee — full-width, outside padded container */}
      <ScrollReveal variant="fadeIn" duration={0.8}>
        <div className="marquee-outer py-2">
          <div className="marquee-track gap-5" style={{ display: "flex", gap: "20px" }}>
            {track.map((item, i) => {
              const name = pickName(item, locale);
              const description = pickDescription(item, locale);
              return (
                <Link
                  key={`${item.id}-${i}`}
                  href={`/${locale}/pedir`}
                  className="group shrink-0 w-72 card-warm overflow-hidden hover:shadow-[0_8px_40px_rgba(201,168,76,0.13)] transition-shadow duration-500"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-gradient-to-br from-[#1A1500] to-[#0E0B00] overflow-hidden flex items-center justify-center p-2">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-700"
                        sizes="288px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlateIcon />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/70 text-[var(--sand)] text-xs font-body px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {pickName(item.category, locale)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-display text-lg text-[var(--espresso)] leading-tight">
                        {name}
                      </h3>
                      <span className="font-display text-base text-[var(--terracotta)] font-semibold whitespace-nowrap">
                        {formatPriceWithTax(item.basePrice, item.taxRate ?? 10)}
                      </span>
                    </div>
                    {description && (
                      <p className="font-body text-xs text-[var(--olive)] leading-relaxed line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal variant="fadeUp" delay={0.1} className="text-center mt-12 px-4">
        <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
          <Link href={`/${locale}/menu`} className="btn-outline">
            {tx(locale, "Ver carta completa", "View full menu", "عرض القائمة الكاملة", "Gesamte Speisekarte ansehen")}
          </Link>
        </motion.div>
      </ScrollReveal>
    </section>
  );
}
