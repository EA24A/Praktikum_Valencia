/**
 * Upserts the real Casa Fenicia menu (from lista_precios_actualizada.xlsx)
 * into the database — safe to re-run, never deletes existing data.
 *
 * Usage:  npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-menu-from-excel.ts
 * Or:     npm run seed:menu
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "cat-cafe",
    nameEs: "Café",
    nameEn: "Coffee",
    nameAr: "قهوة",
    slug: "cafe",
    displayOrder: 1,
  },
  {
    id: "cat-bocados",
    nameEs: "Bocados Libaneses",
    nameEn: "Lebanese Bites",
    nameAr: "مقبلات لبنانية",
    slug: "bocados-libaneses",
    displayOrder: 2,
  },
  {
    id: "cat-principales",
    nameEs: "Platos Principales",
    nameEn: "Main Dishes",
    nameAr: "أطباق رئيسية",
    slug: "platos-principales",
    displayOrder: 3,
  },
  {
    id: "cat-dulces",
    nameEs: "Dulces",
    nameEn: "Sweets",
    nameAr: "حلويات",
    slug: "dulces",
    displayOrder: 4,
  },
  {
    id: "cat-bebidas",
    nameEs: "Bebidas",
    nameEn: "Drinks",
    nameAr: "مشروبات",
    slug: "bebidas",
    displayOrder: 5,
  },
  {
    id: "cat-cocteles",
    nameEs: "Cócteles",
    nameEn: "Cocktails",
    nameAr: "عصائر طازجة",
    slug: "cocteles",
    displayOrder: 6,
  },
  {
    id: "cat-combos",
    nameEs: "Combo Popular",
    nameEn: "Popular Combos",
    nameAr: "عروض شعبية",
    slug: "combo-popular",
    displayOrder: 7,
  },
];

// ─── Items ────────────────────────────────────────────────────────────────────

type ItemDef = {
  id: string;
  categoryId: string;
  nameEs: string;
  nameEn: string;
  nameAr: string;
  descriptionEs?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  basePrice: number;
  isFeatured?: boolean;
  displayOrder: number;
  allergens?: string[];
};

const ITEMS: ItemDef[] = [
  // ── Café ──
  {
    id: "item-espresso",
    categoryId: "cat-cafe",
    nameEs: "Café Espresso",
    nameEn: "Espresso",
    nameAr: "إسبريسو",
    basePrice: 1.8,
    displayOrder: 1,
  },
  {
    id: "item-cortado",
    categoryId: "cat-cafe",
    nameEs: "Café Cortado",
    nameEn: "Cortado",
    nameAr: "كورتادو",
    basePrice: 2.0,
    displayOrder: 2,
  },
  {
    id: "item-cremaet",
    categoryId: "cat-cafe",
    nameEs: "Café Cremaet",
    nameEn: "Café Cremaet",
    nameAr: "كريمت",
    descriptionEs: "Especialidad valenciana con ron y canela",
    descriptionEn: "Valencian specialty with rum and cinnamon",
    descriptionAr: "تخصص فالنسياني بالروم والقرفة",
    basePrice: 3.5,
    displayOrder: 3,
  },
  {
    id: "item-cafe-helado",
    categoryId: "cat-cafe",
    nameEs: "Café Helado",
    nameEn: "Iced Coffee",
    nameAr: "قهوة مثلجة",
    basePrice: 3.0,
    displayOrder: 4,
  },

  // ── Bocados Libaneses ──
  {
    id: "item-sfiha",
    categoryId: "cat-bocados",
    nameEs: "Sfiha",
    nameEn: "Sfiha",
    nameAr: "صفيحة",
    descriptionEs: "Miniempanada libanesa de carne especiada",
    descriptionEn: "Lebanese mini meat pie with spiced filling",
    descriptionAr: "فطيرة لبنانية صغيرة محشوة باللحم المتبَّل",
    basePrice: 2.0,
    displayOrder: 1,
  },
  {
    id: "item-fatayer-espinaca",
    categoryId: "cat-bocados",
    nameEs: "Fatayer de Espinaca",
    nameEn: "Spinach Fatayer",
    nameAr: "فطاير السبانخ",
    descriptionEs: "Triángulo de hojaldre relleno de espinacas y limón",
    descriptionEn: "Pastry triangle filled with spinach and lemon",
    descriptionAr: "مثلثات عجين محشوة بالسبانخ والليمون",
    basePrice: 2.0,
    displayOrder: 2,
  },
  {
    id: "item-kibbeh",
    categoryId: "cat-bocados",
    nameEs: "Kibbeh",
    nameEn: "Kibbeh",
    nameAr: "كبة",
    descriptionEs: "Croqueta de cordero con bulgur y especias",
    descriptionEn: "Lamb croquette with bulgur and spices",
    descriptionAr: "كرات لحم الضأن بالبرغل والبهارات",
    basePrice: 3.0,
    displayOrder: 3,
    allergens: ["Gluten"],
  },
  {
    id: "item-mini-manakish",
    categoryId: "cat-bocados",
    nameEs: "Mini Manakish",
    nameEn: "Mini Manakish",
    nameAr: "مناقيش صغيرة",
    descriptionEs: "Zaatar / Queso",
    descriptionEn: "Za'atar / Cheese",
    descriptionAr: "زعتر / جبنة",
    basePrice: 2.0,
    displayOrder: 4,
    allergens: ["Gluten", "Lácteos"],
  },
  {
    id: "item-falafel",
    categoryId: "cat-bocados",
    nameEs: "Falafel",
    nameEn: "Falafel",
    nameAr: "فلافل",
    descriptionEs: "Croquetas de garbanzo crujientes con salsa tahini",
    descriptionEn: "Crispy chickpea fritters with tahini sauce",
    descriptionAr: "أقراص الحمص المقرمشة مع صلصة الطحينة",
    basePrice: 6.0,
    isFeatured: true,
    displayOrder: 5,
    allergens: ["Sésamo"],
  },
  {
    id: "item-hummus-tapa",
    categoryId: "cat-bocados",
    nameEs: "Hummus",
    nameEn: "Hummus",
    nameAr: "حمص",
    descriptionEs: "Crema de garbanzos con aceite de oliva y pimentón",
    descriptionEn: "Chickpea cream with olive oil and smoked paprika",
    descriptionAr: "كريمة الحمص بزيت الزيتون والفلفل الأحمر",
    basePrice: 4.0,
    isFeatured: true,
    displayOrder: 6,
    allergens: ["Sésamo"],
  },

  // ── Platos Principales ──
  {
    id: "item-shawarma-pollo",
    categoryId: "cat-principales",
    nameEs: "Shawarma de Pollo",
    nameEn: "Chicken Shawarma",
    nameAr: "شاورما دجاج",
    descriptionEs: "Plato principal con pollo marinado y guarnición",
    descriptionEn: "Main dish with marinated chicken and sides",
    descriptionAr: "طبق رئيسي مع دجاج متبَّل وطرق جانبية",
    basePrice: 7.0,
    isFeatured: true,
    displayOrder: 1,
    allergens: ["Gluten"],
  },
  {
    id: "item-shawarma-carne",
    categoryId: "cat-principales",
    nameEs: "Shawarma de Carne",
    nameEn: "Meat Shawarma",
    nameAr: "شاورما لحم",
    descriptionEs: "Plato principal con carne de ternera especiada",
    descriptionEn: "Main dish with spiced beef",
    descriptionAr: "طبق رئيسي مع لحم بقري متبَّل",
    basePrice: 8.0,
    isFeatured: true,
    displayOrder: 2,
    allergens: ["Gluten"],
  },
  {
    id: "item-hummus-pollo",
    categoryId: "cat-principales",
    nameEs: "Hummus con Pollo",
    nameEn: "Hummus with Chicken",
    nameAr: "حمص بالدجاج",
    descriptionEs: "Hummus casero cubierto de pollo a la plancha",
    descriptionEn: "House hummus topped with grilled chicken",
    descriptionAr: "حمص بيتي بالدجاج المشوي",
    basePrice: 6.5,
    displayOrder: 3,
    allergens: ["Sésamo"],
  },
  {
    id: "item-hummus-carne",
    categoryId: "cat-principales",
    nameEs: "Hummus con Carne",
    nameEn: "Hummus with Meat",
    nameAr: "حمص باللحم",
    descriptionEs: "Hummus casero cubierto de carne picada especiada",
    descriptionEn: "House hummus topped with spiced minced meat",
    descriptionAr: "حمص بيتي باللحم المفروم المتبَّل",
    basePrice: 7.0,
    displayOrder: 4,
    allergens: ["Sésamo"],
  },

  // ── Dulces ──
  {
    id: "item-baklava-clasico",
    categoryId: "cat-dulces",
    nameEs: "Baklava Clásico",
    nameEn: "Classic Baklava",
    nameAr: "بقلاوة كلاسيك",
    descriptionEs: "Hojaldre con nueces y miel de naranja",
    descriptionEn: "Filo pastry with walnuts and orange blossom honey",
    descriptionAr: "عجين فيلو بالجوز وعسل زهر البرتقال",
    basePrice: 1.8,
    displayOrder: 1,
    allergens: ["Gluten", "Frutos secos"],
  },
  {
    id: "item-baklava-pistacho",
    categoryId: "cat-dulces",
    nameEs: "Baklava de Pistacho",
    nameEn: "Pistachio Baklava",
    nameAr: "بقلاوة فستق",
    descriptionEs: "Hojaldre con pistacho y almíbar de agua de rosas",
    descriptionEn: "Filo pastry with pistachio and rose water syrup",
    descriptionAr: "عجين فيلو بالفستق وشراب ماء الورد",
    basePrice: 2.0,
    displayOrder: 2,
    allergens: ["Gluten", "Frutos secos"],
  },
  {
    id: "item-knafeh",
    categoryId: "cat-dulces",
    nameEs: "Knafeh",
    nameEn: "Knafeh",
    nameAr: "كنافة",
    descriptionEs: "Pastel de queso con kataifi, almíbar y pistacho",
    descriptionEn: "Cheese pastry with kataifi, syrup and pistachio",
    descriptionAr: "حلوى الجبن بالقطايف والشيرة والفستق",
    basePrice: 5.0,
    isFeatured: true,
    displayOrder: 3,
    allergens: ["Gluten", "Lácteos", "Frutos secos"],
  },
  {
    id: "item-helado-kashta",
    categoryId: "cat-dulces",
    nameEs: "Helado de Kashta",
    nameEn: "Kashta Ice Cream",
    nameAr: "بوظة قشطة",
    descriptionEs: "Helado artesanal de crema de leche libanesa",
    descriptionEn: "Artisan Lebanese clotted cream ice cream",
    descriptionAr: "بوظة قشطة لبنانية بلدية",
    basePrice: 4.0,
    displayOrder: 4,
    allergens: ["Lácteos"],
  },
  {
    id: "item-baklava-helado",
    categoryId: "cat-dulces",
    nameEs: "Baklava con Helado de Kashta",
    nameEn: "Baklava with Kashta Ice Cream",
    nameAr: "بقلاوة مع بوظة قشطة",
    descriptionEs: "La combinación perfecta: baklava crujiente y helado frío",
    descriptionEn: "The perfect pairing: crispy baklava and cold ice cream",
    descriptionAr: "الثنائي المثالي: بقلاوة مقرمشة مع بوظة باردة",
    basePrice: 5.0,
    isFeatured: true,
    displayOrder: 5,
    allergens: ["Gluten", "Lácteos", "Frutos secos"],
  },

  // ── Bebidas ──
  {
    id: "item-agua",
    categoryId: "cat-bebidas",
    nameEs: "Agua",
    nameEn: "Water",
    nameAr: "ماء",
    basePrice: 1.0,
    displayOrder: 1,
  },
  {
    id: "item-refrescos",
    categoryId: "cat-bebidas",
    nameEs: "Refrescos",
    nameEn: "Soft Drinks",
    nameAr: "مشروبات غازية",
    basePrice: 2.5,
    displayOrder: 2,
  },
  {
    id: "item-cerveza",
    categoryId: "cat-bebidas",
    nameEs: "Cerveza",
    nameEn: "Beer",
    nameAr: "بيرة",
    basePrice: 2.5,
    displayOrder: 3,
  },
  {
    id: "item-limonada-fenicia",
    categoryId: "cat-bebidas",
    nameEs: "Limonada Fenicia",
    nameEn: "Fenician Lemonade",
    nameAr: "ليموناضة فينيسيا",
    descriptionEs: "Con menta fresca y agua de azahar",
    descriptionEn: "With fresh mint and orange blossom water",
    descriptionAr: "بالنعناع الطازج وماء زهر البرتقال",
    basePrice: 4.0,
    isFeatured: true,
    displayOrder: 4,
  },

  // ── Cócteles ──
  {
    id: "item-coctel-frutas",
    categoryId: "cat-cocteles",
    nameEs: "Cóctel de Frutas",
    nameEn: "Fruit Cocktail",
    nameAr: "كوكتيل فواكه",
    descriptionEs: "Frutas de temporada trituradas al momento",
    descriptionEn: "Fresh seasonal fruits blended to order",
    descriptionAr: "فواكه موسمية طازجة معصورة في الحال",
    basePrice: 3.5,
    displayOrder: 1,
  },
  {
    id: "item-coctel-aguacate",
    categoryId: "cat-cocteles",
    nameEs: "Cóctel de Aguacate",
    nameEn: "Avocado Cocktail",
    nameAr: "كوكتيل أفوكادو",
    descriptionEs: "Aguacate cremoso con leche y miel",
    descriptionEn: "Creamy avocado with milk and honey",
    descriptionAr: "أفوكادو كريمي بالحليب والعسل",
    basePrice: 3.5,
    displayOrder: 2,
    allergens: ["Lácteos"],
  },
  {
    id: "item-coctel-nashi",
    categoryId: "cat-cocteles",
    nameEs: "Cóctel de Nashi",
    nameEn: "Nashi Cocktail",
    nameAr: "كوكتيل ناشي",
    descriptionEs: "Pera asiática fresca batida con jengibre",
    descriptionEn: "Fresh Asian pear blended with ginger",
    descriptionAr: "إجاص آسيوي طازج مع الزنجبيل",
    basePrice: 3.5,
    displayOrder: 3,
  },

  // ── Combos ──
  {
    id: "item-combo-cafe-baklava",
    categoryId: "cat-combos",
    nameEs: "Café + Baklava",
    nameEn: "Coffee + Baklava",
    nameAr: "قهوة + بقلاوة",
    descriptionEs: "Un café a tu elección con una pieza de baklava",
    descriptionEn: "Coffee of your choice with one piece of baklava",
    descriptionAr: "قهوة من اختيارك مع قطعة بقلاوة",
    basePrice: 4.0,
    displayOrder: 1,
    allergens: ["Gluten", "Frutos secos"],
  },
  {
    id: "item-combo-sfiha-ayran",
    categoryId: "cat-combos",
    nameEs: "2 Sfiha + Ayran",
    nameEn: "2 Sfiha + Ayran",
    nameAr: "2 صفيحة + أيران",
    descriptionEs: "Dos sfihas con un vaso de ayran (yogur salado)",
    descriptionEn: "Two sfihas with a glass of ayran (salted yoghurt drink)",
    descriptionAr: "صفيحتان مع كوب أيران (زبادي مملّح)",
    basePrice: 5.0,
    displayOrder: 2,
    allergens: ["Gluten", "Lácteos"],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Upserting Casa Fenicia menu from Excel data...\n");

  // 1. Upsert categories
  console.log("📂 Categories:");
  for (const cat of CATEGORIES) {
    await prisma.menuCategory.upsert({
      where: { slug: cat.slug },
      update: {
        nameEs: cat.nameEs,
        nameEn: cat.nameEn,
        nameAr: cat.nameAr,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
      create: {
        id: cat.id,
        nameEs: cat.nameEs,
        nameEn: cat.nameEn,
        nameAr: cat.nameAr,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });
    console.log(`  ✅ ${cat.nameEn} (${cat.nameEs})`);
  }

  // Build a slug→id map for the newly upserted categories
  const dbCats = await prisma.menuCategory.findMany({ select: { id: true, slug: true } });
  const catSlugToId: Record<string, string> = {};
  for (const c of dbCats) catSlugToId[c.slug] = c.id;

  // Resolve categoryId from the CATEGORIES list slug
  const catIdToSlug: Record<string, string> = {};
  for (const cat of CATEGORIES) catIdToSlug[cat.id] = cat.slug;

  // 2. Upsert items
  console.log("\n🍽️  Menu items:");
  for (const item of ITEMS) {
    const catSlug = catIdToSlug[item.categoryId];
    const resolvedCatId = catSlugToId[catSlug];

    if (!resolvedCatId) {
      console.warn(`  ⚠️  Category not found for item ${item.nameEn}, skipping`);
      continue;
    }

    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        categoryId: resolvedCatId,
        nameEs: item.nameEs,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        descriptionEs: item.descriptionEs ?? null,
        descriptionEn: item.descriptionEn ?? null,
        descriptionAr: item.descriptionAr ?? null,
        basePrice: item.basePrice,
        isFeatured: item.isFeatured ?? false,
        displayOrder: item.displayOrder,
        allergens: item.allergens ?? [],
        isAvailable: true,
      },
      create: {
        id: item.id,
        categoryId: resolvedCatId,
        nameEs: item.nameEs,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        descriptionEs: item.descriptionEs ?? null,
        descriptionEn: item.descriptionEn ?? null,
        descriptionAr: item.descriptionAr ?? null,
        basePrice: item.basePrice,
        isFeatured: item.isFeatured ?? false,
        displayOrder: item.displayOrder,
        allergens: item.allergens ?? [],
        isAvailable: true,
      },
    });
    console.log(`  ✅ ${item.nameEn} — ${item.basePrice.toFixed(2)} €`);
  }

  console.log(`\n🎉 Done! ${CATEGORIES.length} categories · ${ITEMS.length} items upserted.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
