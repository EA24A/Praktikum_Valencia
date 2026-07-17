"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, ShoppingBag, Star } from "lucide-react";
import { tx } from "@/lib/tx";

type Props = {
  locale: string;
  glovoUrl: string;
  heroImageUrl?: string;
};

export default function HeroSection({ locale, glovoUrl, heroImageUrl }: Props) {
  const heroSrc = heroImageUrl ?? "/images/hero-restaurant.jpg";
  const isAr = locale === "ar";
  const isDe = locale === "de";

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-warm bg-noise" />

      {/* Radial glow accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 65%)" }} />
        <div className="absolute -bottom-48 -left-24 w-[600px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, #A07830 0%, transparent 65%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 60%)" }} />
      </div>

      {/* Ornamental lines */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2 opacity-30">
        <div className="w-px h-24 bg-[var(--terracotta)]" />
        <div className="text-[var(--terracotta)] text-xs rotate-90 whitespace-nowrap tracking-widest font-body">
          {tx(locale, "DESDE LÍBANO", "FROM LEBANON", "من لبنان", "AUS DEM LIBANON")}
        </div>
        <div className="w-px h-24 bg-[var(--terracotta)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="inline-flex items-center gap-2 bg-[var(--terracotta)]/10 border border-[var(--terracotta)]/20 rounded-full px-4 py-1.5 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--terracotta)] animate-pulse" />
              <span className="text-xs font-body text-[var(--terracotta)] tracking-widest uppercase">
                {tx(
                  locale,
                  "Bistró & Café Libanés · Valencia",
                  "Lebanese Bistro & Café · Valencia",
                  "بيسترو ومقهى لبناني · فالنسيا",
                  "Libanesisches Bistró & Café · Valencia"
                )}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-7xl text-[var(--espresso)] leading-tight mb-5 sm:mb-6"
            >
              {locale === "es" ? (
                <>
                  Sabores del<br />
                  <span className="text-gradient">Líbano</span><br />
                  en Valencia
                </>
              ) : isAr ? (
                <>
                  نكهات<br />
                  <span className="text-gradient">لبنان</span><br />
                  في فالنسيا
                </>
              ) : isDe ? (
                <>
                  Aromen des<br />
                  <span className="text-gradient">Libanon</span><br />
                  in Valencia
                </>
              ) : (
                <>
                  Flavours of<br />
                  <span className="text-gradient">Lebanon</span><br />
                  in Valencia
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-body text-base sm:text-lg text-[var(--espresso-light)] leading-relaxed max-w-lg mb-8 sm:mb-10"
            >
              {tx(
                locale,
                "Cocina libanesa auténtica, ingredientes frescos y recetas transmitidas de generación en generación. Ven a vivir el sabor mediterráneo en el corazón de Ciutat Vella.",
                "Authentic Lebanese cuisine, fresh ingredients and recipes passed down through generations. Come experience the Mediterranean flavour in the heart of Ciutat Vella.",
                "مطبخ لبناني أصيل، مكونات طازجة ووصفات تتوارثها الأجيال. تعال لتجربة النكهة المتوسطية في قلب سيوتات بيلا.",
                "Authentische libanesische Küche, frische Zutaten und Rezepte, die von Generation zu Generation weitergegeben werden. Erleben Sie den mediterranen Geschmack im Herzen von Ciutat Vella."
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4"
            >
              <Link href={`/${locale}/pedir`} className="btn-primary">
                <ShoppingBag size={18} />
                {tx(locale, "Pedir para recoger", "Order for pickup", "اطلب للاستلام", "Zur Abholung bestellen")}
              </Link>
              <Link href={`/${locale}/reservar`} className="btn-outline">
                <Calendar size={18} />
                {tx(locale, "Reservar mesa", "Book a table", "احجز طاولة", "Tisch reservieren")}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-6"
            >
              <a
                href={glovoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-body text-[var(--olive)] hover:text-[var(--terracotta)] transition-colors"
              >
                <span>
                  {tx(
                    locale,
                    "¿Prefieres que te lo llevemos a casa? Pide por",
                    "Prefer home delivery? Order via",
                    "تفضل التوصيل إلى المنزل؟ اطلب عبر",
                    "Lieber nach Hause? Bestellen Sie über"
                  )}
                </span>
                <span className="font-semibold underline underline-offset-2">Glovo</span>
                <ArrowRight size={14} />
              </a>
            </motion.div>
          </div>

          {/* Visual card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <Image
                  src={heroSrc}
                  alt={tx(
                    locale,
                    "Casa Fenicia restaurante libanés Valencia noche",
                    "Casa Fenicia Lebanese restaurant Valencia night",
                    "كازا فينيسيا مطعم لبناني فالنسيا ليلاً",
                    "Casa Fenicia libanesisches Restaurant Valencia bei Nacht"
                  )}
                  fill
                  className="object-cover object-center"
                  priority
                  sizes="(max-width: 1024px) 0px, 448px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Floating card */}
              <div
                className="absolute -bottom-6 -left-6 card-warm p-4 shadow-lg"
                style={{ borderRadius: "1rem" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                    <Star size={18} className="text-[var(--gold)]" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold text-[var(--espresso)]">
                      {tx(locale, "Valoración", "Rating", "التقييم", "Bewertung")}
                    </div>
                    <div className="font-body text-xs text-[var(--olive)]">
                      4.8 · 200+ {tx(locale, "reseñas", "reviews", "تقييم", "Bewertungen")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cuisine tag */}
              <div
                className="absolute -top-4 -right-4 bg-[var(--gold)] text-black px-4 py-2 rounded-full text-sm font-body font-semibold"
              >
                {tx(locale, "Cocina Libanesa", "Lebanese Cuisine", "المطبخ اللبناني", "Libanesische Küche")}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-lg"
        >
          {[
            { value: "15+", label: tx(locale, "Años de receta", "Years of recipes", "سنوات من الوصفات", "Jahre Rezepte") },
            { value: "40+", label: tx(locale, "Platos únicos", "Unique dishes", "أطباق فريدة", "Einzigartige Gerichte") },
            { value: "9–22h", label: tx(locale, "Abrimos cada día", "Open every day", "مفتوح كل يوم", "Täglich geöffnet") },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl text-[var(--terracotta)] font-bold">
                {stat.value}
              </div>
              <div className="font-body text-xs text-[var(--olive)] mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-500 opacity-50">
        <div className="w-px h-8 bg-[var(--terracotta)]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--terracotta)]" />
      </div>
    </section>
  );
}
