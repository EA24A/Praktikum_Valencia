"use client";

import { useState, useCallback } from "react";
import { Check, Pencil, X, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatPriceWithTax } from "@/lib/menuPricing";

type Item = {
  id: string;
  nameEn: string;
  nameEs: string;
  nameAr: string | null;
  basePrice: number;
  taxRate?: number;
  isAvailable: boolean;
};

type Category = {
  id: string;
  nameEn: string;
  nameEs: string;
  items: Item[];
};

type Props = { initialCategories: Category[] };

export default function MenuPriceEditor({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  // Track which item is being edited: { itemId -> draft price string }
  const [editing, setEditing] = useState<Record<string, string>>({});
  // Track which items are currently saving
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const startEdit = (item: Item) => {
    setEditing((prev) => ({
      ...prev,
      [item.id]: item.basePrice.toFixed(2),
    }));
  };

  const cancelEdit = (itemId: string) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const savePrice = useCallback(async (itemId: string) => {
    const draft = editing[itemId];
    if (draft === undefined) return;

    const parsed = parseFloat(draft.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Precio inválido");
      return;
    }

    setSaving((prev) => new Set(prev).add(itemId));

    try {
      const res = await fetch("/api/admin/menu-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, basePrice: parsed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error ?? "Error al guardar");
      }

      // Optimistic update in local state
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, basePrice: parsed } : item
          ),
        }))
      );

      setEditing((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });

      toast.success("Precio actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === "Enter") savePrice(itemId);
    if (e.key === "Escape") cancelEdit(itemId);
  };

  return (
    <div className="space-y-8">
      {/* Quick link to QR menu preview */}
      <div
        className="flex items-center gap-3 rounded-lg px-4 py-3"
        style={{
          background: "rgba(201,168,76,0.07)",
          border: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        <span className="font-body text-xs text-[var(--olive)]">
          Vista previa del menú QR:
        </span>
        <div className="flex items-center gap-3">
          {(["es", "en", "ar"] as const).map((loc) => (
            <Link
              key={loc}
              href={`/${loc}/menuqr`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-body text-xs text-[var(--gold)] hover:underline"
            >
              {loc.toUpperCase()}
              <ExternalLink size={10} />
            </Link>
          ))}
        </div>
      </div>

      {categories.map((cat) => (
        <section key={cat.id}>
          {/* Category header */}
          <div
            className="mb-3 flex items-center gap-3 pb-2"
            style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}
          >
            <h2 className="font-display text-lg text-[var(--gold)]">
              {cat.nameEn}
            </h2>
            <span className="font-body text-xs text-[var(--olive)]">
              · {cat.nameEs}
            </span>
          </div>

          {/* Items */}
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {cat.items.map((item) => {
              const isEditing = item.id in editing;
              const isSaving = saving.has(item.id);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  {/* Item name */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-body text-sm"
                      style={{ color: item.isAvailable ? "var(--espresso)" : "var(--olive)" }}
                    >
                      {item.nameEn}
                    </span>
                    {item.nameEs !== item.nameEn && (
                      <span className="ml-2 font-body text-xs text-[var(--olive)]">
                        · {item.nameEs}
                      </span>
                    )}
                    {!item.isAvailable && (
                      <span
                        className="ml-2 font-body text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          color: "#EF4444",
                        }}
                      >
                        No disponible
                      </span>
                    )}
                  </div>

                  {/* Price cell */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="flex items-center gap-1 rounded"
                        style={{
                          border: "1px solid rgba(201,168,76,0.5)",
                          background: "rgba(201,168,76,0.06)",
                          padding: "2px 6px",
                        }}
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editing[item.id]}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          onKeyDown={(e) => handleKeyDown(e, item.id)}
                          autoFocus
                          className="w-16 bg-transparent font-body text-sm text-[var(--espresso)] outline-none"
                          style={{ fontFamily: "Lora, serif" }}
                        />
                        <span className="font-body text-xs text-[var(--olive)]">€</span>
                      </div>

                      <button
                        onClick={() => savePrice(item.id)}
                        disabled={isSaving}
                        title="Guardar"
                        className="flex h-7 w-7 items-center justify-center rounded"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.3)",
                          color: "#22c55e",
                          cursor: isSaving ? "wait" : "pointer",
                        }}
                      >
                        {isSaving ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                      </button>

                      <button
                        onClick={() => cancelEdit(item.id)}
                        disabled={isSaving}
                        title="Cancelar"
                        className="flex h-7 w-7 items-center justify-center rounded"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "#EF4444",
                          cursor: isSaving ? "wait" : "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="font-display text-base font-semibold"
                        style={{ color: "var(--gold)", minWidth: "4rem", textAlign: "right" }}
                      >
                        {formatPriceWithTax(item.basePrice, item.taxRate ?? 10)}
                      </span>
                      <button
                        onClick={() => startEdit(item)}
                        title="Editar precio"
                        className="flex h-7 w-7 items-center justify-center rounded opacity-40 hover:opacity-100 transition-opacity"
                        style={{
                          border: "1px solid rgba(201,168,76,0.3)",
                          color: "var(--gold)",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="font-body text-xs text-[var(--olive)] opacity-60 mt-6">
        Los cambios de precio se aplican inmediatamente al menú QR en los 3 idiomas (ES · EN · AR).
      </p>
    </div>
  );
}
