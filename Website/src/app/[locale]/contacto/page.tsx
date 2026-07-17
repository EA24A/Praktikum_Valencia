import { getLocale } from "next-intl/server";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageReveal from "@/components/ui/PageReveal";
import { MapPin, Phone, Clock, Mail, User } from "lucide-react";
import { tx } from "@/lib/tx";
import { getSiteImages } from "@/lib/siteImages";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: tx(
      locale,
      "Contacto – Casa Fenicia Valencia",
      "Contact – Casa Fenicia Valencia",
      "اتصل بنا – كازا فينيسيا فالنسيا",
      "Kontakt – Casa Fenicia Valencia"
    ),
    description: tx(
      locale,
      "Encuéntranos en C/ de la Corretgeria, 4, Ciutat Vella, Valencia. Llámanos al +34 600 345 055. Abierto todos los días de 9 a 22h.",
      "Find us at C/ de la Corretgeria, 4, Ciutat Vella, Valencia. Call us on +34 600 345 055. Open daily 9am to 10pm.",
      "تجدنا في C/ de la Corretgeria, 4, سيوتات بيلا، فالنسيا. اتصل بنا على +34 600 345 055. مفتوح كل يوم من 9 صباحاً حتى 10 مساءً.",
      "Finden Sie uns in der C/ de la Corretgeria, 4, Ciutat Vella, Valencia. Rufen Sie uns an unter +34 600 345 055. Täglich geöffnet von 9 bis 22 Uhr."
    ),
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const siteImages = await getSiteImages();

  return (
    <>
      <Navbar logoUrl={siteImages.logo} />
      <PageReveal><main className="pt-20 min-h-screen bg-[var(--cream)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-12 h-px bg-[var(--terracotta)]/40" />
              <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
                {tx(locale, "Encuéntranos", "Find us", "تجدنا هنا", "So finden Sie uns")}
              </span>
              <span className="w-12 h-px bg-[var(--terracotta)]/40" />
            </div>
            <h1 className="font-display text-3xl sm:text-5xl text-[var(--espresso)]">
              {tx(locale, "Visítanos", "Visit us", "زورونا", "Besuchen Sie uns")}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Info cards */}
            <div className="space-y-4">
              {[
                {
                  icon: User,
                  title: tx(locale, "Propietario", "Owner", "المالك", "Inhaber"),
                  content: "Ali Dib",
                },
                {
                  icon: MapPin,
                  title: tx(locale, "Dirección", "Address", "العنوان", "Adresse"),
                  content: "C/ de la Corretgeria, 4\nCiutat Vella, 46001 València",
                  link: "https://maps.app.goo.gl/kxm6t86WrZ4u4xC19",
                  linkText: tx(locale, "Ver en Google Maps", "View on Google Maps", "افتح في خرائط Google", "In Google Maps ansehen"),
                },
                {
                  icon: Phone,
                  title: tx(locale, "Teléfono", "Phone", "الهاتف", "Telefon"),
                  content: "+34 600 345 055",
                  link: "tel:+34600345055",
                  linkText: tx(locale, "Llamar ahora", "Call now", "اتصل الآن", "Jetzt anrufen"),
                },
                {
                  icon: Clock,
                  title: tx(locale, "Horario", "Opening hours", "ساعات العمل", "Öffnungszeiten"),
                  content: tx(
                    locale,
                    "Lunes a domingo\n9:00 – 22:00",
                    "Monday to Sunday\n9:00 – 22:00",
                    "من الإثنين إلى الأحد\n9:00 – 22:00",
                    "Montag bis Sonntag\n9:00 – 22:00"
                  ),
                },
                {
                  icon: Mail,
                  title: tx(locale, "Reservas", "Reservations", "الحجوزات", "Reservierungen"),
                  content: tx(
                    locale,
                    "Reserva tu mesa online o llámanos directamente.",
                    "Book your table online or call us directly.",
                    "احجز طاولتك إلكترونياً أو اتصل بنا مباشرة.",
                    "Reservieren Sie Ihren Tisch online oder rufen Sie uns direkt an."
                  ),
                  link: `/${locale}/reservar`,
                  linkText: tx(locale, "Reservar mesa", "Book a table", "احجز طاولة", "Tisch reservieren"),
                },
              ].map(({ icon: Icon, title, content, link, linkText }) => (
                <div key={title} className="card-warm rounded-xl p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={18} className="text-[var(--terracotta)]" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-[var(--espresso)] mb-1">{title}</div>
                    <p className="font-body text-sm text-[var(--olive)] whitespace-pre-line leading-relaxed">
                      {content}
                    </p>
                    {link && linkText && (
                      <a
                        href={link}
                        target={link.startsWith("http") ? "_blank" : undefined}
                        rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-block mt-2 font-body text-sm text-[var(--terracotta)] hover:text-[var(--terracotta-dark)] transition-colors underline underline-offset-2"
                      >
                        {linkText} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Map embed */}
            <div className="card-warm rounded-xl overflow-hidden min-h-96">
              <iframe
                title={tx(locale, "Mapa Casa Fenicia Valencia", "Casa Fenicia Valencia Map", "خريطة كازا فينيسيا فالنسيا", "Karte Casa Fenicia Valencia")}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d337.83435783542194!2d-0.3766040613215715!3d39.475103200000014!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd604f41f1556757%3A0xabb8e6e5364301c4!2sCasa%20Fenicia!5e1!3m2!1ssk!2ses!4v1777912355113!5m2!1ssk!2ses"
                width="100%"
                height="100%"
                className="min-h-96"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </main></PageReveal>
      <Footer logoUrl={siteImages.logo} />
    </>
  );
}
