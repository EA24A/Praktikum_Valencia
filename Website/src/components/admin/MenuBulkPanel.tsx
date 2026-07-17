"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, Percent, RefreshCw } from "lucide-react";
import { formatPriceWithTax } from "@/lib/menuPricing";
import type { MenuCategory, MenuItem } from "@prisma/client";

type Item = MenuItem & { category?: MenuCategory };
type Props = {
  categories: (MenuCategory & { items: MenuItem[] })[];
};

export default function MenuBulkPanel({ categories }: Props) {
  const items = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({ ...item, category }))
      ),
    [categories]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [taxRate, setTaxRate] = useState("10");
  const [loading, setLoading] = useState(false);

  const allSelected = items.length > 0 && selected.size === items.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (payload: object, successMessage: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bulk action failed");
      toast.success(successMessage);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error en operación masiva");
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} producto(s)?`)) return;
    await runBulk(
      { action: "delete", itemIds: [...selected] },
      "Productos eliminados"
    );
  };

  const applyTaxRate = async () => {
    if (selected.size === 0) return;
    const parsed = parseFloat(taxRate.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("IVA inválido");
      return;
    }
    await runBulk(
      { action: "setTaxRate", itemIds: [...selected], taxRate: parsed },
      `IVA actualizado en ${selected.size} producto(s)`
    );
  };

  const importCatalog = async (file: File) => {
    if (
      !confirm(
        "Esto sincronizará la carta con el Excel. Los productos que no estén en el archivo se desactivarán (no se borran fotos ni descripciones). ¿Continuar?"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/menu/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast.success(
        `Sincronizado: ${data.upserted} productos (${data.webVisibleCount ?? "?"} web, ${data.posOnlyCount ?? 0} solo TPV)${data.deactivated ? `, ${data.deactivated} desactivados` : ""}`
      );
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  };

  const syncFromPos = async () => {
    if (
      !confirm(
        "¿Sincronizar desde Casa POS? Se actualizan precios y nombres; fotos y descripciones del sitio se mantienen."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu/sync-pos", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "POS sync failed");
      toast.success(
        `POS sincronizado: ${data.upserted} productos (${data.webVisibleCount} web, ${data.posOnlyCount} solo TPV)${data.linked ? `, ${data.linked} enlazados sin perder fotos` : ""}${data.deactivated ? `, ${data.deactivated} desactivados` : ""}`
      );
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar POS");
    } finally {
      setLoading(false);
    }
  };

  const pickImportFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void importCatalog(file);
    };
    input.click();
  };

  return (
    <div className="card-warm rounded-xl p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-[var(--espresso)]">Productos (Casa POS → web)</h2>
          <p className="font-body text-sm text-[var(--olive)] mt-1">
            Casa POS es la fuente de verdad. Sincroniza precios y productos; los marcados «solo TPV» no aparecen en la web.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <button
            type="button"
            onClick={syncFromPos}
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Sincronizar desde POS
          </button>
          <button
            type="button"
            onClick={pickImportFile}
            disabled={loading}
            className="btn-outline inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Importar XLSX
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
        <div>
          <label className="block font-body text-xs text-[var(--olive)] mb-1">IVA (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-28 bg-[var(--cream)] border border-[var(--border)] rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>
        <button
          type="button"
          disabled={loading || selected.size === 0}
          onClick={applyTaxRate}
          className="btn-outline inline-flex items-center gap-2 text-sm"
        >
          <Percent size={14} /> Aplicar IVA a seleccionados ({selected.size})
        </button>
        <button
          type="button"
          disabled={loading || selected.size === 0}
          onClick={deleteSelected}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={14} /> Eliminar seleccionados ({selected.size})
        </button>
      </div>

      <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
        <table className="min-w-full text-sm font-body">
          <thead className="bg-[var(--warm-white)] text-[var(--olive)]">
            <tr>
              <th className="px-3 py-3 text-left">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" />
              </th>
              <th className="px-3 py-3 text-left">Producto</th>
              <th className="px-3 py-3 text-left">Categoría</th>
              <th className="px-3 py-3 text-right">Base</th>
              <th className="px-3 py-3 text-right">IVA</th>
              <th className="px-3 py-3 text-right">Precio final</th>
              <th className="px-3 py-3 text-center">Web</th>
              <th className="px-3 py-3 text-center">Disponible</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleOne(item.id)}
                    aria-label={`Seleccionar ${item.nameEs}`}
                  />
                </td>
                <td className="px-3 py-3 text-[var(--espresso)]">
                  <div>{item.nameEs}</div>
                  <div className="text-xs text-[var(--olive)]">{item.nameEn}</div>
                </td>
                <td className="px-3 py-3 text-[var(--olive)]">{item.category?.nameEs ?? "—"}</td>
                <td className="px-3 py-3 text-right">{Number(item.basePrice).toFixed(2)} €</td>
                <td className="px-3 py-3 text-right">{Number(item.taxRate ?? 10).toFixed(0)}%</td>
                <td className="px-3 py-3 text-right font-medium text-[var(--terracotta)]">
                  {formatPriceWithTax(item.basePrice, item.taxRate ?? 10)}
                </td>
                <td className="px-3 py-3 text-center">
                  {item.posOnly ? (
                    <span className="text-xs text-[var(--olive)]">Solo TPV</span>
                  ) : (
                    <span className="text-xs text-green-600">Sí</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">{item.isAvailable ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p className="font-body text-sm text-[var(--olive)] text-center py-8">
          No hay productos. Importa un XLSX para sincronizar la carta.
        </p>
      )}
    </div>
  );
}
