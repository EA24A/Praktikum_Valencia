import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ReservationForm from "@/components/public/ReservationForm";
import PageReveal from "@/components/ui/PageReveal";
import { tx } from "@/lib/tx";
import { getSiteImages } from "@/lib/siteImages";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: tx(
      locale,
      "Reservar Mesa – Casa Fenicia Valencia",
      "Book a Table – Casa Fenicia Valencia",
      "احجز طاولة – كازا فينيسيا فالنسيا",
      "Tisch reservieren – Casa Fenicia Valencia"
    ),
    description: tx(
      locale,
      "Reserva tu mesa en Casa Fenicia, bistró libanés en Valencia. Disponibilidad en tiempo real, confirmación inmediata.",
      "Book your table at Casa Fenicia, Lebanese bistro in Valencia. Real-time availability, instant confirmation.",
      "احجز طاولتك في كازا فينيسيا، بيسترو لبناني في فالنسيا. توفّر فوري وتأكيد لحظي.",
      "Reservieren Sie Ihren Tisch bei Casa Fenicia, libanesisches Bistró in Valencia. Echtzeit-Verfügbarkeit, sofortige Bestätigung."
    ),
  };
}

export default async function ReservePage() {
  const locale = await getLocale();
  const siteImages = await getSiteImages();

  const timeSlots = await prisma.timeSlot.findMany({
    where: { isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  }).catch(() => []);

  return (
    <>
      <Navbar logoUrl={siteImages.logo} />
      <PageReveal><main className="pt-20 min-h-screen bg-[var(--cream)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-12 h-px bg-[var(--terracotta)]/40" />
              <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
                {tx(locale, "Reservas", "Reservations", "الحجوزات", "Reservierungen")}
              </span>
              <span className="w-12 h-px bg-[var(--terracotta)]/40" />
            </div>
            <h1 className="font-display text-3xl sm:text-5xl text-[var(--espresso)]">
              {tx(locale, "Reservar mesa", "Book a table", "احجز طاولة", "Tisch reservieren")}
            </h1>
            <p className="font-body text-[var(--olive)] mt-3">
              {tx(
                locale,
                "Reserva en tiempo real. Confirmamos tu mesa en breve.",
                "Real-time booking. We confirm your table shortly.",
                "حجز فوري. نؤكد طاولتك خلال وقت قصير.",
                "Echtzeit-Reservierung. Wir bestätigen Ihren Tisch in Kürze."
              )}
            </p>
          </div>

          <ReservationForm timeSlots={timeSlots} locale={locale} />
        </div>
      </main></PageReveal>
      <Footer logoUrl={siteImages.logo} />
    </>
  );
}
