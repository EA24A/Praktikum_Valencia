/**
 * Comprehensive Schema.org structured data for Casa Fenicia.
 * Powers Google rich results, Knowledge Panel eligibility,
 * LLM citations (ChatGPT, Perplexity, Claude, Gemini), and
 * local pack rankings.
 */

import { SITE_URL } from "@/lib/siteUrl";
import { getFaqs } from "@/lib/faqs";

type Props = {
  locale: string;
  /** Override URLs for the photos used in `image`/`logo` schema fields. */
  images?: {
    logo?: string;
    hero?: string;
    story?: string;
    about?: string;
    og_default?: string;
  };
};

const absolute = (url: string) =>
  url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

const NAME = "Casa Fenicia";
const URL = SITE_URL;
const PHONE = "+34600345055";
const EMAIL = "info@casafenicia.com";
const ADDRESS = {
  street: "C/ de la Corretgeria, 4",
  city: "Valencia",
  region: "Comunitat Valenciana",
  postcode: "46001",
  country: "ES",
};
const GEO = { lat: 39.4751, lng: -0.3766 };

const DESCRIPTIONS: Record<string, string> = {
  es: "Casa Fenicia es un restaurante libanés auténtico en el corazón de Ciutat Vella, Valencia. Especialidades: hummus, shawarma, falafel, kibbeh, baklava, knafeh, cocina libanesa y mediterránea con ingredientes frescos. Reservas online, comida para recoger y delivery por Glovo. El mejor bistro libanés de Valencia.",
  en: "Casa Fenicia is an authentic Lebanese restaurant in the heart of Ciutat Vella, Valencia, Spain. Specialities: hummus, shawarma, falafel, kibbeh, baklava, knafeh, Lebanese & Mediterranean cuisine with fresh ingredients. Online reservations, pickup and Glovo delivery. The best Lebanese bistro in Valencia.",
  ar: "كازا فينيسيا مطعم لبناني أصيل في قلب سيوتات بيلا، فالنسيا، إسبانيا. تخصصات: حمص، شاورما، فلافل، كبة، بقلاوة، كنافة، مطبخ لبناني ومتوسطي بمكونات طازجة. حجوزات إلكترونية، استلام وتوصيل عبر Glovo. أفضل بيسترو لبناني في فالنسيا.",
  de: "Casa Fenicia ist ein authentisches libanesisches Restaurant im Herzen von Ciutat Vella, Valencia, Spanien. Spezialitäten: Hummus, Shawarma, Falafel, Kibbeh, Baklava, Knafeh, libanesische und mediterrane Küche mit frischen Zutaten. Online-Reservierungen, Abholung und Lieferung über Glovo. Das beste libanesische Bistro in Valencia.",
};

export default function StructuredData({ locale, images }: Props) {
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.es;
  // FAQs come from a single shared file so the JSON-LD here always
  // matches what FaqSection renders on the page (Google requirement).
  const faqs = getFaqs(locale);

  const heroImg = absolute(images?.hero ?? "/images/hero-restaurant.jpg");
  const storyImg = absolute(images?.story ?? "/images/our-kitchen.jpg");
  const aboutImg = absolute(images?.about ?? "/images/about-storefront.jpg");
  const ogImg = absolute(images?.og_default ?? "/og-default.jpg");
  const logoImg = absolute(images?.logo ?? "/logo.png");

  // 1. Restaurant + LocalBusiness (combined, with extensive properties)
  const restaurant = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "LocalBusiness", "FoodEstablishment"],
    "@id": `${URL}/#restaurant`,
    name: NAME,
    alternateName: [
      "Casa Fenicia Lebanese Bistro",
      "Casa Fenicia Valencia",
      "Restaurante Libanés Casa Fenicia",
      "كازا فينيسيا",
    ],
    description,
    url: URL,
    telephone: PHONE,
    email: EMAIL,
    image: [heroImg, storyImg, aboutImg, ogImg],
    logo: logoImg,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: ["Cash", "Credit Card", "Debit Card", "Stripe"],
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.region,
      postalCode: ADDRESS.postcode,
      addressCountry: ADDRESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.lat,
      longitude: GEO.lng,
    },
    hasMap: "https://maps.app.goo.gl/kxm6t86WrZ4u4xC19",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "22:00",
      },
    ],
    servesCuisine: [
      "Lebanese",
      "Mediterranean",
      "Middle Eastern",
      "Arab",
      "Levantine",
      "Halal",
      "Vegetarian",
      "Vegan-Friendly",
    ],
    acceptsReservations: "True",
    menu: `${URL}/${locale}/menu`,
    sameAs: [
      "https://www.instagram.com/casafeniciavlc",
      "https://www.tiktok.com/@casafeniciavlc",
      "https://maps.app.goo.gl/kxm6t86WrZ4u4xC19",
    ],
    areaServed: [
      { "@type": "City", name: "Valencia" },
      { "@type": "AdministrativeArea", name: "Ciutat Vella" },
      { "@type": "AdministrativeArea", name: "Comunitat Valenciana" },
    ],
    knowsLanguage: ["es", "en", "ar", "de"],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "200",
      reviewCount: "200",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Vegetarian options", value: true },
      { "@type": "LocationFeatureSpecification", name: "Vegan options", value: true },
      { "@type": "LocationFeatureSpecification", name: "Halal", value: true },
      { "@type": "LocationFeatureSpecification", name: "Takeaway", value: true },
      { "@type": "LocationFeatureSpecification", name: "Delivery", value: true },
      { "@type": "LocationFeatureSpecification", name: "Online reservations", value: true },
      { "@type": "LocationFeatureSpecification", name: "Family-friendly", value: true },
    ],
    keywords:
      "Lebanese restaurant Valencia, restaurante libanés Valencia, Lebanese food, comida libanesa, Lebanese bistro, bistro libanés, hummus, shawarma, falafel, kibbeh, baklava, knafeh, halal Valencia, Mediterranean restaurant, Middle Eastern food Valencia, مطعم لبناني فالنسيا, libanon bistro valencia, libanon food valencia",
  };

  // 2. Organization
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${URL}/#organization`,
    name: NAME,
    url: URL,
    logo: logoImg,
    sameAs: [
      "https://www.instagram.com/casafeniciavlc",
      "https://www.tiktok.com/@casafeniciavlc",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE,
      contactType: "customer service",
      areaServed: "ES",
      availableLanguage: ["es", "en", "ar", "de"],
    },
  };

  // 3. WebSite (with SearchAction)
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${URL}/#website`,
    url: URL,
    name: NAME,
    description,
    publisher: { "@id": `${URL}/#organization` },
    inLanguage: ["es-ES", "en-GB", "ar", "de-DE"],
  };

  // 4. FAQ rich result eligibility
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // 5. BreadcrumbList
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Casa Fenicia", item: URL },
    ],
  };

  // 6. Menu (sample top items so LLMs can cite them)
  const menu = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: locale === "es" ? "Carta Casa Fenicia" : locale === "ar" ? "قائمة كازا فينيسيا" : locale === "de" ? "Speisekarte Casa Fenicia" : "Casa Fenicia Menu",
    url: `${URL}/${locale}/menu`,
    inLanguage: locale,
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: locale === "es" ? "Entrantes libaneses" : locale === "ar" ? "مقبلات لبنانية" : locale === "de" ? "Libanesische Vorspeisen" : "Lebanese Starters",
        hasMenuItem: [
          { "@type": "MenuItem", name: "Hummus", description: "Crema de garbanzos con tahini, aceite de oliva y pimentón", offers: { "@type": "Offer", price: "6.50", priceCurrency: "EUR" } },
          { "@type": "MenuItem", name: "Falafel", description: "Croquetas de garbanzo crujientes con salsa tahini", offers: { "@type": "Offer", price: "7.50", priceCurrency: "EUR" } },
          { "@type": "MenuItem", name: "Tabbouleh", description: "Ensalada de perejil, bulgur, tomate, limón", offers: { "@type": "Offer", price: "6.00", priceCurrency: "EUR" } },
          { "@type": "MenuItem", name: "Baba Ghanoush", description: "Crema de berenjena ahumada con granada", offers: { "@type": "Offer", price: "6.50", priceCurrency: "EUR" } },
        ],
      },
      {
        "@type": "MenuSection",
        name: locale === "es" ? "Platos principales" : locale === "ar" ? "أطباق رئيسية" : locale === "de" ? "Hauptgerichte" : "Main dishes",
        hasMenuItem: [
          { "@type": "MenuItem", name: "Shawarma de Pollo", description: "Pollo marinado en pita con salsa de ajo", offers: { "@type": "Offer", price: "10.50", priceCurrency: "EUR" } },
          { "@type": "MenuItem", name: "Kibbeh", description: "Croquetas de cordero con bulgur y especias", offers: { "@type": "Offer", price: "12.00", priceCurrency: "EUR" } },
          { "@type": "MenuItem", name: "Sfiha", description: "Pan plano libanés con cordero, tomate, piñones", offers: { "@type": "Offer", price: "9.50", priceCurrency: "EUR" } },
          { "@type": "MenuItem", name: "Meze Vegetariano", description: "Selección de hummus, falafel, tabbouleh, baba ghanoush", offers: { "@type": "Offer", price: "14.00", priceCurrency: "EUR" } },
        ],
      },
      {
        "@type": "MenuSection",
        name: locale === "es" ? "Postres libaneses" : locale === "ar" ? "حلويات لبنانية" : locale === "de" ? "Libanesische Desserts" : "Lebanese desserts",
        hasMenuItem: [
          { "@type": "MenuItem", name: "Baklava", description: "Pastel de hojaldre con miel y pistacho" },
          { "@type": "MenuItem", name: "Knafeh", description: "Postre caliente de queso con sirope de azahar y pistacho" },
          { "@type": "MenuItem", name: "Helado de Almendra", description: "Helado artesanal de almendra y agua de rosas con pistacho" },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurant) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menu) }} />
    </>
  );
}
