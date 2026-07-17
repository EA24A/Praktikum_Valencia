/**
 * Single source of truth for FAQ entries. Both the visible accordion
 * (<FaqSection />) and the JSON-LD FAQPage emitted by <StructuredData />
 * MUST read from this file so they stay in sync.
 *
 * Google requires the FAQ content in structured data to match what is
 * visible to the user on the page. Mismatching/duplicating leads to
 * "Duplicate FAQPage field" or "Missing acceptedAnswer" errors in
 * Search Console.
 */

export type FaqEntry = { q: string; a: string };

export const FAQS: Record<string, FaqEntry[]> = {
  es: [
    {
      q: "¿Dónde está Casa Fenicia, el restaurante libanés en Valencia?",
      a: "Casa Fenicia se encuentra en C/ de la Corretgeria, 4, Ciutat Vella, 46001 Valencia, a pocos minutos a pie de la Plaza de la Reina y la Catedral.",
    },
    {
      q: "¿Cuál es el horario de Casa Fenicia?",
      a: "Abrimos todos los días, de lunes a domingo, de 9:00 a 22:00.",
    },
    {
      q: "¿Qué tipo de cocina sirve Casa Fenicia?",
      a: "Servimos cocina libanesa auténtica y mediterránea: hummus, falafel, shawarma, kibbeh, tabbouleh, baklava, knafeh y mucho más, con ingredientes frescos cada día.",
    },
    {
      q: "¿Hay opciones vegetarianas, veganas y halal?",
      a: "Sí. Tenemos amplia carta vegetariana y vegana (hummus, falafel, tabbouleh, baba ghanoush, fatayer, meze) y nuestra carne es halal.",
    },
    {
      q: "¿Puedo reservar mesa online en Casa Fenicia?",
      a: "Sí, puedes reservar directamente en casafenicia.com/es/reservar. La confirmación llega en menos de 24 horas.",
    },
    {
      q: "¿Hacéis comida para llevar y delivery a domicilio?",
      a: "Sí. Pedidos para recoger con pago online en casafenicia.com/es/pedir, y delivery a domicilio en Valencia a través de Glovo.",
    },
  ],
  en: [
    {
      q: "Where is Casa Fenicia Lebanese restaurant in Valencia?",
      a: "Casa Fenicia is at C/ de la Corretgeria, 4, Ciutat Vella, 46001 Valencia – a short walk from Plaza de la Reina and the Cathedral.",
    },
    {
      q: "What are Casa Fenicia's opening hours?",
      a: "We open every day, Monday to Sunday, from 9:00 to 22:00.",
    },
    {
      q: "What kind of cuisine does Casa Fenicia serve?",
      a: "Authentic Lebanese and Mediterranean cuisine: hummus, falafel, shawarma, kibbeh, tabbouleh, baklava, knafeh and more, made with fresh ingredients daily.",
    },
    {
      q: "Do you have vegetarian, vegan and halal options?",
      a: "Yes – wide vegetarian and vegan menu (hummus, falafel, tabbouleh, baba ghanoush, fatayer, meze) and our meat is halal.",
    },
    {
      q: "Can I book a table online at Casa Fenicia?",
      a: "Yes, book directly at casafenicia.com/en/reserve. We confirm within 24 hours.",
    },
    {
      q: "Do you offer takeaway and home delivery?",
      a: "Yes – pickup with online payment at casafenicia.com/en/order, and home delivery in Valencia via Glovo.",
    },
  ],
  ar: [
    {
      q: "أين يقع مطعم كازا فينيسيا اللبناني في فالنسيا؟",
      a: "كازا فينيسيا في C/ de la Corretgeria, 4, Ciutat Vella, 46001 فالنسيا، على بُعد دقائق من ساحة الملكة والكاتدرائية.",
    },
    {
      q: "ما هي ساعات عمل كازا فينيسيا؟",
      a: "نفتح كل يوم، من الإثنين إلى الأحد، من الساعة 9:00 صباحاً حتى 10:00 مساءً.",
    },
    {
      q: "ما نوع المطبخ الذي يقدمه كازا فينيسيا؟",
      a: "مطبخ لبناني ومتوسطي أصيل: حمص، فلافل، شاورما، كبة، تبولة، بقلاوة، كنافة والمزيد، بمكونات طازجة يومياً.",
    },
    {
      q: "هل لديكم خيارات نباتية وحلال؟",
      a: "نعم، قائمة نباتية واسعة (حمص، فلافل، تبولة، بابا غنوج، فطاير، ميزة) واللحوم لدينا حلال.",
    },
    {
      q: "هل يمكنني حجز طاولة عبر الإنترنت؟",
      a: "نعم، احجز مباشرة على casafenicia.com/ar/reservar. التأكيد خلال 24 ساعة.",
    },
    {
      q: "هل تقدمون التوصيل والاستلام؟",
      a: "نعم، طلبات استلام مع دفع إلكتروني على casafenicia.com/ar/pedir، والتوصيل المنزلي في فالنسيا عبر Glovo.",
    },
  ],
  de: [
    {
      q: "Wo befindet sich das libanesische Restaurant Casa Fenicia in Valencia?",
      a: "Casa Fenicia befindet sich in der C/ de la Corretgeria, 4, Ciutat Vella, 46001 Valencia – nur wenige Gehminuten von der Plaza de la Reina und der Kathedrale entfernt.",
    },
    {
      q: "Was sind die Öffnungszeiten von Casa Fenicia?",
      a: "Wir haben täglich geöffnet, Montag bis Sonntag, von 9:00 bis 22:00 Uhr.",
    },
    {
      q: "Welche Küche bietet Casa Fenicia?",
      a: "Authentische libanesische und mediterrane Küche: Hummus, Falafel, Shawarma, Kibbeh, Tabbouleh, Baklava, Knafeh und mehr – täglich mit frischen Zutaten zubereitet.",
    },
    {
      q: "Gibt es vegetarische, vegane und Halal-Optionen?",
      a: "Ja – eine große vegetarische und vegane Auswahl (Hummus, Falafel, Tabbouleh, Baba Ghanoush, Fatayer, Meze) und unser Fleisch ist Halal.",
    },
    {
      q: "Kann ich online einen Tisch bei Casa Fenicia reservieren?",
      a: "Ja, buchen Sie direkt unter casafenicia.com/de/reserve. Wir bestätigen innerhalb von 24 Stunden.",
    },
    {
      q: "Bieten Sie Takeaway und Lieferung an?",
      a: "Ja – Abholung mit Online-Zahlung unter casafenicia.com/de/order und Lieferung in Valencia über Glovo.",
    },
  ],
};

export function getFaqs(locale: string): FaqEntry[] {
  return FAQS[locale] ?? FAQS.es;
}
