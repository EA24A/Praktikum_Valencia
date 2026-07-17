import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/siteUrl";
import { getSiteImages } from "@/lib/siteImages";

// Site-ownership verification meta tags. Paste the codes you receive from each
// provider into the matching env var (no quotes, just the bare code) and the
// tags will appear automatically. Empty values are skipped.
const VERIFICATION = {
  google: process.env.GOOGLE_SITE_VERIFICATION,
  yandex: process.env.YANDEX_VERIFICATION,
  yahoo: process.env.YAHOO_SITE_VERIFICATION,
  bing: process.env.BING_SITE_VERIFICATION,
  pinterest: process.env.PINTEREST_SITE_VERIFICATION,
  facebook: process.env.FACEBOOK_DOMAIN_VERIFICATION,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const siteImages = await getSiteImages().catch(() => null);
  const ogImage = siteImages?.og_default ?? "/og-default.jpg";

  return {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL),
  title: {
    default: "Casa Fenicia – Lebanese Bistro & Café Valencia | Restaurante Libanés",
    template: "%s | Casa Fenicia – Lebanese Restaurant Valencia",
  },
  description:
    "Casa Fenicia – the best Lebanese restaurant in Valencia, Spain. Authentic Lebanese cuisine in Ciutat Vella: hummus, shawarma, falafel, kibbeh, baklava, knafeh. Online reservations, pickup and Glovo delivery. Restaurante libanés auténtico en Valencia.",
  applicationName: "Casa Fenicia",
  authors: [{ name: "Casa Fenicia", url: SITE_URL }],
  creator: "Casa Fenicia",
  publisher: "Casa Fenicia",
  generator: "Casa Fenicia",
  category: "restaurant",
  classification: "Lebanese restaurant, Mediterranean bistro, Middle Eastern food, halal restaurant, Valencia Spain",
  keywords: [
    // Spanish
    "restaurante libanés Valencia",
    "comida libanesa Valencia",
    "bistro libanés Valencia",
    "Casa Fenicia Valencia",
    "hummus Valencia",
    "shawarma Valencia",
    "falafel Valencia",
    "kibbeh Valencia",
    "baklava Valencia",
    "knafeh Valencia",
    "restaurante árabe Valencia",
    "restaurante halal Valencia",
    "restaurante mediterráneo Valencia",
    "restaurante Ciutat Vella",
    "restaurante centro Valencia",
    "comida libanesa para llevar Valencia",
    "comida libanesa a domicilio Valencia",
    "mejor restaurante libanés Valencia",
    "libanon bistro Valencia",
    "libanon food Valencia",
    // English
    "Lebanese restaurant Valencia",
    "Lebanese food Valencia",
    "Lebanese bistro Valencia",
    "Lebanese cuisine Valencia",
    "best Lebanese restaurant Valencia",
    "Mediterranean restaurant Valencia",
    "Middle Eastern restaurant Valencia",
    "halal restaurant Valencia",
    "Lebanese takeaway Valencia",
    "Lebanese delivery Valencia",
    "Casa Fenicia",
    // Arabic
    "مطعم لبناني فالنسيا",
    "طعام لبناني فالنسيا",
    "كازا فينيسيا",
  ],
  openGraph: {
    type: "website",
    siteName: "Casa Fenicia",
    title: "Casa Fenicia – Lebanese Bistro & Café Valencia | Restaurante Libanés",
    description:
      "Authentic Lebanese restaurant in the heart of Valencia. Hummus, shawarma, falafel, kibbeh, baklava, knafeh. Online booking, pickup & Glovo delivery.",
    url: SITE_URL,
    locale: "es_ES",
    alternateLocale: ["en_GB", "ar_AR"],
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Casa Fenicia – Lebanese Bistro Valencia – Restaurante Libanés Valencia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa Fenicia – Lebanese Bistro & Café Valencia",
    description:
      "Authentic Lebanese cuisine in Ciutat Vella, Valencia. Hummus, shawarma, falafel, baklava. Reservations & pickup online.",
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: { email: true, address: true, telephone: true },
  verification: {
    ...(VERIFICATION.google ? { google: VERIFICATION.google } : {}),
    ...(VERIFICATION.yandex ? { yandex: VERIFICATION.yandex } : {}),
    ...(VERIFICATION.yahoo ? { yahoo: VERIFICATION.yahoo } : {}),
    other: {
      ...(VERIFICATION.bing ? { "msvalidate.01": VERIFICATION.bing } : {}),
      ...(VERIFICATION.pinterest
        ? { "p:domain_verify": VERIFICATION.pinterest }
        : {}),
      ...(VERIFICATION.facebook
        ? { "facebook-domain-verification": VERIFICATION.facebook }
        : {}),
    },
  },
  other: {
    "geo.region": "ES-V",
    "geo.placename": "Valencia, Comunitat Valenciana, Spain",
    "geo.position": "39.4751;-0.3766",
    ICBM: "39.4751, -0.3766",
    "DC.title": "Casa Fenicia – Lebanese Bistro & Café Valencia",
    rating: "general",
    distribution: "global",
    revisit: "1 days",
  },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteImages = await getSiteImages().catch(() => null);
  const faviconHref = siteImages?.favicon ?? "/logo.png";
  const appleHref = siteImages?.logo ?? "/logo.png";
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="icon" href={faviconHref} type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href={appleHref} />
        <link rel="canonical" href={SITE_URL} />
        <link rel="alternate" hrefLang="es" href={`${SITE_URL}/es`} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en`} />
        <link rel="alternate" hrefLang="ar" href={`${SITE_URL}/ar`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/es`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Pin LLM/GEO crawler hint files (also discoverable at /llms.txt) */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
      </head>
      <body>{children}</body>
    </html>
  );
}
