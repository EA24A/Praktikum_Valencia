"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getFaqs } from "@/lib/faqs";

const TITLES: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  es: {
    eyebrow: "Preguntas frecuentes",
    title: "Todo lo que quieres saber",
    subtitle: "Las dudas más habituales sobre Casa Fenicia, nuestro restaurante libanés en Valencia.",
  },
  en: {
    eyebrow: "Frequently asked",
    title: "Everything you want to know",
    subtitle: "The most common questions about Casa Fenicia, our Lebanese restaurant in Valencia.",
  },
  ar: {
    eyebrow: "الأسئلة الشائعة",
    title: "كل ما تريد معرفته",
    subtitle: "الأسئلة الأكثر شيوعاً حول كازا فينيسيا، مطعمنا اللبناني في فالنسيا.",
  },
};

export default function FaqSection({ locale }: { locale: string }) {
  const faqs = getFaqs(locale);
  const t = TITLES[locale] ?? TITLES.es;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 sm:py-28 bg-[#0A0700] relative overflow-hidden" style={{ borderTop: "1px solid #1E1800" }}>
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 65%)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fadeUp" className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-12 h-px bg-[var(--terracotta)]/40" />
            <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
              {t.eyebrow}
            </span>
            <span className="w-12 h-px bg-[var(--terracotta)]/40" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[var(--espresso)] mb-3">
            {t.title}
          </h2>
          <p className="font-body text-[var(--olive)] max-w-xl mx-auto">{t.subtitle}</p>
        </ScrollReveal>

        {/*
          NOTE: FAQ schema (FAQPage / Question / Answer) is emitted as
          JSON-LD by <StructuredData /> on the homepage. We deliberately
          do NOT add Schema.org microdata here, because mixing both on
          the same URL triggers Google's "Duplicate FAQPage field"
          error in Search Console.
        */}
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <ScrollReveal key={i} variant="fadeUp" delay={i * 0.04}>
                <div className="card-warm rounded-xl overflow-hidden border border-[var(--gold)]/15 hover:border-[var(--gold)]/30 transition-colors">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <h3 className="font-display text-base sm:text-lg text-[var(--espresso)] leading-snug">
                      {f.q}
                    </h3>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="shrink-0 text-[var(--gold)]"
                    >
                      <ChevronDown size={20} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 font-body text-sm sm:text-base text-[var(--olive)] leading-relaxed">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
