"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2, Check, X } from "lucide-react";

type Table = { id: string; name: string; seats: number; isActive: boolean };

const inputClass = "w-full bg-[#0A0800] border border-[var(--border)] rounded-lg px-3 py-2 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--gold)] transition-colors";

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", seats: "" });
  const [newForm, setNewForm] = useState({ name: "", seats: "" });
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tables");
    setTables(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newForm.name || !newForm.seats) { toast.error("Nombre y asientos requeridos"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newForm.name, seats: Number(newForm.seats) }),
    });
    if (res.ok) {
      toast.success("Mesa creada");
      setNewForm({ name: "", seats: "" });
      setShowNew(false);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Error");
    }
    setSaving(false);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, seats: Number(editForm.seats) }),
    });
    if (res.ok) { toast.success("Mesa actualizada"); setEditingId(null); load(); }
    else { const d = await res.json(); toast.error(d.error ?? "Error"); }
    setSaving(false);
  };

  const toggle = async (id: string, current: boolean) => {
    await fetch(`/api/admin/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    load();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    const res = await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Mesa eliminada"); load(); }
    else { const d = await res.json(); toast.error(d.error ?? "Error"); }
  };

  if (loading) return <div className="p-8 flex items-center gap-2 text-[var(--olive)]"><Loader2 size={18} className="animate-spin" /> Cargando...</div>;

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl text-[var(--espresso)]">Mesas</h1>
          <p className="font-body text-sm text-[var(--olive)] mt-1">Gestiona el aforo y disposición de mesas.</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
          <Plus size={15} /> Nueva mesa
        </button>
      </div>

      {showNew && (
        <div className="card-warm rounded-xl p-5 mb-5">
          <h3 className="font-display text-lg text-[var(--espresso)] mb-4">Nueva mesa</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Nombre</label>
              <input className={inputClass} placeholder="Mesa 1, Barra..." value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Asientos</label>
              <input type="number" min={1} className={inputClass} placeholder="2" value={newForm.seats} onChange={(e) => setNewForm({ ...newForm, seats: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
            <button onClick={create} disabled={saving} className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Crear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tables.length === 0 && (
          <div className="card-warm rounded-xl p-8 text-center text-[var(--olive)] font-body text-sm">
            No hay mesas. Añade una para empezar.
          </div>
        )}
        {tables.map((t) => (
          <div key={t.id} className="card-warm rounded-xl p-4 flex items-center gap-4">
            {editingId === t.id ? (
              <>
                <input className={inputClass} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <input type="number" min={1} className={`${inputClass} w-24 shrink-0`} value={editForm.seats} onChange={(e) => setEditForm({ ...editForm, seats: e.target.value })} />
                <button onClick={() => saveEdit(t.id)} disabled={saving} className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors shrink-0">
                  <Check size={15} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-white/5 text-[var(--olive)] hover:text-[var(--espresso)] transition-colors shrink-0">
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="font-body text-sm font-semibold text-[var(--espresso)]">{t.name}</div>
                  <div className="font-body text-xs text-[var(--olive)]">{t.seats} asiento{t.seats !== 1 ? "s" : ""}</div>
                </div>
                <span className={`font-body text-xs px-2 py-0.5 rounded-full ${t.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {t.isActive ? "Activa" : "Inactiva"}
                </span>
                <button onClick={() => toggle(t.id, t.isActive)} className="font-body text-xs text-[var(--olive)] hover:text-[var(--gold)] transition-colors">
                  {t.isActive ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => { setEditingId(t.id); setEditForm({ name: t.name, seats: String(t.seats) }); }} className="p-1.5 rounded-lg text-[var(--olive)] hover:text-[var(--gold)] hover:bg-white/5 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(t.id, t.name)} className="p-1.5 rounded-lg text-[var(--olive)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
