import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user — password must match README / admin login screen hint
  const adminPassword = "casafenicia2024!";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@casafenicia.com" },
    update: { password: hashedPassword, role: "OWNER" },
    create: {
      name: "Admin",
      email: "admin@casafenicia.com",
      password: hashedPassword,
      role: "OWNER",
    },
  });
  console.log("✅ Admin user ready: admin@casafenicia.com");

  // Site settings
  const settings = [
    { key: "glovo_url", value: "https://glovo.go.link/open?link_type=store&store_id=570810&adjust_t=s321jkn" },
    { key: "closing_time", value: "22:00" },
    { key: "opening_time", value: "09:00" },
    { key: "phone", value: "+34 600 345 055" },
    { key: "address", value: "C/ de la Corretgeria, 4, Ciutat Vella, 46001 València" },
    { key: "google_maps_url", value: "https://maps.app.goo.gl/kxm6t86WrZ4u4xC19" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ Site settings seeded");

  // Tables
  await prisma.table.createMany({
    data: [
      { name: "Mesa 1", seats: 2 },
      { name: "Mesa 2", seats: 2 },
      { name: "Barra", seats: 3 },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Tables seeded");

  // Time slots (Mon-Sun, every 30min from 9:00 to 21:30)
  const days = [0, 1, 2, 3, 4, 5, 6];
  const slotTimes = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30"];

  for (const day of days) {
    for (const time of slotTimes) {
      const [h, m] = time.split(":").map(Number);
      const endH = h + 1 > 22 ? 22 : h + 1;
      const endTime = `${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      await prisma.timeSlot.upsert({
        where: { id: `slot-${day}-${time}` },
        update: {},
        create: {
          id: `slot-${day}-${time}`,
          dayOfWeek: day,
          startTime: time,
          endTime,
          maxCovers: 4, // Max 4 guests per slot (2 tables × 2)
        },
      });
    }
  }
  console.log("✅ Time slots seeded");

  // Menu categories
  const categories = [
    { nameEs: "Entrantes", nameEn: "Starters", nameAr: "المقبلات", slug: "entrantes", displayOrder: 1 },
    { nameEs: "Platos principales", nameEn: "Main courses", nameAr: "الأطباق الرئيسية", slug: "principales", displayOrder: 2 },
    { nameEs: "Carnes", nameEn: "Meat dishes", nameAr: "أطباق اللحوم", slug: "carnes", displayOrder: 3 },
    { nameEs: "Vegetariano", nameEn: "Vegetarian", nameAr: "نباتي", slug: "vegetariano", displayOrder: 4 },
    { nameEs: "Bebidas", nameEn: "Drinks", nameAr: "المشروبات", slug: "bebidas", displayOrder: 5 },
    { nameEs: "Postres", nameEn: "Desserts", nameAr: "الحلويات", slug: "postres", displayOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.menuCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Menu categories seeded");

  const entrantes = await prisma.menuCategory.findUnique({ where: { slug: "entrantes" } });
  const principales = await prisma.menuCategory.findUnique({ where: { slug: "principales" } });
  const vegetariano = await prisma.menuCategory.findUnique({ where: { slug: "vegetariano" } });

  if (entrantes && principales && vegetariano) {
    // Sample menu items
    const items = [
      {
        categoryId: entrantes.id,
        nameEs: "Hummus Clásico",
        nameEn: "Classic Hummus",
        nameAr: "حُمُّص كلاسيكي",
        descriptionEs: "Crema de garbanzos con aceite de oliva y pimentón. Servido con pan de pita.",
        descriptionEn: "Chickpea cream with olive oil and paprika. Served with pita bread.",
        descriptionAr: "كريمة الحمص بزيت الزيتون والفلفل الأحمر، تُقدَّم مع خبز البيتا.",
        basePrice: 6.5,
        isFeatured: true,
        displayOrder: 1,
        allergens: ["Gluten", "Sésamo"],
      },
      {
        categoryId: entrantes.id,
        nameEs: "Falafel (6 uds)",
        nameEn: "Falafel (6 pcs)",
        nameAr: "فلافل (6 قطع)",
        descriptionEs: "Croquetas de garbanzo crujientes, con salsa tahini y verduras frescas.",
        descriptionEn: "Crispy chickpea fritters with tahini sauce and fresh vegetables.",
        descriptionAr: "أقراص الحمص المقرمشة مع صلصة الطحينة والخضروات الطازجة.",
        basePrice: 7.5,
        isFeatured: true,
        displayOrder: 2,
        allergens: ["Sésamo"],
      },
      {
        categoryId: entrantes.id,
        nameEs: "Tabbouleh",
        nameEn: "Tabbouleh",
        nameAr: "تبولة",
        descriptionEs: "Ensalada de perejil fresco, tomate, bulgur, limón y aceite de oliva.",
        descriptionEn: "Fresh parsley salad with tomato, bulgur, lemon and olive oil.",
        descriptionAr: "سلطة بقدونس طازج مع البندورة والبرغل والليمون وزيت الزيتون.",
        basePrice: 6.0,
        displayOrder: 3,
        allergens: ["Gluten"],
      },
      {
        categoryId: principales.id,
        nameEs: "Shawarma de Pollo",
        nameEn: "Chicken Shawarma",
        nameAr: "شاورما الدجاج",
        descriptionEs: "Pollo marinado con especias libanesas, envuelto en pan de pita con salsa de ajo.",
        descriptionEn: "Chicken marinated in Lebanese spices, wrapped in pita bread with garlic sauce.",
        descriptionAr: "دجاج متبَّل بالبهارات اللبنانية ملفوف بخبز البيتا مع صلصة الثوم.",
        basePrice: 10.5,
        isFeatured: true,
        displayOrder: 1,
        allergens: ["Gluten"],
      },
      {
        categoryId: principales.id,
        nameEs: "Kibbeh",
        nameEn: "Kibbeh",
        nameAr: "كبة",
        descriptionEs: "Croquetas de carne de cordero con bulgur y especias. 4 unidades.",
        descriptionEn: "Lamb meat croquettes with bulgur and spices. 4 pieces.",
        descriptionAr: "أقراص لحم الضأن بالبرغل والبهارات. 4 قطع.",
        basePrice: 12.0,
        displayOrder: 2,
        allergens: ["Gluten"],
      },
      {
        categoryId: vegetariano.id,
        nameEs: "Meze Vegetariano",
        nameEn: "Vegetarian Meze",
        nameAr: "مَزّة نباتية",
        descriptionEs: "Selección de hummus, falafel, tabbouleh y baba ghanoush.",
        descriptionEn: "Selection of hummus, falafel, tabbouleh and baba ghanoush.",
        descriptionAr: "تشكيلة من الحمص والفلافل والتبولة وبابا غنوج.",
        basePrice: 14.0,
        isFeatured: true,
        displayOrder: 1,
        allergens: ["Sésamo", "Gluten"],
      },
    ];

    for (const item of items) {
      await prisma.menuItem.upsert({
        where: { id: `item-${item.nameEs.toLowerCase().replace(/\s/g, "-")}` },
        update: {},
        create: {
          id: `item-${item.nameEs.toLowerCase().replace(/\s/g, "-")}`,
          ...item,
        },
      });
    }
    console.log("✅ Sample menu items seeded");
  }

  console.log("\n🎉 Database seeded successfully!");
  console.log("Admin login: admin@casafenicia.com / casafenicia2024!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
