import { getTranslations } from "next-intl/server";
import { OrdersManager } from "@/components/admin/orders/orders-manager";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const [tables, employees] = await Promise.all([
    prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: "asc" },
      select: { id: true, number: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <OrdersManager
      tables={tables.map((table) => ({ id: table.id, label: table.number }))}
      employees={employees.map((employee) => ({
        id: employee.id,
        label: employee.name,
      }))}
    />
  );
}

export async function generateMetadata() {
  const t = await getTranslations("orders");
  return { title: t("title") };
}
