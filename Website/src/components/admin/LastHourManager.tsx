"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Flame, Power } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatPriceWithTax } from "@/lib/menuPricing";
import type { LastHourSale, LastHourSaleItem, MenuItem, MenuCategory } from "@prisma/client";

type SaleWithItems = LastHourSale & {
  items: (LastHourSaleItem & { menuItem: MenuItem })[];
};
type ItemWithCategory = MenuItem & { category: MenuCategory };

type Props = {
  todaySale: SaleWithItems | null;
  menuItems: ItemWithCategory[];
  closingTime: string;
};

export default function LastHourManager({ todaySale, menuItems, closingTime }: Props) {
  const router = useRouter();
  const [sale, setSale] = useState<SaleWithItems | null>(todaySale);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockLimit, setStockLimit] = useState("5");
  const [loading, setLoading] = useState(false);

  const createSale = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/last-hour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSale(data.sale);
      toast.success("Oferta creada para hoy");
      router.refresh();
    } catch (e: unknown) {
      toast.error("Error al crear la oferta");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    if (!sale) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/last-hour", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: sale.id, isActive: !sale.isActive }),
      });
      if (!res.ok) throw new Error();
      setSale((s) => s ? { ...s, isActive: !s.isActive } : s);
      toast.success(sale.isActive ? "Oferta desactivada" : "Oferta activada");
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!sale || !selectedItemId || !salePrice) {
      toast.error("Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/last-hour/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: sale.id,
          menuItemId: selectedItemId,
          salePrice: parseFloat(salePrice),
          stockLimit: parseInt(stockLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSale((s) => s ? { ...s, items: [...s.items, data.item] } : s);
      setSelectedItemId("");
      setSalePrice("");
      setStockLimit("5");
      toast.success("Artículo añadido");
    } catch {
      toast.error("Error al añadir artículo");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/last-hour/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setSale((s) => s ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s);
      toast.success("Artículo eliminado");
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "bg-[var(--cream)] border border-[var(--border)] rounded-lg px-3 py-2.5 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors";

  if (!sale) {
    return (
      <div className="card-warm rounded-2xl p-10 text-center">
        <Flame size={40} className="text-[var(--terracotta)] mx-auto mb-4 opacity-50" />
        <h2 className="font-display text-2xl text-[var(--espresso)] mb-2">
          No hay oferta activa hoy
        </h2>
        <p className="font-body text-sm text-[var(--olive)] mb-6">
          Crea una oferta de última hora para hoy. Se activará automáticamente 1h antes del cierre ({closingTime}).
        </p>
        <button onClick={createSale} disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Crear oferta para hoy
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sale header */}
      <div className="card-warm rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-[var(--terracotta)]" />
            <h2 className="font-display text-xl text-[var(--espresso)]">
              Oferta de hoy
            </h2>
            <span className={`font-body text-xs px-2.5 py-1 rounded-full ${sale.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {sale.isActive ? "Activa" : "Pausada"}
            </span>
          </div>
          <p className="font-body text-xs text-[var(--olive)] mt-1">
            Se activa a las {closingTime.split(":").map((p, i) => {
              if (i === 0) return (parseInt(p) - 1).toString().padStart(2, "0");
              return p;
            }).join(":")} · Último pedido: {closingTime.split(":").map((p, i) => {
              if (i === 1) return (parseInt(p) - 10).toString().padStart(2, "0");
              return p;
            }).join(":")}
          </p>
        </div>
        <button
          onClick={toggleActive}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm transition-colors ${
            sale.isActive
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          <Power size={15} />
          {sale.isActive ? "Pausar oferta" : "Reactivar oferta"}
        </button>
      </div>

      {/* Add item */}
      <div className="card-warm rounded-xl p-5">
        <h3 className="font-display text-lg text-[var(--espresso)] mb-4">Añadir artículo a la oferta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={selectedItemId}
            onChange={(e) => {
              setSelectedItemId(e.target.value);
              const item = menuItems.find((m) => m.id === e.target.value);
              if (item) setSalePrice(Number(item.basePrice).toFixed(2));
            }}
            className={`sm:col-span-2 ${inputClass}`}
          >
            <option value="">Selecciona un plato...</option>
            {menuItems
              .filter((m) => !sale.items.some((si) => si.menuItemId === m.id))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameEs} – {formatPriceWithTax(item.basePrice, item.taxRate ?? 10)}
                </option>
              ))}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--olive)] font-body text-sm">€</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className={`${inputClass} pl-7`}
              placeholder="Precio oferta"
            />
          </div>
          <input
            type="number"
            min="1"
            value={stockLimit}
            onChange={(e) => setStockLimit(e.target.value)}
            className={inputClass}
            placeholder="Unidades"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={addItem}
            disabled={loading || !selectedItemId || !salePrice}
            className="btn-primary text-sm py-2 px-5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Añadir artículo
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="card-warm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-display text-lg text-[var(--espresso)]">
            Artículos en oferta ({sale.items.length})
          </h3>
        </div>
        {sale.items.length === 0 ? (
          <div className="text-center py-10 font-body text-sm text-[var(--olive)]">
            No hay artículos en la oferta. Añade uno arriba.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--muted)]">
                {["Plato", "Precio original", "Precio oferta", "Stock total", "Stock restante", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-body text-xs text-[var(--olive)] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sale.items.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-3 font-body text-sm text-[var(--espresso)]">
                    {item.menuItem.nameEs}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-[var(--olive)] line-through">
                    {formatPriceWithTax(item.menuItem.basePrice, item.menuItem.taxRate ?? 10)}
                  </td>
                  <td className="px-4 py-3 font-display text-sm text-[var(--terracotta)] font-semibold">
                    {formatPrice(item.salePrice)}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-[var(--espresso)]">
                    {item.stockLimit}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-sm font-medium ${item.stockRemaining === 0 ? "text-red-500" : "text-green-600"}`}>
                      {item.stockRemaining}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
