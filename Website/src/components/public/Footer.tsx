import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Clock } from "lucide-react";
import { tx } from "@/lib/tx";

type Props = {
  instagramUrl?: string;
  tiktokUrl?: string;
  logoUrl?: string;
};

export default function Footer({ instagramUrl, tiktokUrl, logoUrl }: Props) {
  const t = useTranslations();
  const locale = useLocale();

  const igUrl = instagramUrl ?? "https://www.instagram.com/casafeniciavlc?igsh=YWVsNjkxc2Y5ZXNl&utm_source=qr";
  const ttUrl = tiktokUrl ?? "https://www.tiktok.com/@casafeniciavlc?_r=1&_t=ZN-965NxciF8LO";
  const logoSrc = logoUrl ?? "/logo.png";

  return (
    <footer
      className="text-[var(--sand)] rounded-tl-3xl rounded-tr-3xl overflow-hidden"
      style={{
        background: "linear-gradient(to top, #000000 0%, #1a1a1a 100%)",
        marginTop: "-1px",
        borderTop: "1px solid rgba(201,168,76,0.15)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-[var(--gold)]/30 shrink-0 bg-black">
                <Image src={logoSrc} alt="Casa Fenicia" width={88} height={88} className="w-full h-full object-contain" unoptimized={logoSrc.startsWith("/")} />
              </div>
              <div>
                <div className="font-display text-xl text-white">Casa Fenicia</div>
                <div className="text-xs text-[var(--olive-light)]">{t("footer.tagline")}</div>
              </div>
            </div>
            <p className="text-sm text-[var(--sand)]/70 leading-relaxed max-w-xs">
              {tx(
                locale,
                "Auténtica cocina libanesa en el corazón de Ciutat Vella, Valencia.",
                "Authentic Lebanese cuisine in the heart of Ciutat Vella, Valencia.",
                "مطبخ لبناني أصيل في قلب سيوتات بيلا، فالنسيا.",
                "Authentische libanesische Küche im Herzen von Ciutat Vella, Valencia."
              )}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg text-white mb-4">
              {t("contact.title")}
            </h3>
            <ul className="space-y-3 text-sm text-[var(--sand)]/80">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-[var(--terracotta)] mt-0.5 shrink-0" />
                <span>{t("contact.address")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-[var(--terracotta)] shrink-0" />
                <a href="tel:+34600345055" className="hover:text-white transition-colors">
                  {t("contact.phone")}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={16} className="text-[var(--terracotta)] mt-0.5 shrink-0" />
                <span>{t("contact.hours")}</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display text-lg text-white mb-4">
              {tx(locale, "Navegación", "Navigation", "التنقّل", "Navigation")}
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: `/${locale}/menu`, label: t("nav.menu") },
                { href: `/${locale}/pedir`, label: t("nav.order") },
                { href: `/${locale}/reservar`, label: t("nav.reserve") },
                { href: `/${locale}/nosotros`, label: t("nav.about") },
                { href: `/${locale}/contacto`, label: t("nav.contact") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--sand)]/70 hover:text-[var(--terracotta-light)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--sand)]/50">
            © {new Date().getFullYear()} Casa Fenicia. {t("footer.rights")}.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center gap-1.5 text-[var(--sand)]/50 hover:text-[var(--gold)] transition-colors font-body text-xs tracking-widest"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
            <a
              href={ttUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="flex items-center gap-1.5 text-[var(--sand)]/50 hover:text-[var(--gold)] transition-colors font-body text-xs tracking-widest"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/></svg>
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
