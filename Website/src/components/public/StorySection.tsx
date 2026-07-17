"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, Heart, Star } from "lucide-react";
import { ScrollReveal, StaggerReveal, staggerItem } from "@/components/ui/ScrollReveal";
import { motion } from "framer-motion";
import { tx } from "@/lib/tx";

type Props = { locale: string; storyImageUrl?: string };

export default function StorySection({ locale, storyImageUrl }: Props) {
  const isEs = locale === "es";
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const storySrc = storyImageUrl ?? "/images/our-kitchen.jpg";

  return (
    <section className="py-24 bg-[#0C0900] overflow-hidden relative" style={{ borderTop: "1px solid #1E1800", borderBottom: "1px solid #1E1800" }}>
      {/* Background texture */}
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 65%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 65%)", transform: "translate(-30%, 30%)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image area — slides in from left */}
          <ScrollReveal variant="fadeLeft">
            <div className="relative">
              <div className="relative aspect-square max-w-md rounded-2xl overflow-hidden">
                <Image
                  src={storySrc}
                  alt={tx(locale, "Nuestra cocina Casa Fenicia", "Our kitchen Casa Fenicia", "مطبخنا كازا فينيسيا", "Unsere Küche Casa Fenicia")}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 448px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>

              {/* Floating quote */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -60px 0px" }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute -bottom-4 right-0 sm:-right-4 lg:right-0 bg-[var(--terracotta)] text-white p-4 sm:p-6 rounded-xl max-w-[85%] sm:max-w-xs shadow-xl"
              >
                <p className="font-display text-lg italic leading-snug">
                  {tx(
                    locale,
                    '"Cada plato es una historia, cada visita un recuerdo."',
                    '"Every dish is a story, every visit a memory."',
                    '"كل طبق قصة، وكل زيارة ذكرى."',
                    '"Jedes Gericht ist eine Geschichte, jeder Besuch eine Erinnerung."'
                  )}
                </p>
                <div className="mt-3 font-body text-xs text-white/70">
                  — Casa Fenicia
                </div>
              </motion.div>
            </div>
          </ScrollReveal>

          {/* Text — slides in from right */}
          <ScrollReveal variant="fadeRight" delay={0.1}>
            <div>
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-[var(--terracotta)]" />
                <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
                  {tx(locale, "Nuestra historia", "Our story", "قصتنا", "Unsere Geschichte")}
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-6">
                {isEs ? (
                  <>Una historia que<br /><span style={{ color: "var(--terracotta-light)" }}>sabe a hogar</span></>
                ) : isAr ? (
                  <>قصة بطعم<br /><span style={{ color: "var(--terracotta-light)" }}>الوطن</span></>
                ) : isDe ? (
                  <>Eine Geschichte, die<br /><span style={{ color: "var(--terracotta-light)" }}>wie Zuhause schmeckt</span></>
                ) : (
                  <>A story that<br /><span style={{ color: "var(--terracotta-light)" }}>tastes like home</span></>
                )}
              </h2>

              <p className="font-body text-[var(--sand)]/80 leading-relaxed mb-6">
                {tx(
                  locale,
                  "Casa Fenicia nació del amor por la cocina libanesa y la hospitalidad mediterránea. En el corazón de Ciutat Vella, traemos a Valencia los sabores auténticos del Líbano: el hummus cremoso, el shawarma perfecto, el falafel crujiente y mucho más.",
                  "Casa Fenicia was born out of love for Lebanese cuisine and Mediterranean hospitality. In the heart of Ciutat Vella, we bring Valencia the authentic flavours of Lebanon: creamy hummus, perfect shawarma, crispy falafel and so much more.",
                  "وُلد كازا فينيسيا من حب المطبخ اللبناني والضيافة المتوسطية. في قلب سيوتات بيلا، نقدّم لفالنسيا نكهات لبنان الأصيلة: الحمص الكريمي، والشاورما المثالية، والفلافل المقرمش وأكثر بكثير.",
                  "Casa Fenicia entstand aus der Liebe zur libanesischen Küche und mediterraner Gastfreundschaft. Im Herzen von Ciutat Vella bringen wir Valencia die authentischen Aromen des Libanon: cremigen Hummus, perfektes Shawarma, knusprigen Falafel und vieles mehr."
                )}
              </p>

              <p className="font-body text-[var(--sand)]/60 leading-relaxed mb-10">
                {tx(
                  locale,
                  "Cada ingrediente es seleccionado con cuidado, cada receta elaborada con tradición. Te invitamos a vivir una experiencia gastronómica única que conecta el Mediterráneo con Oriente Medio.",
                  "Every ingredient is carefully selected, every recipe crafted with tradition. We invite you to experience a unique gastronomic journey connecting the Mediterranean with the Middle East.",
                  "كل مكوّن يُختار بعناية، وكل وصفة تُحضَّر بحسب التقاليد. ندعوك لتعيش تجربة طعام فريدة تربط البحر المتوسط بالشرق الأوسط.",
                  "Jede Zutat wird sorgfältig ausgewählt, jedes Rezept nach Tradition zubereitet. Wir laden Sie ein, ein einzigartiges kulinarisches Erlebnis zu genießen, das das Mittelmeer mit dem Nahen Osten verbindet."
                )}
              </p>

              {/* Values — staggered */}
              <StaggerReveal className="grid grid-cols-3 gap-4 mb-10" delay={0.15}>
                {[
                  { icon: Leaf, label: tx(locale, "Ingredientes frescos", "Fresh ingredients", "مكونات طازجة", "Frische Zutaten") },
                  { icon: Heart, label: tx(locale, "Hecho con amor", "Made with love", "صُنع بحب", "Mit Liebe gemacht") },
                  { icon: Star, label: tx(locale, "Recetas auténticas", "Authentic recipes", "وصفات أصيلة", "Authentische Rezepte") },
                ].map(({ icon: Icon, label }) => (
                  <motion.div key={label} variants={staggerItem} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--terracotta)]/20 flex items-center justify-center mx-auto mb-2">
                      <Icon size={18} className="text-[var(--terracotta-light)]" />
                    </div>
                    <div className="font-body text-xs text-[var(--sand)]/70">{label}</div>
                  </motion.div>
                ))}
              </StaggerReveal>

              <Link
                href={`/${locale}/nosotros`}
                className="inline-flex items-center gap-2 font-body text-[var(--terracotta-light)] hover:gap-3 transition-all"
              >
                {tx(locale, "Conocer más sobre nosotros", "Learn more about us", "تعرّف علينا أكثر", "Mehr über uns erfahren")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
