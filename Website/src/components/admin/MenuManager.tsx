"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, ChevronDown, ChevronUp, Edit2, Trash2, Loader2,
  Eye, EyeOff, Star, GripVertical, Upload, X as XIcon
} from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { formatPriceWithTax } from "@/lib/menuPricing";
import type {
  MenuCategory, MenuItem, ItemVariant, ModifierGroup, Modifier
} from "@prisma/client";

type FullItem = MenuItem & {
  variants: ItemVariant[];
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[];
};
type FullCategory = MenuCategory & { items: FullItem[] };

type Props = { initialCategories: FullCategory[] };

export default function MenuManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState<"categories" | "items">("categories");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<FullItem | null>(null);
  const [showNewItem, setShowNewItem] = useState<string | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);

  // New category form
  const [newCatEs, setNewCatEs] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [newCatAr, setNewCatAr] = useState("");

  // New item form
  const [newItem, setNewItem] = useState({
    nameEs: "", nameEn: "", nameAr: "",
    descriptionEs: "", descriptionEn: "", descriptionAr: "",
    basePrice: "", imageUrl: "", allergens: "",
  });

  const [uploading, setUploading] = useState(false);
  // Edit item state
  const [editItemData, setEditItemData] = useState<{
    nameEs: string; nameEn: string; nameAr: string;
    descriptionEs: string; descriptionEn: string; descriptionAr: string;
    basePrice: string; imageUrl: string; allergens: string;
  } | null>(null);

  const inputClass = "w-full bg-[var(--cream)] border border-[var(--border)] rounded-lg px-3 py-2.5 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors";
  const arInputClass = inputClass + " text-right";

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      return data.url as string;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al subir imagen");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImagePick = async (onChange: (url: string) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/avif";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = await uploadImage(file);
      if (url) onChange(url);
    };
    input.click();
  };

  const createCategory = async () => {
    if (!newCatEs || !newCatEn) { toast.error("Completa nombre ES e EN"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEs: newCatEs,
          nameEn: newCatEn,
          nameAr: newCatAr || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories((c) => [...c, { ...data.category, items: [] }]);
      setNewCatEs(""); setNewCatEn(""); setNewCatAr(""); setShowNewCat(false);
      toast.success("Categoría creada");
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  };

  const toggleCatActive = async (catId: string, isActive: boolean) => {
    const res = await fetch(`/api/admin/menu/categories/${catId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      setCategories((cats) =>
        cats.map((c) => c.id === catId ? { ...c, isActive: !isActive } : c)
      );
    }
  };

  const createItem = async (categoryId: string) => {
    if (!newItem.nameEs || !newItem.basePrice) { toast.error("Nombre ES y precio requeridos"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          nameAr: newItem.nameAr || null,
          descriptionAr: newItem.descriptionAr || null,
          categoryId,
          basePrice: parseFloat(newItem.basePrice),
          allergens: newItem.allergens.split(",").map((a) => a.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories((cats) =>
        cats.map((c) =>
          c.id === categoryId
            ? { ...c, items: [...c.items, { ...data.item, variants: [], modifierGroups: [] }] }
            : c
        )
      );
      setNewItem({
        nameEs: "", nameEn: "", nameAr: "",
        descriptionEs: "", descriptionEn: "", descriptionAr: "",
        basePrice: "", imageUrl: "", allergens: "",
      });
      setShowNewItem(null);
      toast.success("Plato añadido");
    } catch { toast.error("Error al crear el plato"); }
    finally { setLoading(false); }
  };

  const toggleItemAvailable = async (itemId: string, catId: string, isAvailable: boolean) => {
    const res = await fetch(`/api/admin/menu/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    if (res.ok) {
      setCategories((cats) =>
        cats.map((c) =>
          c.id === catId
            ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, isAvailable: !isAvailable } : i) }
            : c
        )
      );
    }
  };

  const toggleItemFeatured = async (itemId: string, catId: string, isFeatured: boolean) => {
    const res = await fetch(`/api/admin/menu/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !isFeatured }),
    });
    if (res.ok) {
      setCategories((cats) =>
        cats.map((c) =>
          c.id === catId
            ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, isFeatured: !isFeatured } : i) }
            : c
        )
      );
    }
  };

  const deleteItem = async (itemId: string, catId: string) => {
    if (!confirm("¿Eliminar este plato?")) return;
    const res = await fetch(`/api/admin/menu/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((cats) =>
        cats.map((c) =>
          c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
        )
      );
      toast.success("Plato eliminado");
    }
  };

  const startEditItem = (item: FullItem) => {
    setEditingItem(item);
    setEditItemData({
      nameEs: item.nameEs,
      nameEn: item.nameEn ?? "",
      nameAr: item.nameAr ?? "",
      descriptionEs: item.descriptionEs ?? "",
      descriptionEn: item.descriptionEn ?? "",
      descriptionAr: item.descriptionAr ?? "",
      basePrice: String(Number(item.basePrice)),
      imageUrl: item.imageUrl ?? "",
      allergens: (item.allergens as string[]).join(", "),
    });
  };

  const saveEditItem = async (catId: string) => {
    if (!editingItem || !editItemData) return;
    if (!editItemData.nameEs || !editItemData.basePrice) {
      toast.error("Nombre ES y precio requeridos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/menu/items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEs: editItemData.nameEs,
          nameEn: editItemData.nameEn,
          nameAr: editItemData.nameAr || null,
          descriptionEs: editItemData.descriptionEs,
          descriptionEn: editItemData.descriptionEn,
          descriptionAr: editItemData.descriptionAr || null,
          basePrice: parseFloat(editItemData.basePrice),
          imageUrl: editItemData.imageUrl || null,
          allergens: editItemData.allergens.split(",").map((a) => a.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories((cats) =>
        cats.map((c) =>
          c.id === catId
            ? { ...c, items: c.items.map((i) => i.id === editingItem.id ? { ...i, ...data.item } : i) }
            : c
        )
      );
      setEditingItem(null);
      setEditItemData(null);
      toast.success("Plato actualizado");
    } catch { toast.error("Error al guardar"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Add category */}
      <div className="card-warm rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-[var(--espresso)]">Categorías</h2>
          <button
            onClick={() => setShowNewCat(!showNewCat)}
            className="flex items-center gap-2 btn-primary text-sm py-2 px-4"
          >
            <Plus size={14} /> Nueva categoría
          </button>
        </div>

        {showNewCat && (
          <div className="bg-[var(--muted)] rounded-xl p-4 mb-4 grid grid-cols-3 gap-3">
            <input
              className={inputClass}
              placeholder="Nombre en español"
              value={newCatEs}
              onChange={(e) => setNewCatEs(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Name in English"
              value={newCatEn}
              onChange={(e) => setNewCatEn(e.target.value)}
            />
            <input
              className={arInputClass}
              dir="rtl"
              lang="ar"
              placeholder="الاسم بالعربية (اختياري)"
              value={newCatAr}
              onChange={(e) => setNewCatAr(e.target.value)}
            />
            <div className="col-span-3 flex gap-2 justify-end">
              <button onClick={() => setShowNewCat(false)} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
              <button onClick={createCategory} disabled={loading} className="btn-primary text-sm py-1.5 px-4">
                {loading ? <Loader2 size={14} className="animate-spin" /> : null} Crear
              </button>
            </div>
          </div>
        )}

        {/* Categories list */}
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--warm-white)]">
                <GripVertical size={14} className="text-[var(--olive)]/30" />
                <button
                  onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="font-display text-lg text-[var(--espresso)]">{cat.nameEs}</span>
                  <span className="font-body text-xs text-[var(--olive)]">/ {cat.nameEn}</span>
                  {cat.nameAr && (
                    <span className="font-body text-xs text-[var(--olive)]" dir="rtl" lang="ar">/ {cat.nameAr}</span>
                  )}
                  <span className="font-body text-xs text-[var(--olive)] ml-auto">
                    {cat.items.length} platos
                  </span>
                  {expandedCat === cat.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => toggleCatActive(cat.id, cat.isActive)}
                  className={`p-1.5 rounded-lg transition-colors ${cat.isActive ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50"}`}
                  title={cat.isActive ? "Desactivar" : "Activar"}
                >
                  {cat.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>

              {/* Expanded items */}
              {expandedCat === cat.id && (
                <div className="border-t border-[var(--border)]">
                  {cat.items.map((item) => (
                    <div key={item.id} className="border-b border-[var(--border)]/50 last:border-0">
                      {/* Item row */}
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/50">
                        {/* Thumbnail */}
                        {item.imageUrl ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-0.5 bg-[#1A1500]">
                            <Image src={item.imageUrl} alt={item.nameEs} fill className="object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--muted)] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-sm text-[var(--espresso)] font-medium">{item.nameEs}</span>
                            {!item.isAvailable && (
                              <span className="font-body text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">No disponible</span>
                            )}
                            {item.isFeatured && <Star size={12} className="text-amber-500" />}
                          </div>
                          <span className="font-display text-sm text-[var(--terracotta)]">{formatPriceWithTax(item.basePrice, item.taxRate ?? 10)}</span>
                          {item.nameEn && <span className="ml-2 font-body text-xs text-[var(--olive)]">{item.nameEn}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleItemFeatured(item.id, cat.id, item.isFeatured)}
                            className={`p-1.5 rounded transition-colors ${item.isFeatured ? "text-amber-500" : "text-[var(--olive)]/40 hover:text-amber-400"}`}
                            title="Destacado">
                            <Star size={14} />
                          </button>
                          <button onClick={() => toggleItemAvailable(item.id, cat.id, item.isAvailable)}
                            className={`p-1.5 rounded transition-colors ${item.isAvailable ? "text-green-500 hover:text-green-700" : "text-red-400 hover:text-red-600"}`}
                            title={item.isAvailable ? "Desactivar" : "Activar"}>
                            {item.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => editingItem?.id === item.id ? (setEditingItem(null), setEditItemData(null)) : startEditItem(item)}
                            className={`p-1.5 rounded transition-colors ${editingItem?.id === item.id ? "text-[var(--gold)] bg-[var(--gold)]/10" : "text-[var(--olive)]/60 hover:text-[var(--gold)]"}`}
                            title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteItem(item.id, cat.id)}
                            className="p-1.5 rounded text-[var(--olive)]/40 hover:text-red-500 transition-colors"
                            title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Inline edit form */}
                      {editingItem?.id === item.id && editItemData && (
                        <div className="px-4 pb-4 bg-[var(--muted)]/60 border-t border-[var(--border)]/30">
                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <div>
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">Nombre (ES) *</label>
                              <input className={inputClass} value={editItemData.nameEs} onChange={(e) => setEditItemData({ ...editItemData, nameEs: e.target.value })} />
                            </div>
                            <div>
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">Name (EN)</label>
                              <input className={inputClass} value={editItemData.nameEn} onChange={(e) => setEditItemData({ ...editItemData, nameEn: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">الاسم (AR)</label>
                              <input className={arInputClass} dir="rtl" lang="ar" value={editItemData.nameAr} onChange={(e) => setEditItemData({ ...editItemData, nameAr: e.target.value })} />
                            </div>
                            <div>
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">Descripción (ES)</label>
                              <textarea rows={2} className={inputClass} value={editItemData.descriptionEs} onChange={(e) => setEditItemData({ ...editItemData, descriptionEs: e.target.value })} />
                            </div>
                            <div>
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">Description (EN)</label>
                              <textarea rows={2} className={inputClass} value={editItemData.descriptionEn} onChange={(e) => setEditItemData({ ...editItemData, descriptionEn: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">الوصف (AR)</label>
                              <textarea rows={2} className={arInputClass} dir="rtl" lang="ar" value={editItemData.descriptionAr} onChange={(e) => setEditItemData({ ...editItemData, descriptionAr: e.target.value })} />
                            </div>
                            <div>
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">Precio (€) *</label>
                              <input type="number" step="0.01" className={inputClass} value={editItemData.basePrice} onChange={(e) => setEditItemData({ ...editItemData, basePrice: e.target.value })} />
                            </div>
                            <div>
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">Imagen</label>
                              {editItemData.imageUrl ? (
                                <div className="flex items-center gap-2">
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[var(--border)] shrink-0 flex items-center justify-center p-0.5 bg-[#1A1500]">
                                    <Image src={editItemData.imageUrl} alt="preview" fill className="object-contain" />
                                  </div>
                                  <button type="button" onClick={() => setEditItemData({ ...editItemData, imageUrl: "" })} className="text-xs text-red-400 flex items-center gap-1">
                                    <XIcon size={12} /> Quitar
                                  </button>
                                </div>
                              ) : (
                                <button type="button" disabled={uploading}
                                  onClick={() => handleImagePick((url) => setEditItemData(d => d ? { ...d, imageUrl: url } : d))}
                                  className="w-full flex items-center gap-2 justify-center border border-dashed border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--olive)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors">
                                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                  {uploading ? "Subiendo..." : "Subir imagen"}
                                </button>
                              )}
                            </div>
                            <div className="col-span-2">
                              <label className="block font-body text-xs text-[var(--olive)] mb-1">Alérgenos (separados por coma)</label>
                              <input className={inputClass} placeholder="Gluten, Lácteos, Sésamo..." value={editItemData.allergens} onChange={(e) => setEditItemData({ ...editItemData, allergens: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end mt-3">
                            <button onClick={() => { setEditingItem(null); setEditItemData(null); }} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
                            <button onClick={() => saveEditItem(cat.id)} disabled={loading} className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2">
                              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Guardar cambios
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add item */}
                  {showNewItem === cat.id ? (
                    <div className="p-4 bg-[var(--muted)] space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input className={inputClass} placeholder="Nombre (ES) *" value={newItem.nameEs} onChange={(e) => setNewItem({ ...newItem, nameEs: e.target.value })} />
                        <input className={inputClass} placeholder="Name (EN)" value={newItem.nameEn} onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })} />
                        <input className={`${arInputClass} col-span-2`} dir="rtl" lang="ar" placeholder="الاسم بالعربية (اختياري)" value={newItem.nameAr} onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })} />
                        <textarea rows={2} className={inputClass} placeholder="Descripción (ES)" value={newItem.descriptionEs} onChange={(e) => setNewItem({ ...newItem, descriptionEs: e.target.value })} />
                        <textarea rows={2} className={inputClass} placeholder="Description (EN)" value={newItem.descriptionEn} onChange={(e) => setNewItem({ ...newItem, descriptionEn: e.target.value })} />
                        <textarea rows={2} className={`${arInputClass} col-span-2`} dir="rtl" lang="ar" placeholder="الوصف بالعربية (اختياري)" value={newItem.descriptionAr} onChange={(e) => setNewItem({ ...newItem, descriptionAr: e.target.value })} />
                        <input type="number" step="0.01" className={inputClass} placeholder="Precio base (€) *" value={newItem.basePrice} onChange={(e) => setNewItem({ ...newItem, basePrice: e.target.value })} />
                        {/* Image upload */}
                        <div>
                          {newItem.imageUrl ? (
                            <div className="flex items-center gap-2">
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[var(--border)] shrink-0 flex items-center justify-center p-0.5 bg-[#1A1500]">
                                <Image src={newItem.imageUrl} alt="preview" fill className="object-contain" />
                              </div>
                              <button type="button" onClick={() => setNewItem({ ...newItem, imageUrl: "" })} className="text-xs text-red-400 flex items-center gap-1">
                                <XIcon size={12} /> Quitar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={uploading}
                              onClick={() => handleImagePick((url) => setNewItem({ ...newItem, imageUrl: url }))}
                              className="w-full flex items-center gap-2 justify-center border border-dashed border-[var(--border)] rounded-lg px-3 py-3 text-sm text-[var(--olive)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
                            >
                              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                              {uploading ? "Subiendo..." : "Subir imagen"}
                            </button>
                          )}
                        </div>
                        <input className="col-span-2 w-full bg-[var(--cream)] border border-[var(--border)] rounded-lg px-3 py-2.5 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)]" placeholder="Alérgenos (separados por coma: Gluten, Lácteos...)" value={newItem.allergens} onChange={(e) => setNewItem({ ...newItem, allergens: e.target.value })} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowNewItem(null)} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
                        <button onClick={() => createItem(cat.id)} disabled={loading} className="btn-primary text-sm py-1.5 px-4">
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Añadir plato
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewItem(cat.id)}
                      className="w-full py-3 text-sm font-body text-[var(--terracotta)] hover:bg-[var(--muted)]/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Añadir plato a esta categoría
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
