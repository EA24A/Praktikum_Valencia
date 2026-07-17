import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@casapos.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Super Admin";

  const posEmail = process.env.SEED_POS_EMAIL ?? "pos@casapos.local";
  const posPassword = process.env.SEED_POS_PASSWORD ?? "pos12345";
  const posName = process.env.SEED_POS_NAME ?? "Restaurant POS";

  const employeeEmail = process.env.SEED_EMPLOYEE_EMAIL ?? "employee@casapos.local";
  const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD ?? "employee12345";
  const employeeName = process.env.SEED_EMPLOYEE_NAME ?? "María García";

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const posHash = await bcrypt.hash(posPassword, 12);
  const employeeHash = await bcrypt.hash(employeePassword, 12);

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "Casa POS",
      businessAddress: "Calle Principal 1, Madrid",
      businessPhone: "+34 600 000 000",
      taxId: "B12345678",
      receiptHeaderEs: "Casa Fenicia",
      receiptFooterEs: "¡Gracias por su visita!",
      receiptFooterEn: "Thank you for your visit!",
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: adminHash,
      role: "SUPERADMIN",
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      password: adminHash,
      role: "SUPERADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: posEmail },
    update: {
      name: posName,
      password: posHash,
      role: "EMPLOYEE",
      isActive: true,
    },
    create: {
      email: posEmail,
      name: posName,
      password: posHash,
      role: "EMPLOYEE",
    },
  });

  const workerPassword = process.env.SEED_WORKER_PASSWORD ?? "worker12345";
  const workerHash = await bcrypt.hash(workerPassword, 12);

  const timesheetWorkers = [
    { email: "ali@casapos.local", name: "Ali" },
    { email: "jolian@casapos.local", name: "Jolian" },
    { email: "raphael@casapos.local", name: "Raphael" },
  ];

  for (const worker of timesheetWorkers) {
    await prisma.user.upsert({
      where: { email: worker.email },
      update: {
        name: worker.name,
        password: workerHash,
        role: "EMPLOYEE",
        isActive: true,
      },
      create: {
        email: worker.email,
        name: worker.name,
        password: workerHash,
        role: "EMPLOYEE",
      },
    });
  }

  await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {
      name: employeeName,
      password: employeeHash,
      role: "EMPLOYEE",
      isActive: true,
    },
    create: {
      email: employeeEmail,
      name: employeeName,
      password: employeeHash,
      role: "EMPLOYEE",
    },
  });

  const categoryData = [
    { nameEs: "Bebidas", nameEn: "Drinks", sortOrder: 0 },
    { nameEs: "Comida", nameEn: "Food", sortOrder: 1 },
    { nameEs: "Postres", nameEn: "Desserts", sortOrder: 2 },
  ];

  for (const cat of categoryData) {
    const existing = await prisma.category.findFirst({
      where: { nameEs: cat.nameEs },
    });
    if (!existing) {
      const category = await prisma.category.create({ data: cat });
      const products =
        cat.nameEs === "Bebidas"
          ? [
              { nameEs: "Café solo", nameEn: "Espresso", price: 1.5, taxRate: 10 },
              { nameEs: "Cortado", nameEn: "Cortado", price: 1.8, taxRate: 10 },
              { nameEs: "Agua", nameEn: "Water", price: 1.2, taxRate: 10 },
            ]
          : cat.nameEs === "Comida"
            ? [
                { nameEs: "Tostada", nameEn: "Toast", price: 2.5, taxRate: 10 },
                { nameEs: "Bocadillo", nameEn: "Sandwich", price: 4.5, taxRate: 10 },
              ]
            : [
                { nameEs: "Tarta de queso", nameEn: "Cheesecake", price: 3.5, taxRate: 10 },
                { nameEs: "Brownie", nameEn: "Brownie", price: 2.8, taxRate: 10 },
              ];

      for (const [idx, p] of products.entries()) {
        await prisma.product.create({
          data: {
            categoryId: category.id,
            nameEs: p.nameEs,
            nameEn: p.nameEn,
            price: p.price,
            taxRate: p.taxRate,
            sortOrder: idx,
          },
        });
      }
    }
  }

  const tableCount = await prisma.table.count();
  if (tableCount === 0) {
    const tables = [
      { number: "T1", x: 10, y: 10, width: 12, height: 12, color: "#22c55e" },
      { number: "T2", x: 30, y: 10, width: 12, height: 12, color: "#3b82f6" },
      { number: "T3", x: 50, y: 10, width: 12, height: 12, color: "#3b82f6" },
      { number: "T4", x: 10, y: 35, width: 12, height: 12, color: "#22c55e" },
      { number: "T5", x: 30, y: 35, width: 14, height: 14, color: "#a855f7", shape: "circle" },
    ];
    for (const t of tables) {
      await prisma.table.create({ data: t });
    }
  }

  const discountCount = await prisma.discount.count();
  if (discountCount === 0) {
    await prisma.discount.createMany({
      data: [
        {
          nameEs: "Descuento empleado 10%",
          nameEn: "Employee discount 10%",
          type: "PERCENTAGE",
          value: 10,
          requiresCashPayment: false,
        },
        {
          nameEs: "Happy hour 5€",
          nameEn: "Happy hour €5 off",
          type: "FIXED_AMOUNT",
          value: 5,
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log(`  Superadmin: ${adminEmail} / ${adminPassword}`);
  console.log(`  POS terminal (shared login): ${posEmail} / ${posPassword}`);
  console.log(`  Staff roster example: ${employeeEmail} / ${employeePassword}`);
  console.log(`  Timesheet workers: ali, jolian, raphael @casapos.local / ${workerPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
