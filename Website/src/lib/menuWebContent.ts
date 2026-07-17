/**
 * Website-only enrichments keyed by normalized Spanish product name.
 * POS sync never overwrites these when already set; restore script fills gaps.
 */

export type MenuWebEnrichment = {
  imageUrl?: string;
  nameAr?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  isFeatured?: boolean;
  allergens?: string[];
};

export function normalizeMenuName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Match menu item name to a food photo in /public/ai-images */
export function resolveMenuImageUrl(nameEs: string): string | null {
  const n = normalizeMenuName(nameEs);

  const rules: Array<[RegExp, string]> = [
    [/falafel/, "/ai-images/falafel.jpg"],
    [/hummus.*pollo|pollo.*hummus/, "/ai-images/r14-hummus-real.jpg"],
    [/hummus.*carne|carne.*hummus/, "/ai-images/r14-hummus-real.jpg"],
    [/hummus/, "/ai-images/hummus-clasico.jpg"],
    [/shawarma.*pollo|pollo.*shawarma/, "/ai-images/shawarma-de-pollo.jpg"],
    [/shawarma.*(carne|ternera)/, "/ai-images/shawarma-de-ternera.jpg"],
    [/kibbeh|kibe/, "/ai-images/kibbeh.jpg"],
    [/knafeh|kunafa/, "/ai-images/knafeh.jpg"],
    [/baklava.*pistacho|pistacho.*baklava/, "/ai-images/baklava.jpg"],
    [/baklava/, "/ai-images/13-baklava-classic.jpg"],
    [/tabbouleh|tabule/, "/ai-images/tabbouleh.jpg"],
    [/fatayer.*espinaca|espinaca.*fatayer/, "/ai-images/fatayer-espinacas.jpg"],
    [/sfiha/, "/ai-images/sfiha.jpg"],
    [/manakish/, "/ai-images/05-sfiha-closeup.jpg"],
    [/kafta|arayes/, "/ai-images/kafta.jpg"],
    [/baba.?ghanoush/, "/ai-images/baba-ghanoush.jpg"],
    [/limonada fenicia|lemonade fenicia/, "/ai-images/te-de-menta.jpg"],
    [/helado.*kashta|kashta/, "/ai-images/r05-icecream-storefront.jpg"],
    [/(cafe|café) (espresso|solo|libanes|cremaet|cortado|helado|con leche)/, "/ai-images/cafe-arabe.jpg"],
    [/cortado|espresso|affogato|freddo|latte|matcha|mocha|macchiato|iced/, "/ai-images/cafe-arabe.jpg"],
    [/cerveza|vermouth|aperol|gin tonic|caipiroska|rum cola|agua de valencia/, "/ai-images/te-de-menta.jpg"],
    [/coctel.*aguacate|coctel.*nashi|coctel.*frutas/, "/ai-images/te-de-menta.jpg"],
    [/refresco|agua/, "/ai-images/te-de-menta.jpg"],
  ];

  for (const [pattern, url] of rules) {
    if (pattern.test(n)) return url;
  }

  return null;
}

/** Known copy from the original Casa Fenicia menu (seed-menu-from-excel). */
export const MENU_WEB_ENRICHMENTS: Record<string, MenuWebEnrichment> = {
  "cafe espresso": { nameAr: "إسبريسو" },
  "cafe cortado": { nameAr: "كورتادو" },
  "cafe cremaet": {
    nameAr: "كريمت",
    descriptionEs: "Especialidad valenciana con ron y canela",
    descriptionEn: "Valencian specialty with rum and cinnamon",
    descriptionAr: "تخصص فالنسياني بالروم والقرفة",
  },
  "cafe helado": { nameAr: "قهوة مثلجة" },
  sfiha: {
    nameAr: "صفيحة",
    descriptionEs: "Miniempanada libanesa de carne especiada",
    descriptionEn: "Lebanese mini meat pie with spiced filling",
    descriptionAr: "فطيرة لبنانية صغيرة محشوة باللحم المتبَّل",
  },
  "fatayer de espinaca": {
    nameAr: "فطاير السبانخ",
    descriptionEs: "Triángulo de hojaldre relleno de espinacas y limón",
    descriptionEn: "Pastry triangle filled with spinach and lemon",
    descriptionAr: "مثلثات عجين محشوة بالسبانخ والليمون",
  },
  kibbeh: {
    nameAr: "كبة",
    descriptionEs: "Croqueta de cordero con bulgur y especias",
    descriptionEn: "Lamb croquette with bulgur and spices",
    descriptionAr: "كرات لحم الضأن بالبرغل والبهارات",
    allergens: ["Gluten"],
    isFeatured: true,
  },
  "mini manakish": {
    nameAr: "مناقيش صغيرة",
    descriptionEs: "Zaatar / Queso",
    descriptionEn: "Za'atar / Cheese",
    descriptionAr: "زعتر / جبنة",
    allergens: ["Gluten", "Lácteos"],
  },
  falafel: {
    nameAr: "فلافل",
    descriptionEs: "Croquetas de garbanzo crujientes con salsa tahini",
    descriptionEn: "Crispy chickpea fritters with tahini sauce",
    descriptionAr: "أقراص الحمص المقرمشة مع صلصة الطحينة",
    isFeatured: true,
    allergens: ["Sésamo"],
  },
  hummus: {
    nameAr: "حمص",
    descriptionEs: "Crema de garbanzos con aceite de oliva y pimentón",
    descriptionEn: "Chickpea cream with olive oil and smoked paprika",
    descriptionAr: "كريمة الحمص بزيت الزيتون والفلفل الأحمر",
    isFeatured: true,
    allergens: ["Sésamo"],
  },
  "shawarma de pollo": {
    nameAr: "شاورما دجاج",
    descriptionEs: "Plato principal con pollo marinado y guarnición",
    descriptionEn: "Main dish with marinated chicken and sides",
    descriptionAr: "طبق رئيسي مع دجاج متبَّل وطرق جانبية",
    isFeatured: true,
    allergens: ["Gluten"],
  },
  "shawarma de carne": {
    nameAr: "شاورما لحم",
    descriptionEs: "Plato principal con carne de ternera especiada",
    descriptionEn: "Main dish with spiced beef",
    descriptionAr: "طبق رئيسي مع لحم بقري متبَّل",
    isFeatured: true,
    allergens: ["Gluten"],
  },
  "hummus con pollo": {
    nameAr: "حمص بالدجاج",
    descriptionEs: "Hummus casero cubierto de pollo a la plancha",
    descriptionEn: "House hummus topped with grilled chicken",
    descriptionAr: "حمص بيتي بالدجاج المشوي",
    allergens: ["Sésamo"],
  },
  "hummus con carne": {
    nameAr: "حمص باللحم",
    descriptionEs: "Hummus casero cubierto de carne picada especiada",
    descriptionEn: "House hummus topped with spiced minced meat",
    descriptionAr: "حمص بيتي باللحم المفروم المتبَّل",
    allergens: ["Sésamo"],
  },
  "baklava clasico": {
    nameAr: "بقلاوة كلاسيك",
    descriptionEs: "Hojaldre con nueces y miel de naranja",
    descriptionEn: "Filo pastry with walnuts and orange blossom honey",
    descriptionAr: "عجين فيلو بالجوز وعسل زهر البرتقال",
    allergens: ["Gluten", "Frutos secos"],
  },
  "baklava de pistacho": {
    nameAr: "بقلاوة فستق",
    descriptionEs: "Hojaldre con pistacho y almíbar de agua de rosas",
    descriptionEn: "Filo pastry with pistachio and rose water syrup",
    descriptionAr: "عجين فيلو بالفستق وشراب ماء الورد",
    allergens: ["Gluten", "Frutos secos"],
  },
  knafeh: {
    nameAr: "كنافة",
    descriptionEs: "Pastel de queso con kataifi, almíbar y pistacho",
    descriptionEn: "Cheese pastry with kataifi, syrup and pistachio",
    descriptionAr: "حلوى الجبن بالقطايف والشيرة والفستق",
    isFeatured: true,
    allergens: ["Gluten", "Lácteos", "Frutos secos"],
  },
  "helado de kashta": {
    nameAr: "بوظة قشطة",
    descriptionEs: "Helado artesanal de crema de leche libanesa",
    descriptionEn: "Artisan Lebanese clotted cream ice cream",
    descriptionAr: "بوظة قشطة لبنانية بلدية",
    allergens: ["Lácteos"],
  },
  "baklava con helado de kashta": {
    nameAr: "بقلاوة مع بوظة قشطة",
    descriptionEs: "La combinación perfecta: baklava crujiente y helado frío",
    descriptionEn: "The perfect pairing: crispy baklava and cold ice cream",
    descriptionAr: "الثنائي المثالي: بقلاوة مقرمشة مع بوظة باردة",
    isFeatured: true,
    allergens: ["Gluten", "Lácteos", "Frutos secos"],
  },
  "limonada fenicia": {
    nameAr: "ليموناضة فينيسيا",
    descriptionEs: "Con menta fresca y agua de azahar",
    descriptionEn: "With fresh mint and orange blossom water",
    descriptionAr: "بالنعناع الطازج وماء زهر البرتقال",
    isFeatured: true,
  },
  tabbouleh: {
    nameAr: "تبولة",
    descriptionEs: "Ensalada de perejil fresco, tomate, bulgur, limón y aceite de oliva",
    descriptionEn: "Fresh parsley salad with tomato, bulgur, lemon and olive oil",
    descriptionAr: "سلطة بقدونس طازج مع البندورة والبرغل والليمون وزيت الزيتون",
    allergens: ["Gluten"],
  },
  bocadillo: {
    descriptionEs: "Bocadillo recién preparado con ingredientes de calidad",
    descriptionEn: "Freshly prepared sandwich with quality ingredients",
    imageUrl: "/ai-images/r10-wraps-hands-square.jpg",
  },
  brownie: {
    descriptionEs: "Brownie de chocolate intenso, servido en el local",
    descriptionEn: "Rich chocolate brownie, served in-house",
    imageUrl: "/ai-images/13-baklava-classic.jpg",
  },
  "tarta de queso": {
    descriptionEs: "Tarta de queso cremosa, elaborada en casa",
    descriptionEn: "Creamy homemade cheesecake",
    imageUrl: "/ai-images/knafeh.jpg",
  },
  tostada: {
    descriptionEs: "Tostada crujiente, ideal para acompañar tu café",
    descriptionEn: "Crispy toast, perfect with your coffee",
    imageUrl: "/ai-images/cafe-arabe.jpg",
  },
  "cafe afogatto": {
    descriptionEs: "Helado de vainilla cubierto con espresso recién preparado",
    descriptionEn: "Vanilla ice cream topped with freshly pulled espresso",
    imageUrl: "/ai-images/cafe-arabe.jpg",
  },
  cortado: {
    descriptionEs: "Espresso con una suave capa de leche vaporizada",
    descriptionEn: "Espresso with a touch of steamed milk",
    imageUrl: "/ai-images/cafe-arabe.jpg",
  },
  "cafe solo": {
    descriptionEs: "Espresso intenso y aromático, servido al momento",
    descriptionEn: "Intense aromatic espresso, served fresh",
    imageUrl: "/ai-images/cafe-arabe.jpg",
  },
};

export function lookupWebEnrichment(nameEs: string): MenuWebEnrichment {
  const key = normalizeMenuName(nameEs);
  const direct = MENU_WEB_ENRICHMENTS[key];
  const imageUrl = resolveMenuImageUrl(nameEs) ?? direct?.imageUrl;
  return {
    ...direct,
    ...(imageUrl ? { imageUrl } : {}),
  };
}

/** Fields owned by the website — POS sync must not clobber these. */
export type MenuWebFields = {
  nameAr: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  allergens: string[];
};

export function pickWebFields(item: {
  nameAr: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  allergens: string[];
}): MenuWebFields {
  return {
    nameAr: item.nameAr,
    descriptionEs: item.descriptionEs,
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    imageUrl: item.imageUrl,
    isFeatured: item.isFeatured,
    allergens: item.allergens,
  };
}

export function mergeWebFields(
  existing: MenuWebFields | null,
  enrichment?: MenuWebEnrichment | MenuWebFields
): MenuWebFields {
  const base: MenuWebFields = existing ?? {
    nameAr: null,
    descriptionEs: null,
    descriptionEn: null,
    descriptionAr: null,
    imageUrl: null,
    isFeatured: false,
    allergens: [],
  };

  if (!enrichment) return base;

  return {
    nameAr: base.nameAr ?? enrichment.nameAr ?? null,
    descriptionEs: base.descriptionEs ?? enrichment.descriptionEs ?? null,
    descriptionEn: base.descriptionEn ?? enrichment.descriptionEn ?? null,
    descriptionAr: base.descriptionAr ?? enrichment.descriptionAr ?? null,
    imageUrl: base.imageUrl ?? enrichment.imageUrl ?? null,
    isFeatured: base.isFeatured || enrichment.isFeatured === true,
    allergens: base.allergens.length > 0 ? base.allergens : enrichment.allergens ?? [],
  };
}
