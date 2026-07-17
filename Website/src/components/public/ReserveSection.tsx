"use client";

import Link from "next/link";
import { Calendar, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerReveal, staggerItem } from "@/components/ui/ScrollReveal";
import { tx } from "@/lib/tx";

type Props = { locale: string };

export default function ReserveSection({ locale }: Props) {

  return (
    <section className="py-24 bg-[var(--cream)] relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 65%)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <ScrollReveal variant="scaleIn">
          <div className="card-warm rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left - visual */}
              <ScrollReveal variant="fadeLeft">
                <div
                  className="relative min-h-64 lg:min-h-0"
                  style={{
                    background: "linear-gradient(135deg, #1A1400 0%, #2C2000 50%, #3A2A00 100%)",
                  }}
                >
                  <div className="absolute inset-0 bg-noise opacity-20" />
                  <div className="relative flex items-center justify-center h-full p-12">
                    <div className="text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        className="font-display text-3xl text-[var(--gold)] mb-2"
                      >
                        {tx(locale, "Una mesa para ti", "A table for you", "طاولة من أجلك", "Ein Tisch für Sie")}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right - CTA */}
              <ScrollReveal variant="fadeRight" delay={0.15}>
                <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-3 mb-5">
                    <span className="w-8 h-px bg-[var(--terracotta)]/40" />
                    <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
                      {tx(locale, "Reservas", "Reservations", "الحجوزات", "Reservierungen")}
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl text-[var(--espresso)] mb-4">
                    {tx(locale, "Reserva tu mesa", "Book your table", "احجز طاولتك", "Reservieren Sie Ihren Tisch")}
                  </h2>
                  <p className="font-body text-[var(--olive)] leading-relaxed mb-8">
                    {tx(
                      locale,
                      "Elige tu fecha y hora, y disfruta de una velada especial en Casa Fenicia. Confirmamos tu reserva en menos de 24 horas.",
                      "Choose your date and time, and enjoy a special evening at Casa Fenicia. We confirm your booking within 24 hours.",
                      "اختر التاريخ والوقت، واستمتع بأمسية مميزة في كازا فينيسيا. نؤكد حجزك خلال أقل من 24 ساعة.",
                      "Wählen Sie Datum und Uhrzeit und genießen Sie einen besonderen Abend bei Casa Fenicia. Wir bestätigen Ihre Reservierung innerhalb von 24 Stunden."
                    )}
                  </p>

                  <StaggerReveal className="grid grid-cols-3 gap-4 mb-8" delay={0.1}>
                    {[
                      { icon: Calendar, text: tx(locale, "Elige fecha", "Pick a date", "اختر التاريخ", "Datum wählen") },
                      { icon: Users, text: tx(locale, "Indica personas", "Set guests", "حدد الأشخاص", "Gäste angeben") },
                      { icon: Clock, text: tx(locale, "Confirma hora", "Confirm time", "أكّد الوقت", "Uhrzeit bestätigen") },
                    ].map(({ icon: Icon, text }) => (
                      <motion.div key={text} variants={staggerItem} className="text-center">
                        <div className="w-10 h-10 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center mx-auto mb-2">
                          <Icon size={18} className="text-[var(--terracotta)]" />
                        </div>
                        <div className="font-body text-xs text-[var(--olive)]">{text}</div>
                      </motion.div>
                    ))}
                  </StaggerReveal>

                  <Link href={`/${locale}/reservar`} className="btn-primary self-start">
                    {tx(locale, "Reservar ahora", "Book now", "احجز الآن", "Jetzt reservieren")}
                  </Link>

                  <p className="font-body text-xs text-[var(--olive)]/60 mt-4">
                    {tx(
                      locale,
                      "También puedes llamarnos al +34 600 345 055",
                      "You can also call us at +34 600 345 055",
                      "يمكنك أيضاً الاتصال بنا على +34 600 345 055",
                      "Sie können uns auch unter +34 600 345 055 anrufen"
                    )}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
