import { getLocale } from "next-intl/server";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { CheckCircle2, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { tx } from "@/lib/tx";
import { getSiteImages } from "@/lib/siteImages";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const locale = await getLocale();
  const { order } = await searchParams;
  const siteImages = await getSiteImages();

  return (
    <>
      <Navbar logoUrl={siteImages.logo} />
      <main className="pt-20 min-h-screen bg-[var(--cream)] flex items-center">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h1 className="font-display text-4xl text-[var(--espresso)] mb-3">
            {tx(locale, "¡Pedido confirmado!", "Order confirmed!", "تم تأكيد الطلب!", "Bestellung bestätigt!")}
          </h1>
          <p className="font-body text-[var(--olive)] mb-6">
            {tx(
              locale,
              "Hemos recibido tu pago y ya estamos preparando tu pedido.",
              "We've received your payment and are already preparing your order.",
              "استلمنا دفعتك ونحن نحضّر طلبك الآن.",
              "Wir haben Ihre Zahlung erhalten und bereiten Ihre Bestellung bereits zu."
            )}
          </p>

          {order && (
            <div className="bg-[#1A1500] border border-[var(--border)] rounded-xl p-5 mb-6 inline-block">
              <div className="font-body text-xs text-[var(--olive)] mb-1">
                {tx(locale, "Número de pedido", "Order number", "رقم الطلب", "Bestellnummer")}
              </div>
              <div className="font-display text-2xl text-[var(--espresso)] font-semibold">
                #{order}
              </div>
            </div>
          )}

          <div className="card-warm rounded-xl p-5 mb-6 text-left space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-[var(--terracotta)] mt-0.5 shrink-0" />
              <div>
                <div className="font-body text-sm font-medium text-[var(--espresso)]">
                  {tx(locale, "Recoge en:", "Pickup at:", "الاستلام من:", "Abholung:")}
                </div>
                <div className="font-body text-sm text-[var(--olive)]">
                  C/ de la Corretgeria, 4, Ciutat Vella, Valencia
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-[var(--terracotta)] shrink-0" />
              <div className="font-body text-sm text-[var(--olive)]">
                {tx(locale, "¿Dudas? Llámanos al ", "Questions? Call us: ", "أسئلة؟ اتصل بنا على: ", "Fragen? Rufen Sie uns an: ")}
                <a href="tel:+34600345055" className="text-[var(--terracotta)]">+34 600 345 055</a>
              </div>
            </div>
          </div>

          <p className="font-body text-sm text-[var(--olive)] mb-8">
            {tx(
              locale,
              "Te enviaremos un email cuando tu pedido esté listo para recoger.",
              "We'll send you an email when your order is ready for pickup.",
              "سنرسل لك بريداً إلكترونياً عندما يصبح طلبك جاهزاً للاستلام.",
              "Wir senden Ihnen eine E-Mail, sobald Ihre Bestellung zur Abholung bereit ist."
            )}
          </p>

          <Link href={`/${locale}`} className="btn-outline">
            {tx(locale, "Volver al inicio", "Back to home", "العودة إلى الرئيسية", "Zur Startseite")}
          </Link>
        </div>
      </main>
      <Footer logoUrl={siteImages.logo} />
    </>
  );
}
