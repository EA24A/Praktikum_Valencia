"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import OrderStatusBadge from "./OrderStatusBadge";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Order, OrderItem, OrderStatusHistory } from "@prisma/client";

type OrderWithDetails = Order & {
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
};

const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export default function OrderDetailClient({
  order,
  userRole,
}: {
  order: OrderWithDetails;
  userRole: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const transitions = ORDER_TRANSITIONS[status] ?? [];
  const canEdit = userRole !== "STAFF" || ["PREPARING", "READY"].includes(status);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      if (!res.ok) throw new Error();
      setStatus(newStatus as typeof order.status);
      setNote("");
      toast.success(`Estado actualizado a: ${newStatus}`);
      router.refresh();
    } catch {
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 font-body text-sm text-[var(--olive)] hover:text-[var(--terracotta)] mb-6 transition-colors">
        <ArrowLeft size={14} /> Volver a pedidos
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--espresso)]">
            Pedido #{order.orderNumber.slice(-8)}
          </h1>
          {order.isLastHourOrder && (
            <span className="inline-flex items-center gap-1 text-xs font-body text-[var(--gold)] mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Pedido de última hora
            </span>
          )}
        </div>
        <OrderStatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Customer */}
        <div className="card-warm rounded-xl p-5">
          <h3 className="font-display text-lg text-[var(--espresso)] mb-3">Cliente</h3>
          <div className="space-y-1.5 font-body text-sm text-[var(--olive)]">
            <div><span className="text-[var(--espresso-light)]">Nombre:</span> {order.customerName}</div>
            <div><span className="text-[var(--espresso-light)]">Email:</span> {order.customerEmail}</div>
            <div><span className="text-[var(--espresso-light)]">Teléfono:</span> {order.customerPhone}</div>
            {order.notes && (
              <div><span className="text-[var(--espresso-light)]">Notas:</span> {order.notes}</div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card-warm rounded-xl p-5">
          <h3 className="font-display text-lg text-[var(--espresso)] mb-3">Historial</h3>
          <div className="space-y-2">
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex items-center gap-2 font-body text-xs text-[var(--olive)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--terracotta)] shrink-0" />
                <span className="font-medium text-[var(--espresso-light)]">{h.status}</span>
                <span className="text-[var(--olive)]/60">
                  {new Date(h.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {h.note && <span>· {h.note}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card-warm rounded-xl p-5 mb-6">
        <h3 className="font-display text-lg text-[var(--espresso)] mb-4">Artículos</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
              <div className="font-body text-sm text-[var(--espresso)]">
                <span className="font-medium">{item.quantity}x</span> {item.itemName}
                {item.variantName && <span className="text-[var(--olive)] ml-1">({item.variantName})</span>}
                {Array.isArray(item.modifiers) && (item.modifiers as { name: string }[]).length > 0 && (
                  <div className="text-xs text-[var(--olive)] mt-0.5">
                    + {(item.modifiers as { name: string }[]).map((m) => m.name).join(", ")}
                  </div>
                )}
                {item.notes && <div className="text-xs text-[var(--olive)] mt-0.5">Nota: {item.notes}</div>}
              </div>
              <span className="font-display text-sm text-[var(--terracotta)] whitespace-nowrap">
                {formatPrice(Number(item.unitPrice) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between">
          <span className="font-display text-lg text-[var(--espresso)]">Total</span>
          <span className="font-display text-xl text-[var(--terracotta)]">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Status update */}
      {transitions.length > 0 && (
        <div className="card-warm rounded-xl p-5">
          <h3 className="font-display text-lg text-[var(--espresso)] mb-4">Actualizar estado</h3>
          <div className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional..."
              rows={2}
              className="w-full bg-[var(--cream)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {transitions.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--terracotta)] text-white font-body text-sm hover:bg-[var(--terracotta-dark)] transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  → {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
