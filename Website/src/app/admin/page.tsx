import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Calendar, Clock, TrendingUp, Flame } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayOrders,
    pendingOrders,
    todayReservations,
    pendingReservations,
    recentOrders,
    upcomingReservations,
    lastHourSale,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    prisma.reservation.count({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: { date: { gte: today }, status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.lastHourSale.findFirst({
      where: { date: { gte: today }, isActive: true },
      include: { items: { include: { menuItem: true } } },
    }),
  ]);

  const todayRevenue = await prisma.order.aggregate({
    where: { createdAt: { gte: today }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
    _sum: { total: true },
  });

  const stats = [
    {
      icon: ShoppingBag,
      label: "Pedidos hoy",
      value: todayOrders.toString(),
      sub: `${pendingOrders} pendientes`,
      color: "var(--terracotta)",
      href: "/admin/orders",
    },
    {
      icon: TrendingUp,
      label: "Ingresos hoy",
      value: formatPrice(todayRevenue._sum.total ?? 0),
      sub: "pedidos completados",
      color: "var(--olive)",
      href: "/admin/orders",
    },
    {
      icon: Calendar,
      label: "Reservas hoy",
      value: todayReservations.toString(),
      sub: `${pendingReservations} por confirmar`,
      color: "#2563eb",
      href: "/admin/reservations",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "#f59e0b",
    PAID: "#3b82f6",
    PREPARING: "#8b5cf6",
    READY: "#10b981",
    COMPLETED: "#6b7280",
    CANCELLED: "#ef4444",
    REFUNDED: "#ec4899",
  };

  const reservationStatusColors: Record<string, string> = {
    PENDING: "#f59e0b",
    CONFIRMED: "#10b981",
    SEATED: "#3b82f6",
    COMPLETED: "#6b7280",
    CANCELLED: "#ef4444",
    NO_SHOW: "#9ca3af",
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--espresso)]">Dashboard</h1>
        <p className="font-body text-sm text-[var(--olive)] mt-1">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card-warm rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: stat.color + "15" }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="font-display text-3xl font-semibold text-[var(--espresso)]">
              {stat.value}
            </div>
            <div className="font-body text-sm text-[var(--espresso-light)] mt-0.5">{stat.label}</div>
            <div className="font-body text-xs text-[var(--olive)] mt-1">{stat.sub}</div>
          </Link>
        ))}
      </div>

      {/* Last Hour Sale status */}
      {lastHourSale && (
        <div className="card-warm rounded-xl p-5 mb-6 border border-[var(--terracotta)]/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Flame size={20} className="text-[var(--terracotta)]" />
              <div>
                <div className="font-display text-lg text-[var(--espresso)]">Oferta de última hora activa hoy</div>
                <div className="font-body text-xs text-[var(--olive)]">
                  {lastHourSale.items.length} artículos · 
                  Stock restante: {lastHourSale.items.reduce((s, i) => s + i.stockRemaining, 0)} unidades
                </div>
              </div>
            </div>
            <Link href="/admin/last-hour" className="btn-primary text-sm py-2 px-4">
              Gestionar
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card-warm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-[var(--espresso)]">Últimos pedidos</h2>
            <Link href="/admin/orders" className="font-body text-xs text-[var(--terracotta)] hover:underline">
              Ver todos →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="font-body text-sm text-[var(--olive)] text-center py-6">No hay pedidos todavía</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <div>
                    <div className="font-body text-sm text-[var(--espresso)] font-medium">
                      #{order.orderNumber.slice(-8)}
                    </div>
                    <div className="font-body text-xs text-[var(--olive)]">{order.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm text-[var(--terracotta)]">
                      {formatPrice(order.total)}
                    </div>
                    <span
                      className="font-body text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: (statusColors[order.status] ?? "#6b7280") + "20",
                        color: statusColors[order.status] ?? "#6b7280",
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming reservations */}
        <div className="card-warm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-[var(--espresso)]">Próximas reservas</h2>
            <Link href="/admin/reservations" className="font-body text-xs text-[var(--terracotta)] hover:underline">
              Ver todas →
            </Link>
          </div>
          {upcomingReservations.length === 0 ? (
            <p className="font-body text-sm text-[var(--olive)] text-center py-6">No hay reservas próximas</p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((res) => (
                <Link
                  key={res.id}
                  href={`/admin/reservations/${res.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <div>
                    <div className="font-body text-sm text-[var(--espresso)] font-medium">
                      {res.customerName}
                    </div>
                    <div className="font-body text-xs text-[var(--olive)] flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(res.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      &nbsp;·&nbsp;
                      {res.partySize} personas
                    </div>
                  </div>
                  <span
                    className="font-body text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: (reservationStatusColors[res.status] ?? "#6b7280") + "20",
                      color: reservationStatusColors[res.status] ?? "#6b7280",
                    }}
                  >
                    {res.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
