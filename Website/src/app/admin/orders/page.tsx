import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <h1 className="font-display text-4xl text-[var(--espresso)] mb-8">Pedidos</h1>

      <div className="card-warm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
                {["Nº Pedido", "Cliente", "Hora", "Artículos", "Total", "Estado", "Acción"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-body text-xs text-[var(--olive)] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                  <td className="px-4 py-3 font-body text-sm text-[var(--espresso)] font-medium">
                    #{order.orderNumber.slice(-8)}
                    {order.isLastHourOrder && <span className="ml-1 text-[var(--gold)] text-xs font-bold">LH</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-body text-sm text-[var(--espresso)]">{order.customerName}</div>
                    <div className="font-body text-xs text-[var(--olive)]">{order.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-[var(--olive)]">
                    {new Date(order.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    <br />
                    {new Date(order.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-[var(--olive)]">
                    {order.items.length} {order.items.length === 1 ? "artículo" : "artículos"}
                  </td>
                  <td className="px-4 py-3 font-display text-sm text-[var(--terracotta)] font-semibold">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-body text-xs text-[var(--terracotta)] hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 font-body text-[var(--olive)]">
              No hay pedidos todavía
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
