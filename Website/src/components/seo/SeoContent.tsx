/**
 * Screen-reader-only SEO content block.
 *
 * Visible to screen readers (legitimate accessibility tool) and
 * fully indexable by search engines and LLM crawlers (Googlebot,
 * Bingbot, GPTBot, ClaudeBot, PerplexityBot, etc.).
 *
 * NOT cloaked: same content is delivered to all user-agents,
 * just visually hidden using the standard `sr-only` pattern
 * recommended by W3C WAI.
 */

const COPY: Record<string, { title: string; paragraphs: string[]; list: string[] }> = {
  es: {
    title: "Casa Fenicia – Restaurante Libanés en Valencia",
    paragraphs: [
      "Casa Fenicia es el mejor restaurante libanés en Valencia, situado en C/ de la Corretgeria 4, en pleno casco antiguo de Ciutat Vella. Servimos comida libanesa auténtica y cocina mediterránea de alta calidad, todos los días de 9:00 a 22:00.",
      "Nuestra carta de bistro libanés incluye los platos más populares del Líbano: hummus cremoso, falafel crujiente, shawarma de pollo y de ternera, kibbeh tradicional, sfiha, fatayer de espinacas, tabbouleh, baba ghanoush, kafta a la brasa, pollo libanés, y postres clásicos como baklava de pistacho, knafeh con sirope de azahar, helado de almendra y mamoul.",
      "Casa Fenicia es perfecto si buscas comida libanesa cerca de mí, restaurante árabe en Valencia, restaurante halal en Valencia, opciones vegetarianas y veganas mediterráneas, o el mejor lugar para hummus y shawarma en Valencia centro. También somos el bistro libanés ideal para cenas en pareja, comidas de empresa, eventos pequeños y reuniones familiares.",
      "Ofrecemos reservas online en tiempo real, comida para recoger con pago online, y delivery a domicilio en Valencia a través de Glovo. Aceptamos tarjeta, efectivo y pago digital. Servimos café árabe, té de menta, ayran, limonada con menta y selección de bebidas tradicionales del Líbano.",
      "Estamos a 3 minutos a pie de la Plaza de la Reina, la Catedral de Valencia, la Plaza Redonda y el Mercado Central. Próximos a la zona del Carmen y El Mercado. Si buscas un libanés Valencia centro, libanon bistro Valencia, libanon food Valencia, restaurante mediterráneo Valencia o comida del Oriente Medio en Valencia, Casa Fenicia es tu sitio.",
    ],
    list: [
      "Restaurante libanés Valencia",
      "Comida libanesa Valencia",
      "Bistro libanés Valencia",
      "Hummus Valencia",
      "Shawarma Valencia",
      "Falafel Valencia",
      "Kibbeh Valencia",
      "Baklava Valencia",
      "Knafeh Valencia",
      "Restaurante árabe Valencia",
      "Restaurante halal Valencia",
      "Comida mediterránea Valencia",
      "Restaurante Ciutat Vella",
      "Restaurante centro Valencia",
      "Casa Fenicia Valencia",
      "Mejor libanés Valencia",
      "Comida libanesa para llevar Valencia",
      "Comida libanesa a domicilio Valencia",
      "Restaurante vegano libanés Valencia",
      "Restaurante vegetariano Valencia",
      "Café árabe Valencia",
      "Té de menta Valencia",
      "Libanon bistro Valencia",
      "Libanon food Valencia",
    ],
  },
  en: {
    title: "Casa Fenicia – Lebanese Restaurant in Valencia, Spain",
    paragraphs: [
      "Casa Fenicia is the best Lebanese restaurant in Valencia, located at C/ de la Corretgeria 4 in the historic Ciutat Vella old town. We serve authentic Lebanese food and high-quality Mediterranean cuisine every day from 9:00 to 22:00.",
      "Our Lebanese bistro menu features the most popular dishes from Lebanon: creamy hummus, crispy falafel, chicken and beef shawarma, traditional kibbeh, sfiha, spinach fatayer, tabbouleh, baba ghanoush, grilled kafta, Lebanese chicken, and classic desserts like pistachio baklava, knafeh with orange-blossom syrup, almond ice cream and mamoul.",
      "Casa Fenicia is perfect if you're searching for Lebanese food near me, Arab restaurant in Valencia, halal restaurant Valencia, vegetarian and vegan Mediterranean options, or the best place for hummus and shawarma in Valencia city centre. We're also an ideal Lebanese bistro for date nights, business lunches, small events and family gatherings.",
      "We offer real-time online reservations, pickup orders with online payment, and home delivery in Valencia via Glovo. We accept card, cash and digital payments. We serve Arabic coffee, mint tea, ayran, mint lemonade and a selection of traditional Lebanese beverages.",
      "We are a 3-minute walk from Plaza de la Reina, Valencia Cathedral, Plaza Redonda and the Central Market – close to the Carmen and El Mercado neighbourhoods. If you're looking for a Lebanese Valencia city-centre spot, Lebanon bistro Valencia, Lebanon food Valencia, Mediterranean restaurant Valencia or Middle Eastern food in Valencia, Casa Fenicia is the place.",
    ],
    list: [
      "Lebanese restaurant Valencia",
      "Lebanese food Valencia",
      "Lebanese bistro Valencia",
      "Hummus Valencia",
      "Shawarma Valencia",
      "Falafel Valencia",
      "Kibbeh Valencia",
      "Baklava Valencia",
      "Knafeh Valencia",
      "Arab restaurant Valencia",
      "Halal restaurant Valencia",
      "Mediterranean restaurant Valencia",
      "Ciutat Vella restaurant",
      "Valencia city centre restaurant",
      "Casa Fenicia Valencia",
      "Best Lebanese Valencia",
      "Lebanese takeaway Valencia",
      "Lebanese delivery Valencia",
      "Vegan Lebanese Valencia",
      "Vegetarian restaurant Valencia",
      "Arabic coffee Valencia",
      "Mint tea Valencia",
      "Lebanon bistro Valencia",
      "Lebanon food Valencia",
      "Middle Eastern restaurant Valencia",
    ],
  },
  ar: {
    title: "كازا فينيسيا – مطعم لبناني في فالنسيا، إسبانيا",
    paragraphs: [
      "كازا فينيسيا هو أفضل مطعم لبناني في فالنسيا، يقع في C/ de la Corretgeria 4 في حي سيوتات بيلا التاريخي. نقدم طعاماً لبنانياً أصيلاً ومطبخاً متوسطياً عالي الجودة كل يوم من الساعة 9:00 صباحاً حتى 10:00 مساءً.",
      "تشمل قائمة بيسترو لبناني لدينا أشهر أطباق لبنان: حمص كريمي، فلافل مقرمش، شاورما دجاج ولحم بقر، كبة تقليدية، صفيحة، فطاير سبانخ، تبولة، بابا غنوج، كفتة مشوية، ودجاج لبناني، وحلويات كلاسيكية مثل بقلاوة بالفستق، كنافة بشراب الزهر، آيس كريم باللوز ومعمول.",
      "كازا فينيسيا مثالي إذا كنت تبحث عن طعام لبناني قريب مني، مطعم عربي في فالنسيا، مطعم حلال في فالنسيا، خيارات نباتية متوسطية، أو أفضل مكان للحمص والشاورما في وسط فالنسيا.",
      "نقدم حجوزات إلكترونية فورية، طلبات استلام مع دفع إلكتروني، وتوصيل منزلي في فالنسيا عبر Glovo. نقبل البطاقات والنقد والدفع الرقمي. نقدم القهوة العربية، شاي النعناع، اللبن (الأيران)، عصير الليمون بالنعناع وتشكيلة من المشروبات اللبنانية التقليدية.",
    ],
    list: [
      "مطعم لبناني فالنسيا",
      "طعام لبناني فالنسيا",
      "بيسترو لبناني فالنسيا",
      "حمص فالنسيا",
      "شاورما فالنسيا",
      "فلافل فالنسيا",
      "كبة فالنسيا",
      "بقلاوة فالنسيا",
      "كنافة فالنسيا",
      "مطعم عربي فالنسيا",
      "مطعم حلال فالنسيا",
      "كازا فينيسيا",
      "مطعم لبناني وسط فالنسيا",
    ],
  },
  de: {
    title: "Casa Fenicia – Libanesisches Restaurant in Valencia, Spanien",
    paragraphs: [
      "Casa Fenicia ist das beste libanesische Restaurant in Valencia, in der C/ de la Corretgeria 4 in der historischen Altstadt Ciutat Vella. Wir servieren authentisches libanesisches Essen und hochwertige mediterrane Küche täglich von 9:00 bis 22:00 Uhr.",
      "Unsere libanesische Bistro-Speisekarte bietet die beliebtesten Gerichte aus dem Libanon: cremiger Hummus, knuspriger Falafel, Hähnchen- und Rindfleisch-Shawarma, traditioneller Kibbeh, Sfiha, Spinat-Fatayer, Tabbouleh, Baba Ghanoush, gegrillte Kafta, libanesisches Hähnchen und klassische Desserts wie Pistazien-Baklava, Knafeh mit Orangenblütensirup, Mandeleis und Mamoul.",
      "Casa Fenicia ist perfekt, wenn Sie libanesisches Essen in der Nähe, ein arabisches Restaurant in Valencia, ein Halal-Restaurant in Valencia oder vegetarische und vegane mediterrane Optionen suchen – oder den besten Ort für Hummus und Shawarma in Valencia Zentrum.",
      "Wir bieten Echtzeit-Online-Reservierungen, Abholbestellungen mit Online-Zahlung und Lieferung in Valencia über Glovo. Wir akzeptieren Karte, Bargeld und digitale Zahlungen. Wir servieren arabischen Kaffee, Minztee, Ayran, Minzlimonade und eine Auswahl traditioneller libanesischer Getränke.",
      "Wir sind 3 Gehminuten von der Plaza de la Reina, der Kathedrale von Valencia, der Plaza Redonda und dem Mercado Central entfernt – nahe den Vierteln Carmen und El Mercado. Wenn Sie ein libanesisches Restaurant in Valencia Zentrum, libanesisches Bistro oder mediterranes Restaurant suchen, ist Casa Fenicia der richtige Ort.",
    ],
    list: [
      "Libanesisches Restaurant Valencia",
      "Libanesisches Essen Valencia",
      "Libanesisches Bistro Valencia",
      "Hummus Valencia",
      "Shawarma Valencia",
      "Falafel Valencia",
      "Kibbeh Valencia",
      "Baklava Valencia",
      "Knafeh Valencia",
      "Arabisches Restaurant Valencia",
      "Halal Restaurant Valencia",
      "Mediterranes Restaurant Valencia",
      "Restaurant Ciutat Vella",
      "Restaurant Valencia Zentrum",
      "Casa Fenicia Valencia",
      "Bestes libanesisches Restaurant Valencia",
      "Libanesisches Takeaway Valencia",
      "Libanesische Lieferung Valencia",
      "Veganes libanesisches Restaurant Valencia",
      "Vegetarisches Restaurant Valencia",
      "Arabischer Kaffee Valencia",
      "Minztee Valencia",
      "Libanon Bistro Valencia",
      "Nahost-Restaurant Valencia",
    ],
  },
};

export default function SeoContent({ locale }: { locale: string }) {
  const copy = COPY[locale] ?? COPY.es;

  return (
    <section className="sr-only" aria-label="About Casa Fenicia – Lebanese Bistro & Café Valencia">
      <h2>{copy.title}</h2>
      {copy.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <h3>Casa Fenicia – {locale === "ar" ? "كلمات مفتاحية" : locale === "en" ? "Topics & specialities" : locale === "de" ? "Themen & Spezialitäten" : "Especialidades y temas"}</h3>
      <ul>
        {copy.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        {locale === "es" &&
          "Casa Fenicia, restaurante libanés en Valencia (Ciutat Vella, C/ de la Corretgeria 4, 46001). Teléfono: +34 600 345 055. Email: info@casafenicia.com. Horario: todos los días 9:00 – 22:00. Reservas: casafenicia.com/es/reservar"}
        {locale === "en" &&
          "Casa Fenicia, Lebanese restaurant in Valencia (Ciutat Vella, C/ de la Corretgeria 4, 46001). Phone: +34 600 345 055. Email: info@casafenicia.com. Hours: every day 9:00 – 22:00. Reservations: casafenicia.com/en/reserve"}
        {locale === "ar" &&
          "كازا فينيسيا، مطعم لبناني في فالنسيا (سيوتات بيلا، C/ de la Corretgeria 4, 46001). الهاتف: +34 600 345 055. البريد: info@casafenicia.com. ساعات العمل: كل يوم 9:00 – 22:00. الحجوزات: casafenicia.com/ar/reservar"}
        {locale === "de" &&
          "Casa Fenicia, libanesisches Restaurant in Valencia (Ciutat Vella, C/ de la Corretgeria 4, 46001). Telefon: +34 600 345 055. E-Mail: info@casafenicia.com. Öffnungszeiten: täglich 9:00 – 22:00. Reservierungen: casafenicia.com/de/reserve"}
      </p>
    </section>
  );
}
