"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Flame, ShoppingBag } from "lucide-react";
import { formatPrice, getLastHourCutoff } from "@/lib/utils";
import { formatPriceWithTax } from "@/lib/menuPricing";
import { tx } from "@/lib/tx";
import { pickName } from "@/lib/pickLocalized";
import type { LastHourSale, LastHourSaleItem, MenuItem } from "@prisma/client";

type SaleWithItems = LastHourSale & {
  items: (LastHourSaleItem & { menuItem: MenuItem })[];
};

type Props = {
  sale: SaleWithItems;
  closingTime: string;
  locale: string;
};

function useCountdown(cutoff: Date) {
  const [remaining, setRemaining] = useState<number>(
    Math.max(0, cutoff.getTime() - Date.now())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, cutoff.getTime() - Date.now());
      setRemaining(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [cutoff]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { minutes, seconds, isExpired: remaining === 0 };
}

export default function LastHourBanner({ sale, closingTime, locale }: Props) {
  const cutoff = getLastHourCutoff(closingTime);
  const { minutes, seconds, isExpired } = useCountdown(cutoff);

  if (isExpired) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const cutoffLabel = cutoff.toLocaleTimeString(
    locale === "es" ? "es-ES" : locale === "ar" ? "ar-EG" : locale === "de" ? "de-DE" : "en-GB",
    { hour: "2-digit", minute: "2-digit" }
  );

  return (
    <section className="bg-gradient-to-r from-[var(--terracotta-dark)] via-[var(--terracotta)] to-[var(--terracotta-dark)] text-white py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />

      {/* Pulsing glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Flame size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                {tx(locale, "¡Última hora!", "Last Call!", "عرض اللحظة الأخيرة!", "Letzte Chance!")}
              </h2>
              <p className="font-body text-sm text-white/80">
                {tx(
                  locale,
                  `Ofertas especiales solo hasta las ${cutoffLabel}`,
                  `Special deals only until ${cutoffLabel}`,
                  `عروض خاصة حتى ${cutoffLabel} فقط`,
                  `Sonderangebote nur bis ${cutoffLabel}`
                )}
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-5 py-3">
            <Clock size={16} className="opacity-80" />
            <span className="font-body text-sm opacity-80 mr-2">
              {tx(locale, "Se acaba en", "Ends in", "ينتهي في", "Endet in")}
            </span>
            <span className="font-display text-2xl font-bold tabular-nums">
              {pad(minutes)}:{pad(seconds)}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sale.items.map((item) => (
            <Link
              key={item.id}
              href={`/${locale}/pedir?lastHour=${item.menuItemId}`}
              className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-base leading-tight">
                  {pickName(item.menuItem, locale)}
                </h3>
                {item.stockRemaining <= 3 && (
                  <span className="shrink-0 text-xs bg-white/20 rounded-full px-2 py-0.5 font-body">
                    {item.stockRemaining} {tx(locale, "restantes", "left", "متبقي", "übrig")}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="font-display text-xl font-bold">
                    {formatPrice(item.salePrice)}
                  </span>
                  <span className="ml-2 text-xs text-white/60 line-through">
                    {formatPriceWithTax(item.menuItem.basePrice, item.menuItem.taxRate ?? 10)}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                  <ShoppingBag size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
