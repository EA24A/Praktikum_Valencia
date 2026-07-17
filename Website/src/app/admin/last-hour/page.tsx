import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LastHourManager from "@/components/admin/LastHourManager";
import { publicMenuItemWhere } from "@/lib/menuPublicFilter";

export default async function AdminLastHourPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySale, menuItems, closingSetting] = await Promise.all([
    prisma.lastHourSale.findFirst({
      where: { date: { gte: today } },
      include: { items: { include: { menuItem: true } } },
    }),
    prisma.menuItem.findMany({
      where: publicMenuItemWhere,
      orderBy: { displayOrder: "asc" },
      include: { category: true },
    }),
    prisma.siteSetting.findUnique({ where: { key: "closing_time" } }),
  ]);

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <h1 className="font-display text-4xl text-[var(--espresso)] mb-2">Oferta de Última Hora</h1>
      <p className="font-body text-sm text-[var(--olive)] mb-8">
        La oferta se activa automáticamente 1 hora antes del cierre ({closingSetting?.value ?? "22:00"}).
        Los pedidos deben completarse 10 minutos antes.
      </p>
      <LastHourManager
        todaySale={todaySale}
        menuItems={menuItems}
        closingTime={closingSetting?.value ?? "22:00"}
      />
    </div>
  );
}
