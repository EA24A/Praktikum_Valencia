import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

export default async function AdminReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const reservations = await prisma.reservation.findMany({
    orderBy: { date: "asc" },
    take: 50,
    include: { table: true, slot: true },
  });

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <h1 className="font-display text-4xl text-[var(--espresso)] mb-8">Reservas</h1>

      <div className="card-warm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
                {["Ref.", "Cliente", "Fecha", "Hora", "Personas", "Mesa", "Estado", "Acción"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-body text-xs text-[var(--olive)] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                  <td className="px-4 py-3 font-body text-xs text-[var(--espresso)] font-medium">
                    #{res.reservationNumber.slice(-6)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-body text-sm text-[var(--espresso)]">{res.customerName}</div>
                    <div className="font-body text-xs text-[var(--olive)]">{res.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-[var(--espresso)]">
                    {new Date(res.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-[var(--olive)]">
                    {new Date(res.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-[var(--espresso)]">
                    {res.partySize} {res.partySize === 1 ? "persona" : "personas"}
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-[var(--olive)]">
                    {res.table?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={res.status} type="reservation" />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/reservations/${res.id}`}
                      className="font-body text-xs text-[var(--terracotta)] hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reservations.length === 0 && (
            <div className="text-center py-12 font-body text-[var(--olive)]">No hay reservas todavía</div>
          )}
        </div>
      </div>
    </div>
  );
}
