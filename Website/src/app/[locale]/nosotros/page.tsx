import { getLocale } from "next-intl/server";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import AboutPhotoGallery from "@/components/public/AboutPhotoGallery";
import Image from "next/image";
import PageReveal from "@/components/ui/PageReveal";
import { Leaf, Heart, Clock, MapPin } from "lucide-react";
import { tx } from "@/lib/tx";
import { getSiteImages } from "@/lib/siteImages";
import type { Metadata } from "next";

function aboutGalleryPhotos(locale: string) {
  return [
    {
      src: "/images/about/team-storefront.png",
      alt: tx(
        locale,
        "Equipo de Casa Fenicia en la entrada del bistró",
        "Casa Fenicia team at the bistro entrance",
        "فريق كازا فينيسيا عند مدخل البيسترو",
        "Casa-Fenicia-Team am Bistró-Eingang"
      ),
    },
    {
      src: "/images/about/pistachio-drinks.png",
      alt: tx(
        locale,
        "Bebidas de pistacho con nata montada",
        "Pistachio drinks topped with whipped cream",
        "مشروبات الفستق مع الكريمة المخفوقة",
        "Pistaziengetränke mit Schlagsahne"
      ),
    },
    {
      src: "/images/about/pastries-plate.png",
      alt: tx(
        locale,
        "Selección de baklava y dulces libaneses",
        "Selection of baklava and Lebanese pastries",
        "تشكيلة من البقلاوة والحلويات اللبنانية",
        "Auswahl an Baklava und libanesischen Süßigkeiten"
      ),
    },
    {
      src: "/images/about/cocktail-garnish.png",
      alt: tx(
        locale,
        "Preparación de un cóctel de cítricos",
        "Preparing a citrus cocktail",
        "تحضير كوكتيل حمضيات",
        "Zubereitung eines Zitruscocktails"
      ),
    },
  ];
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: tx(
      locale,
      "Nosotros – Casa Fenicia Valencia",
      "About Us – Casa Fenicia Valencia",
      "من نحن – كازا فينيسيا فالنسيا",
      "Über uns – Casa Fenicia Valencia"
    ),
    description: tx(
      locale,
      "Conoce la historia de Casa Fenicia, bistró libanés en Valencia. Nuestra pasión por la cocina mediterránea y los sabores del Líbano.",
      "Learn about Casa Fenicia, Lebanese bistro in Valencia. Our passion for Mediterranean cuisine and the flavours of Lebanon.",
      "تعرّف على قصة كازا فينيسيا، بيسترو لبناني في فالنسيا. شغفنا بالمطبخ المتوسطي ونكهات لبنان.",
      "Erfahren Sie mehr über Casa Fenicia, libanesisches Bistró in Valencia. Unsere Leidenschaft für mediterrane Küche und die Aromen des Libanon."
    ),
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const siteImages = await getSiteImages();

  return (
    <>
      <Navbar logoUrl={siteImages.logo} />
      <PageReveal><main className="pt-20 min-h-screen bg-[var(--cream)]">
        {/* Hero */}
        <section className="bg-[#0C0900] text-[var(--sand)] py-24 relative overflow-hidden" style={{ borderBottom: "1px solid #1E1800" }}>
          <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[var(--terracotta)]" />
              <span className="font-body text-xs tracking-widest text-[var(--terracotta)] uppercase">
                {tx(locale, "Nuestra historia", "Our story", "قصتنا", "Unsere Geschichte")}
              </span>
              <span className="w-8 h-px bg-[var(--terracotta)]" />
            </div>
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-white mb-6">
              {tx(
                locale,
                "Del Líbano a Valencia, con amor",
                "From Lebanon to Valencia, with love",
                "من لبنان إلى فالنسيا، بكل حب",
                "Vom Libanon nach Valencia, mit Liebe"
              )}
            </h1>
            <p className="font-body text-[var(--sand)]/80 text-lg leading-relaxed max-w-2xl mx-auto">
              {tx(
                locale,
                "Casa Fenicia nació de un sueño: traer los sabores auténticos del Líbano al corazón de la Comunitat Valenciana.",
                "Casa Fenicia was born from a dream: to bring the authentic flavours of Lebanon to the heart of the Valencian Community.",
                "وُلد كازا فينيسيا من حلم: تقديم نكهات لبنان الأصيلة في قلب مجتمع فالنسيا.",
                "Casa Fenicia entstand aus einem Traum: die authentischen Aromen des Libanon ins Herz der Valencianischen Gemeinschaft zu bringen."
              )}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={siteImages.about}
                  alt={tx(
                    locale,
                    "Casa Fenicia fachada Valencia tarde",
                    "Casa Fenicia storefront Valencia evening",
                    "واجهة كازا فينيسيا فالنسيا مساءً",
                    "Casa Fenicia Fassade Valencia am Abend"
                  )}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 448px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
              <div>
                <h2 className="font-display text-4xl text-[var(--espresso)] mb-5">
                  {tx(
                    locale,
                    "Nuestra cocina es nuestra identidad",
                    "Our kitchen is our identity",
                    "مطبخنا هو هويتنا",
                    "Unsere Küche ist unsere Identität"
                  )}
                </h2>
                <p className="font-body text-[var(--olive)] leading-relaxed mb-4">
                  {tx(
                    locale,
                    "En Casa Fenicia, cada plato es una historia. Elaboramos nuestras recetas con ingredientes frescos, seleccionados diariamente, siguiendo las tradiciones culinarias del Líbano que se han transmitido de generación en generación.",
                    "At Casa Fenicia, every dish tells a story. We craft our recipes with fresh ingredients, selected daily, following Lebanese culinary traditions passed down through generations.",
                    "في كازا فينيسيا، كل طبق يحكي قصة. نحضّر وصفاتنا بمكونات طازجة تُختار يومياً، متبعين التقاليد الطهوية اللبنانية التي تتوارثها الأجيال.",
                    "Bei Casa Fenicia erzählt jedes Gericht eine Geschichte. Wir bereiten unsere Rezepte mit frischen, täglich ausgewählten Zutaten zu – nach libanesischen Kochtraditionen, die von Generation zu Generation weitergegeben werden."
                  )}
                </p>
                <p className="font-body text-[var(--olive)] leading-relaxed mb-4">
                  {tx(
                    locale,
                    "Desde el hummus cremoso hasta el shawarma perfectamente especiado, pasando por el falafel crujiente y los postres tradicionales, nuestra carta refleja la riqueza de la gastronomía libanesa.",
                    "From creamy hummus to perfectly spiced shawarma, crispy falafel and traditional desserts, our menu reflects the richness of Lebanese gastronomy.",
                    "من الحمص الكريمي إلى الشاورما المتبّلة بإتقان، مروراً بالفلافل المقرمش والحلويات التقليدية، تعكس قائمتنا ثراء المطبخ اللبناني.",
                    "Vom cremigen Hummus über perfekt gewürztes Shawarma bis hin zu knusprigem Falafel und traditionellen Desserts – unsere Speisekarte spiegelt die Vielfalt der libanesischen Gastronomie wider."
                  )}
                </p>
                <p className="font-body text-[var(--olive)] leading-relaxed">
                  {tx(
                    locale,
                    "Ubicados en el corazón de Ciutat Vella, en la icónica Calle de la Corretgeria, somos un punto de encuentro para quienes buscan autenticidad, calidad y una experiencia gastronómica memorable.",
                    "Located in the heart of Ciutat Vella, on the iconic Calle de la Corretgeria, we are a meeting place for those seeking authenticity, quality and a memorable gastronomic experience.",
                    "نقع في قلب سيوتات بيلا، في شارع كوريتخيريا الشهير، ونُعدّ نقطة لقاء لمن يبحث عن الأصالة والجودة وتجربة طعام لا تُنسى.",
                    "Im Herzen von Ciutat Vella, in der ikonischen Calle de la Corretgeria, sind wir ein Treffpunkt für alle, die Authentizität, Qualität und ein unvergessliches kulinarisches Erlebnis suchen."
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Photo gallery */}
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <AboutPhotoGallery photos={aboutGalleryPhotos(locale)} />
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-[#0E0B00]" style={{ borderTop: "1px solid #1E1800" }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl text-[var(--espresso)] text-center mb-12">
              {tx(locale, "Lo que nos define", "What defines us", "ما يميّزنا", "Was uns ausmacht")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Leaf,
                  title: tx(locale, "Ingredientes frescos", "Fresh ingredients", "مكونات طازجة", "Frische Zutaten"),
                  text: tx(
                    locale,
                    "Seleccionamos los mejores ingredientes cada día para garantizar la máxima frescura.",
                    "We select the finest ingredients daily to guarantee maximum freshness.",
                    "نختار أفضل المكونات يومياً لضمان أقصى درجات الطزاجة.",
                    "Wir wählen täglich die besten Zutaten aus, um maximale Frische zu garantieren."
                  ),
                },
                {
                  icon: Heart,
                  title: tx(locale, "Hecho con amor", "Made with love", "صُنع بحب", "Mit Liebe gemacht"),
                  text: tx(
                    locale,
                    "Cada plato se elabora con la misma pasión y cuidado de siempre.",
                    "Every dish is crafted with the same passion and care as always.",
                    "كل طبق يُحضَّر بنفس الشغف والعناية الدائمين.",
                    "Jedes Gericht wird mit derselben Leidenschaft und Sorgfalt wie immer zubereitet."
                  ),
                },
                {
                  icon: Clock,
                  title: tx(locale, "Siempre disponibles", "Always available", "متواجدون دائماً", "Immer für Sie da"),
                  text: tx(
                    locale,
                    "Abrimos todos los días de 9 a 22h para servirte cuando lo necesites.",
                    "Open every day from 9 to 22h to serve you whenever you need.",
                    "نفتح كل يوم من 9 صباحاً حتى 10 مساءً لخدمتك متى احتجت.",
                    "Wir haben täglich von 9 bis 22 Uhr geöffnet – für Sie da, wann immer Sie uns brauchen."
                  ),
                },
                {
                  icon: MapPin,
                  title: tx(locale, "Corazón de Valencia", "Heart of Valencia", "قلب فالنسيا", "Im Herzen von Valencia"),
                  text: tx(
                    locale,
                    "Ubicados en Ciutat Vella, en el centro histórico de Valencia.",
                    "Located in Ciutat Vella, in the historic centre of Valencia.",
                    "نقع في سيوتات بيلا، في المركز التاريخي لفالنسيا.",
                    "In Ciutat Vella, im historischen Zentrum von Valencia."
                  ),
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="card-warm rounded-xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center mx-auto mb-4">
                    <Icon size={22} className="text-[var(--terracotta)]" />
                  </div>
                  <h3 className="font-display text-lg text-[var(--espresso)] mb-2">{title}</h3>
                  <p className="font-body text-sm text-[var(--olive)] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main></PageReveal>
      <Footer logoUrl={siteImages.logo} />
    </>
  );
}
