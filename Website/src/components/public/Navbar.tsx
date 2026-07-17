"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";

type Props = { logoUrl?: string };

export default function Navbar({ logoUrl }: Props = {}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const logoSrc = logoUrl ?? "/logo.png";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const allLocales = routing.locales;
  const switchPathFor = (target: string) =>
    pathname.replace(new RegExp(`^/(${allLocales.join("|")})`), `/${target}`);

  const links = [
    { href: `/${locale}/menu`, label: t("menu") },
    { href: `/${locale}/pedir`, label: t("order") },
    { href: `/${locale}/reservar`, label: t("reserve") },
    { href: `/${locale}/nosotros`, label: t("about") },
    { href: `/${locale}/contacto`, label: t("contact") },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-[var(--gold)]/25 shadow-[0_1px_0_rgba(201,168,76,0.08),0_8px_32px_rgba(0,0,0,0.55)]"
          : "border-b border-white/[0.04]"
      )}
      style={{
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        background: scrolled
          ? "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.58) 100%)"
          : "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.10) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-[var(--gold)]/30 group-hover:ring-[var(--gold)]/60 transition-all bg-black">
              <Image src={logoSrc} alt="Casa Fenicia" width={96} height={96} className="w-full h-full object-contain" priority unoptimized={logoSrc.startsWith("/")} />
            </div>
            <span className="font-display text-xl font-semibold text-[var(--espresso)] transition-colors group-hover:text-[var(--gold)]">
              Casa Fenicia
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-body text-sm tracking-wide transition-colors hover:text-[var(--gold)]",
                  pathname === link.href
                    ? "text-[var(--gold)] font-medium"
                    : "text-[var(--sand)]/70 hover:text-[var(--sand)]"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Language toggle */}
            <div className="flex items-center gap-1 border border-[var(--gold)]/40 rounded-full p-0.5">
              {allLocales.map((l) => (
                <Link
                  key={l}
                  href={switchPathFor(l)}
                  className={cn(
                    "text-[11px] font-body font-semibold tracking-wider rounded-full px-2.5 py-1 transition-all",
                    l === locale
                      ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                      : "text-[var(--sand)]/60 hover:text-[var(--gold)] hover:bg-[var(--gold)]/10"
                  )}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>

            <Link href={`/${locale}/pedir`} className="btn-primary text-sm py-2 px-5">
              {t("order")}
            </Link>
          </nav>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-0.5 border border-[var(--gold)]/40 rounded-full p-0.5">
              {allLocales.map((l) => (
                <Link
                  key={l}
                  href={switchPathFor(l)}
                  className={cn(
                    "text-[10px] font-body font-semibold tracking-wider rounded-full px-2 py-1 transition-all",
                    l === locale
                      ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                      : "text-[var(--sand)]/60"
                  )}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              className="p-2 text-[var(--sand)]"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t border-[var(--gold)]/15 px-4 pb-6 pt-4 animate-fade-in"
          style={{
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            background: "linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.76) 100%)",
          }}
        >
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "font-body text-base py-2 border-b border-[var(--gold)]/10 transition-colors",
                  pathname === link.href
                    ? "text-[var(--gold)] font-medium"
                    : "text-[var(--sand)]/70"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/pedir`}
              onClick={() => setOpen(false)}
              className="btn-primary text-center mt-2"
            >
              {t("order")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
